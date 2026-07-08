"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { getSession } from "./auth";
import { notify } from "./notify";
import { publishPlatformEvent } from "./platformEvents";
import { tpl, ADMIN_EMAIL } from "./notifyTemplates";
import { deleteS3ByUrl } from "./s3";
import {
  CourseSchema,
  ModuleSchema,
  CourseLessonSchema,
} from "./formValidationSchemas";
import { scoreCourse } from "./courseQualityEngine";
import { callClaude, aiConfigured } from "./ai";

type ActionState = { success: boolean; error: boolean; message?: string };

// Issue a certificate once:
//  1. Teacher has marked the course as completed (courseCompleted === true), AND
//  2. Student has watched every lesson (LessonProgress covers all).
// Idempotent — safe to call repeatedly.
async function maybeIssueCertificate(studentId: string, courseId: number) {
  // Guard 1: course must be teacher-marked as completed
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { courseCompleted: true },
  });
  if (!course?.courseCompleted) return null;

  // Guard 2: every lesson must be watched
  const totalLessons = await prisma.courseLesson.count({
    where: { module: { courseId } },
  });
  if (totalLessons === 0) return null;

  const done = await prisma.lessonProgress.count({
    where: { studentId, lesson: { module: { courseId } } },
  });
  if (done < totalLessons) return null;

  const existing = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) return existing;

  const code =
    "SN-" +
    Math.random().toString(36).slice(2, 8).toUpperCase() +
    "-" +
    Date.now().toString(36).slice(-4).toUpperCase();

  const cert = await prisma.certificate.create({
    data: { studentId, courseId, code },
  });

  // certificate email
  const [student, courseInfo] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { email: true, name: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    }),
  ]);
  if (student?.email && courseInfo) {
    const t = tpl.certificate(student.name, courseInfo.title, code);
    await notify({ email: { to: student.email, subject: t.subject, html: t.html } });
  }

  // Tell JobNest a course was completed -> sync verified skills onto the
  // candidate profile and re-score job matches. Idempotency key is keyed on the
  // certificate code so a replay never double-applies.
  const courseSkills = await prisma.courseSkill.findMany({
    where: { courseId },
    select: { skillSlug: true },
  });
  await publishPlatformEvent({
    event: "CourseCompleted",
    actorUserId: studentId,
    email: student?.email ?? null,
    idempotencyKey: `course-completed:${code}`,
    payload: {
      course_id: courseId,
      course_title: courseInfo?.title,
      skills: courseSkills.map((cs) => cs.skillSlug),
      credential_code: code,
      credential_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/certificate/${code}`,
    },
  });

  return cert;
}

// "one outcome per line" textarea -> string[]
const parseOutcomes = (raw?: string) =>
  (raw || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

// Evaluate quality score and process auto-approval
async function evaluateAndProcessCourseApproval(courseId: number) {
  // 1. Fetch full course details
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      courseSkills: { select: { skillSlug: true } },
      modules: {
        include: {
          lessons: {
            select: {
              title: true,
              duration: true,
              isPreview: true,
              videoUrl: true,
              content: true,
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  // 2. Fetch instructor details
  const teacher = await prisma.teacher.findUnique({
    where: { id: course.instructorId },
    select: {
      id: true,
      isVerified: true,
      name: true,
      email: true,
    },
  });

  if (!teacher) return null;

  // 3. Fetch instructor's last 10 published courses and their reviews
  const publishedCourses = await prisma.course.findMany({
    where: { instructorId: teacher.id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      category: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  // 4. Map into CourseInput and TeacherInput
  const courseInput = {
    title: course.title,
    description: course.description,
    category: course.category,
    outcomes: course.outcomes,
    courseSkills: course.courseSkills.map((cs) => cs.skillSlug),
    modules: course.modules.map((m) => ({
      lessons: m.lessons.map((l) => ({
        title: l.title,
        duration: l.duration,
        isPreview: l.isPreview,
        videoUrl: l.videoUrl,
        content: l.content,
      })),
    })),
  };

  const teacherInput = {
    isVerified: teacher.isVerified,
    publishedCourses,
  };

  // 5. Score Course
  const result = await scoreCourse(courseInput, teacherInput);

  // 6. Check for auto-approval
  if (result.autoApprove && teacher.isVerified) {
    // Approve the course!
    await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        published: true,
        reviewNote: null,
        qualityScore: result.total,
        qualityNotes: JSON.stringify(result.breakdown),
      },
    });

    // Notify instructor
    if (teacher.email) {
      const t = tpl.courseApproved(teacher.name, course.title, courseId);
      await notify({ email: { to: teacher.email, subject: t.subject, html: t.html } });
    }

    // Create Live Announcement
    await prisma.announcement.create({
      data: {
        title: `New Course Live: ${course.title}`,
        description: `Instructor ${teacher.name} has published a new course "${course.title}". Check it out now on SkillNest!`,
        date: new Date(),
        authorId: teacher.id,
        authorRole: "teacher",
        authorName: teacher.name,
        classId: null,
      },
    });
    
    return { autoApproved: true, score: result.total };
  } else {
    // Stays PENDING (or update to PENDING on submission), save qualityScore/qualityNotes
    await prisma.course.update({
      where: { id: courseId },
      data: {
        qualityScore: result.total,
        qualityNotes: JSON.stringify(result.breakdown),
      },
    });
    return { autoApproved: false, score: result.total };
  }
}

/* ============================ COURSES ============================ */

export const createCourse = async (
  currentState: ActionState,
  data: CourseSchema
): Promise<ActionState> => {
  try {
    const session = await getSession();
    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return { success: false, error: true, message: "Not authorized" };
    }

    // A course must be owned by a valid instructor (Teacher). Teachers own
    // their own courses; an admin authoring one assigns it to an instructor.
    let instructorId: string;
    if (session.role === "teacher") {
      const me = await prisma.teacher.findUnique({
        where: { id: session.userId },
      });
      if (!me) {
        return { success: false, error: true, message: "Instructor account not found." };
      }
      if (!me.isVerified) {
        return {
          success: false,
          error: true,
          message: "Your profile is not verified. Please wait for a confirmation email from the admin.",
        };
      }
      instructorId = me.id;
    } else {
      const teacher = await prisma.teacher.findFirst();
      if (!teacher) {
        return {
          success: false,
          error: true,
          message: "No instructor exists yet. Create an instructor first, or sign in as one.",
        };
      }
      instructorId = teacher.id;
    }

    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description || "",
        category: data.category,
        level: data.level,
        price: data.price,
        img: data.img || null,
        trailerUrl: data.trailerUrl || null,
        outcomes: parseOutcomes(data.outcomes),
        maxStudents: data.maxStudents || null,
        instructorId,
        status: "PENDING",
      },
    });

    // Run scoring on initial creation (will stay PENDING and save initial breakdown)
    await evaluateAndProcessCourseApproval(course.id);

    // notify admins about the new pending course
    const instructor = await prisma.teacher.findUnique({
      where: { id: instructorId },
      select: { name: true },
    });
    const instructorName = instructor?.name || "A teacher";
    if (ADMIN_EMAIL) {
      const t = tpl.courseSubmitted(instructorName, data.title);
      await notify({ email: { to: ADMIN_EMAIL, subject: t.subject, html: t.html } });
    }

    // Notify admin via announcement
    await prisma.announcement.create({
      data: {
        title: `New course awaiting review: ${data.title}`,
        description: `${instructorName} submitted "${data.title}" for approval. Category: ${data.category}, Price: ₹${data.price}.`,
        date: new Date(),
        authorId: instructorId,
        authorRole: "teacher",
        authorName: instructorName,
        classId: null,
      },
    });

    revalidatePath("/courses");
    revalidatePath("/admin/approvals");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: "Could not create course. Please try again.",
    };
  }
};

export const updateCourse = async (
  currentState: ActionState,
  data: CourseSchema
): Promise<ActionState> => {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: true };

    await prisma.course.update({
      where: {
        id: data.id,
        // instructors can only edit their own courses
        ...(session.role === "teacher" ? { instructorId: session.userId } : {}),
      },
      data: {
        title: data.title,
        description: data.description || "",
        category: data.category,
        level: data.level,
        price: data.price,
        trailerUrl: data.trailerUrl || null,
        outcomes: parseOutcomes(data.outcomes),
        maxStudents: data.maxStudents || null,
        ...(data.img ? { img: data.img } : {}),
      },
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${data.id}`);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteCourse = async (
  currentState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: true };
    const id = Number(formData.get("id"));

    const course = await prisma.course.findUnique({
      where: { id },
      select: { img: true, trailerUrl: true, instructorId: true },
    });
    if (!course) return { success: false, error: true, message: "Course not found" };
    if (session.role === "teacher" && course.instructorId !== session.userId) {
      return { success: false, error: true, message: "Not authorized" };
    }

    await Promise.all([
      deleteS3ByUrl(course.img),
      deleteS3ByUrl(course.trailerUrl),
    ]);

    await prisma.course.delete({ where: { id } });

    revalidatePath("/courses");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteCourseById = async (courseId: number) => {
  const session = await getSession();
  if (!session) return;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;
  if (session.role === "teacher" && course.instructorId !== session.userId) return;

  await Promise.all([
    deleteS3ByUrl(course.img),
    deleteS3ByUrl(course.trailerUrl),
  ]);

  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/courses");
};

// Map a course to canonical JobNest skill slugs (CourseSkill). These power the
// HubNest skill-gap recommendations and what CourseCompleted verifies onto a
// candidate's JobNest profile. Replaces the full set in one call.
export const setCourseSkills = async (
  courseId: number,
  slugs: string[]
): Promise<ActionState> => {
  const session = await getSession();
  if (!session) return { success: false, error: true, message: "Not authenticated" };
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { success: false, error: true, message: "Course not found" };
  if (session.role === "teacher" && course.instructorId !== session.userId) {
    return { success: false, error: true, message: "Not allowed" };
  }

  // Normalize: slugify, dedupe, drop empties, cap to a sane number.
  const normalized = Array.from(
    new Set(
      (slugs || [])
        .map((s) =>
          s
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        )
        .filter(Boolean)
    )
  ).slice(0, 30);

  await prisma.$transaction([
    prisma.courseSkill.deleteMany({ where: { courseId } }),
    ...(normalized.length
      ? [
          prisma.courseSkill.createMany({
            data: normalized.map((skillSlug) => ({ courseId, skillSlug })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  revalidatePath(`/courses/${courseId}`);
  return { success: true, error: false };
};

export const togglePublish = async (courseId: number) => {
  const session = await getSession();
  if (!session) return;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;
  if (session.role === "teacher" && course.instructorId !== session.userId) return;

  await prisma.course.update({
    where: { id: courseId },
    data: { published: !course.published },
  });
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
};

/* ============================ APPROVAL WORKFLOW ============================ */

// Instructor submits a draft/rejected course for admin review.
export const submitForReview = async (courseId: number) => {
  const session = await getSession();
  if (!session) return { success: false };
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { success: false };
  if (session.role === "teacher" && course.instructorId !== session.userId)
    return { success: false };

  // need at least one lesson before submitting
  const lessons = await prisma.courseLesson.count({
    where: { module: { courseId } },
  });
  if (lessons === 0)
    return { success: false, message: "Add at least one lesson first" };

  await prisma.course.update({
    where: { id: courseId },
    data: { status: "PENDING", reviewNote: null },
  });

  // Generate AI summaries for all lessons that do not have one yet
  await ensureAllLessonSummaries(courseId);

  // Evaluate for auto-approval
  const scoreResult = await evaluateAndProcessCourseApproval(courseId);

  // notify admins only if NOT auto-approved
  if (scoreResult && !scoreResult.autoApproved) {
    if (ADMIN_EMAIL) {
      const full = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, instructor: { select: { name: true } } },
      });
      if (full) {
        const t = tpl.courseSubmitted(
          full.instructor.name,
          full.title
        );
        await notify({ email: { to: ADMIN_EMAIL, subject: t.subject, html: t.html } });
      }
    }
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/admin/approvals");
  return {
    success: true,
    message: scoreResult?.autoApproved
      ? "Course auto-approved and published successfully!"
      : "Submitted for admin review successfully.",
  };
};

// load instructor email + course title for approval emails
async function courseInstructorContact(courseId: number) {
  return prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      instructorId: true,
      instructor: { select: { email: true, name: true, id: true } },
    },
  });
}

// Admin approves -> course goes live.
export const approveCourse = async (courseId: number) => {
  const session = await getSession();
  if (session?.role !== "admin") return;
  await prisma.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", published: true, reviewNote: null },
  });

  const c = await courseInstructorContact(courseId);
  if (c) {
    if (c.instructor.email) {
      const t = tpl.courseApproved(c.instructor.name, c.title, courseId);
      await notify({ email: { to: c.instructor.email, subject: t.subject, html: t.html } });
    }

    // Create Announcement for Students that Course is Live
    await prisma.announcement.create({
      data: {
        title: `New Course Live: ${c.title}`,
        description: `Instructor ${c.instructor.name} has published a new course "${c.title}". Check it out now on SkillNest!`,
        date: new Date(),
        authorId: c.instructorId,
        authorRole: "teacher",
        authorName: c.instructor.name,
        classId: null,
      },
    });
  }

  revalidatePath("/admin/approvals");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/browse");
};

// Admin rejects with a note -> back to instructor.
export const rejectCourse = async (courseId: number, reason: string) => {
  const session = await getSession();
  if (session?.role !== "admin") return;
  const note = reason.trim() || "Please revise and resubmit.";
  await prisma.course.update({
    where: { id: courseId },
    data: { status: "REJECTED", published: false, reviewNote: note },
  });

  const c = await courseInstructorContact(courseId);
  if (c?.instructor.email) {
    const t = tpl.courseRejected(c.instructor.name, c.title, note, courseId);
    await notify({ email: { to: c.instructor.email, subject: t.subject, html: t.html } });
  }

  revalidatePath("/admin/approvals");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/browse");
};

// Admin can take a live course offline.
/* ============================ TEACHER VERIFICATION ============================ */

export const approveTeacher = async (teacherId: string) => {
  const session = await getSession();
  if (session?.role !== "admin") return { success: false };

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return { success: false };

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { isVerified: true, verifiedAt: new Date() },
  });

  if (teacher.email) {
    const t = tpl.teacherVerified(teacher.name);
    await notify({ email: { to: teacher.email, subject: t.subject, html: t.html } });
  }

  revalidatePath("/list/teachers");
  return { success: true };
};

export const approveTeacherAction = async (formData: FormData) => {
  const teacherId = formData.get("teacherId") as string;
  if (!teacherId) return { success: false };
  return approveTeacher(teacherId);
};

export const unpublishCourse = async (courseId: number) => {
  const session = await getSession();
  if (session?.role !== "admin") return;
  await prisma.course.update({
    where: { id: courseId },
    data: { status: "DRAFT", published: false },
  });
  revalidatePath("/admin/approvals");
  revalidatePath("/browse");
};

/* ============================ MODULES ============================ */

export const createModule = async (
  currentState: ActionState,
  data: ModuleSchema
): Promise<ActionState> => {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: true };

    const count = await prisma.module.count({ where: { courseId: data.courseId } });
    await prisma.module.create({
      data: { title: data.title, courseId: data.courseId, order: count },
    });

    // Notify students via announcement when a new module is added
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { title: true, instructorId: true, instructor: { select: { name: true } } },
    });
    if (course && session.role === "teacher") {
      await prisma.announcement.create({
        data: {
          title: `${course.instructor.name} added a new module`,
          description: `New module "${data.title}" added to course "${course.title}".`,
          date: new Date(),
          authorId: course.instructorId,
          authorRole: "teacher",
          authorName: course.instructor.name,
          classId: null,
        },
      });
    }

    revalidatePath(`/courses/${data.courseId}`);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteModule = async (moduleId: number, courseId: number) => {
  const session = await getSession();
  if (!session) return;

  const lessons = await prisma.courseLesson.findMany({
    where: { moduleId },
    select: { videoUrl: true, pdfUrl: true },
  });
  await Promise.all(
    lessons.flatMap((l) => [deleteS3ByUrl(l.videoUrl), deleteS3ByUrl(l.pdfUrl)])
  );

  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/courses/${courseId}`);
};

/* ============================ LESSONS ============================ */

export const createLesson = async (
  currentState: ActionState,
  data: CourseLessonSchema
): Promise<ActionState> => {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: true };

    const count = await prisma.courseLesson.count({
      where: { moduleId: data.moduleId },
    });
    const lesson = await prisma.courseLesson.create({
      data: {
        title: data.title,
        videoUrl: data.videoUrl || null,
        pdfUrl: data.pdfUrl || null,
        content: data.content || "",
        duration: data.duration || 0,
        isPreview: data.isPreview || false,
        moduleId: data.moduleId,
        order: count,
      },
    });

    // ── notify enrolled students ──
    const mod = await prisma.module.findUnique({
      where: { id: data.moduleId },
      select: { courseId: true },
    });
    if (mod && session.role === "teacher") {
      const [course, teacher, enrolled] = await Promise.all([
        prisma.course.findUnique({
          where: { id: mod.courseId },
          select: { title: true, instructorId: true },
        }),
        prisma.teacher.findUnique({
          where: { id: session.userId },
          select: { name: true },
        }),
        prisma.enrollment.findMany({
          where: { courseId: mod.courseId },
          include: { student: { select: { name: true, email: true } } },
        }),
      ]);

      if (course) {
        const authorName = teacher?.name || session.username || "Teacher";
        const contentType = data.videoUrl ? "video lesson" : data.pdfUrl ? "lesson notes" : "lesson";
        const announcementTitle = `${authorName} added a new ${contentType}`;

        await prisma.announcement.create({
          data: {
            title: announcementTitle,
            description: `New ${contentType}: ${data.title}${data.content ? `\n\n${data.content.slice(0, 200)}` : ""}`,
            date: new Date(),
            authorId: session.userId,
            authorRole: "teacher",
            authorName,
            classId: null,
          },
        });

        for (const enrollment of enrolled) {
          const student = enrollment.student;
          if (student.email) {
            const t = tpl.newContent(student.name, course.title, authorName, contentType, data.title, mod.courseId);
            notify({ email: { to: student.email, subject: t.subject, html: t.html } });
          }
        }
      }
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (lessonId: number, courseId: number) => {
  const session = await getSession();
  if (!session) return;

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: { videoUrl: true, pdfUrl: true },
  });
  if (lesson) {
    await Promise.all([
      deleteS3ByUrl(lesson.videoUrl),
      deleteS3ByUrl(lesson.pdfUrl),
    ]);
  }

  await prisma.courseLesson.delete({ where: { id: lessonId } });
  revalidatePath(`/courses/${courseId}`);
};

/* ============================ ENROLLMENT ============================ */

export const enrollCourse = async (courseId: number) => {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { success: false, error: true, message: "Only learners can enroll" };
  }

  try {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: { studentId: session.userId, courseId },
      },
      create: { studentId: session.userId, courseId },
      update: {},
    });
    revalidatePath("/my-learning");
    revalidatePath(`/learn/${courseId}`);

    // enrollment confirmation email
    const [student, course] = await Promise.all([
      prisma.student.findUnique({
        where: { id: session.userId },
        select: { email: true, name: true },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      }),
    ]);
    if (student?.email && course) {
      const t = tpl.enrolled(student.name, course.title, courseId);
      await notify({ email: { to: student.email, subject: t.subject, html: t.html } });
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

/* ============================ PROGRESS ============================ */

// Called automatically when student finishes watching a video (client fires onEnded).
// One-way only: marks a lesson as watched; never un-marks it.
export const markLessonWatched = async (
  lessonId: number,
  courseId: number
) => {
  const session = await getSession();
  if (!session || session.role !== "student") return;

  // Idempotent upsert — safe to call multiple times
  const existing = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId: session.userId, lessonId } },
  });

  if (!existing) {
    await prisma.lessonProgress.create({
      data: { studentId: session.userId, lessonId },
    });
  }

  // Try to issue certificate (no-op if conditions not yet met)
  await maybeIssueCertificate(session.userId, courseId);

  revalidatePath(`/learn/${courseId}`);
  revalidatePath("/my-learning");
  revalidatePath("/certificates");
};

// Manual claim (e.g. for learners who completed before certificates existed)
export const claimCertificate = async (courseId: number) => {
  const session = await getSession();
  if (!session || session.role !== "student") return { success: false };
  const cert = await maybeIssueCertificate(session.userId, courseId);
  revalidatePath("/certificates");
  revalidatePath(`/learn/${courseId}`);
  return { success: !!cert, code: cert?.code };
};

// Teacher marks the course content as finalized.
// Once set, students who have watched all lessons will get auto-certificate.
export const markCourseCompleted = async (courseId: number) => {
  const session = await getSession();
  if (!session || (session.role !== "teacher" && session.role !== "admin"))
    return { success: false };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { success: false };
  if (session.role === "teacher" && course.instructorId !== session.userId)
    return { success: false };

  // Generate summaries for all lessons
  await ensureAllLessonSummaries(courseId);

  await prisma.course.update({
    where: { id: courseId },
    data: { courseCompleted: true },
  });

  // Trigger certificate issuance for all enrolled students who have finished all lessons
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { studentId: true },
  });
  await Promise.all(
    enrollments.map((e) => maybeIssueCertificate(e.studentId, courseId))
  );

  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/learn/${courseId}`);
  return { success: true };
};

/* ============================ WISHLIST ============================ */

export const toggleWishlist = async (courseId: number) => {
  const session = await getSession();
  if (!session || session.role !== "student") return { success: false };

  const existing = await prisma.wishlist.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlist.create({
      data: { studentId: session.userId, courseId },
    });
  }

  revalidatePath("/wishlist");
  revalidatePath("/browse");
  revalidatePath(`/course/${courseId}`);
  return { success: true, wishlisted: !existing };
};

/* ============================ REVIEWS ============================ */

export const addReview = async (
  courseId: number,
  rating: number,
  comment: string
) => {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { success: false, error: true, message: "Only learners can review" };
  }

  // must be enrolled to review
  const enrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });
  if (!enrolled) {
    return { success: false, error: true, message: "Enroll before reviewing" };
  }

  const safeRating = Math.min(5, Math.max(1, Math.round(rating)));

  await prisma.review.upsert({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
    create: {
      studentId: session.userId,
      courseId,
      rating: safeRating,
      comment: comment.trim(),
    },
    update: { rating: safeRating, comment: comment.trim() },
  });

  // notify the instructor about the new review
  const [course, reviewer] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, instructor: { select: { email: true, name: true } } },
    }),
    prisma.student.findUnique({
      where: { id: session.userId },
      select: { name: true },
    }),
  ]);
  if (course?.instructor.email && reviewer) {
    const t = tpl.newReview(
      course.instructor.name,
      course.title,
      safeRating,
      reviewer.name,
      courseId
    );
    await notify({
      email: { to: course.instructor.email, subject: t.subject, html: t.html },
    });
  }

  revalidatePath(`/course/${courseId}`);
  return { success: true, error: false };
};

export const deleteReview = async (courseId: number) => {
  const session = await getSession();
  if (!session || session.role !== "student") return;
  await prisma.review
    .delete({
      where: { studentId_courseId: { studentId: session.userId, courseId } },
    })
    .catch(() => {});
  revalidatePath(`/course/${courseId}`);
};

/* ============================ FAQS ============================ */

export const createFaq = async (
  courseId: number,
  question: string,
  answer: string
) => {
  const session = await getSession();
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    return { success: false, message: "Not authorized" };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { success: false, message: "Course not found" };
  if (session.role === "teacher" && course.instructorId !== session.userId) {
    return { success: false, message: "Not authorized" };
  }

  const count = await prisma.courseFaq.count({ where: { courseId } });
  await prisma.courseFaq.create({
    data: { question: question.trim(), answer: answer.trim(), courseId, order: count },
  });

  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
};

export const updateFaq = async (
  faqId: number,
  courseId: number,
  question: string,
  answer: string
) => {
  const session = await getSession();
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    return { success: false, message: "Not authorized" };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { success: false, message: "Course not found" };
  if (session.role === "teacher" && course.instructorId !== session.userId) {
    return { success: false, message: "Not authorized" };
  }

  await prisma.courseFaq.update({
    where: { id: faqId },
    data: { question: question.trim(), answer: answer.trim() },
  });

  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
};

export const deleteFaq = async (faqId: number, courseId: number) => {
  const session = await getSession();
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    return { success: false, message: "Not authorized" };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { success: false, message: "Course not found" };
  if (session.role === "teacher" && course.instructorId !== session.userId) {
    return { success: false, message: "Not authorized" };
  }

  await prisma.courseFaq.delete({ where: { id: faqId } });

  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
};

export const generateLessonSummary = async (lessonId: number) => {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      content: true,
      videoUrl: true,
      moduleId: true,
      module: {
        select: {
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) return { success: false, message: "Lesson not found" };

  if (!aiConfigured()) {
    return { success: false, message: "AI not configured. Add ANTHROPIC_API_KEY in .env." };
  }

  const prompt = `Write a concise, professional, and clear AI summary (between 2 to 3 sentences) for this course lesson video/content.
Course: "${lesson.module.course.title}"
Category: "${lesson.module.course.category}"
Module: "${lesson.module.title}"
Lesson: "${lesson.title}"
Content notes: "${lesson.content || "No text description provided"}"
Video Link: "${lesson.videoUrl || "None"}"

Summarize exactly what topics this lesson covers and what students will learn from it. Write it in direct, learner-friendly language. No markdown, no bold text.`;

  const result = await callClaude({
    system: "You are an expert curriculum summarizer. Write a concise, 2-3 sentence summary of the lesson.",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 250,
  });

  if (!result.ok || !result.text) {
    return { success: false, message: result.error || "AI generation failed" };
  }

  const summary = result.text.trim();

  await prisma.courseLesson.update({
    where: { id: lessonId },
    data: { summary },
  });

  revalidatePath(`/learn/${lesson.module.course.id}`);
  revalidatePath(`/courses/${lesson.module.course.id}`);
  return { success: true, summary };
};

export async function ensureAllLessonSummaries(courseId: number) {
  if (!aiConfigured()) return;

  const lessons = await prisma.courseLesson.findMany({
    where: {
      module: { courseId },
      summary: null,
    },
    select: { id: true },
  });

  for (const lesson of lessons) {
    try {
      await generateLessonSummary(lesson.id);
    } catch (e) {
      console.error(`Failed to auto-generate summary for lesson ${lesson.id}`, e);
    }
  }
}
