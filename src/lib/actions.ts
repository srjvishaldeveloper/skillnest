"use server";

import { revalidatePath } from "next/cache";
import {
  AnnouncementSchema,
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { getSession } from "./auth";
import { deleteS3ByUrl } from "./s3";

type CurrentState = { success: boolean; error: boolean; message?: string };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password || "defaultpass123", 10);
    const id = `teacher_${Date.now()}`;

    await prisma.teacher.create({
      data: {
        id,
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const updateData: any = {
      username: data.username,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address,
      img: data.img || null,
      bloodType: data.bloodType,
      sex: data.sex,
      birthday: data.birthday,
      subjects: {
        set: data.subjects?.map((subjectId: string) => ({
          id: parseInt(subjectId),
        })),
      },
    };

    if (data.password && data.password !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.teacher.update({
      where: { id: data.id },
      data: updateData,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { img: true },
    });
    if (teacher) {
      await deleteS3ByUrl(teacher.img);
    }

    await prisma.teacher.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const hashedPassword = await bcrypt.hash(data.password || "defaultpass123", 10);
    const id = `student_${Date.now()}`;

    await prisma.student.create({
      data: {
        id,
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const updateData: any = {
      username: data.username,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address,
      img: data.img || null,
      bloodType: data.bloodType,
      sex: data.sex,
      birthday: data.birthday,
      gradeId: data.gradeId,
      classId: data.classId,
      parentId: data.parentId,
    };

    if (data.password && data.password !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.student.update({
      where: { id: data.id },
      data: updateData,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      select: { img: true },
    });
    if (student) {
      await deleteS3ByUrl(student.img);
    }

    await prisma.student.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
        notes: data.notes,
        pdfUrl: data.pdfUrl,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
        notes: data.notes,
        pdfUrl: data.pdfUrl,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(id) },
      select: { pdfUrl: true },
    });
    if (exam) {
      await deleteS3ByUrl(exam.pdfUrl);
    }

    await prisma.exam.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

const canManageAnnouncements = (role: string | undefined) =>
  role === "admin" || role === "teacher";

const cleanAnnouncementData = (data: AnnouncementSchema) => ({
  ...data,
  classId: data.classId && data.classId > 0 ? data.classId : null,
});

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  const session = await getSession();
  if (!session?.userId || !canManageAnnouncements(session.role)) {
    return { success: false, error: true, message: "Unauthorized" };
  }
  try {
    const author = session.role === "teacher"
      ? await prisma.teacher.findUnique({ where: { id: session.userId }, select: { name: true } })
      : null;
    await prisma.announcement.create({
      data: {
        ...cleanAnnouncementData(data),
        authorId: session.userId,
        authorRole: session.role,
        authorName: author?.name || session.username || "",
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  const session = await getSession();
  if (!session?.userId || !canManageAnnouncements(session.role)) {
    return { success: false, error: true, message: "Unauthorized" };
  }
  try {
    await prisma.announcement.update({
      where: { id: data.id },
      data: cleanAnnouncementData(data),
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const session = await getSession();
  if (!session?.userId || !canManageAnnouncements(session.role)) {
    return { success: false, error: true, message: "Unauthorized" };
  }
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const session = await getSession();
    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    if (session?.userId && session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.userId },
        select: { name: true },
      });
      await prisma.announcement.create({
        data: {
          title: `${teacher?.name || "Teacher"} added a new assignment`,
          description: `New assignment: "${data.title}". Due date: ${new Date(data.dueDate).toLocaleDateString("en-IN")}.`,
          date: new Date(),
          authorId: session.userId,
          authorRole: "teacher",
          authorName: teacher?.name || "Teacher",
          classId: null,
        },
      });
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createResult = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.result.create({
      data: {
        score: data.score,
        studentId: data.studentId,
        ...(data.examId ? { examId: data.examId } : {}),
        ...(data.assignmentId ? { assignmentId: data.assignmentId } : {}),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.result.update({
      where: { id: data.id },
      data: {
        score: data.score,
        studentId: data.studentId,
        ...(data.examId ? { examId: data.examId } : {}),
        ...(data.assignmentId ? { assignmentId: data.assignmentId } : {}),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createEvent = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        ...(data.classId ? { classId: data.classId } : {}),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        ...(data.classId ? { classId: data.classId } : {}),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.event.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
