import { z } from "zod";

// Optional http(s)-only URL. Blocks javascript:/data:/vbscript: schemes
// that could become a stored-XSS sink in an href/src. Empty string allowed.
const optionalHttpUrl = z
  .string()
  .trim()
  .refine((u) => u === "" || /^(https?:\/\/|data:image\/)\S+$/i.test(u), {
    message: "Must be a valid http(s) URL or image file",
  })
  .optional();

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  year: z.coerce.number().optional(),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "Full name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "Full name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
  notes: z.string().optional(),
  pdfUrl: z.string().optional(),
});

export type ExamSchema = z.infer<typeof examSchema>;

// ===================== SkillNest LMS: Course Content =====================

export const courseSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Course title is required!" }),
  description: z.string().optional(),
  category: z.string().min(1, { message: "Category is required!" }),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  price: z.coerce.number().min(0, { message: "Price must be 0 or more!" }),
  img: optionalHttpUrl,
  trailerUrl: optionalHttpUrl,
  outcomes: z.string().optional(),
  maxStudents: z.coerce.number().min(0).optional(), // one outcome per line in the form
});

export type CourseSchema = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Module title is required!" }),
  courseId: z.coerce.number(),
});

export type ModuleSchema = z.infer<typeof moduleSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  date: z.coerce.date({ message: "Date is required!" }),
  classId: z.coerce.number().optional(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const courseLessonSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Lesson title is required!" }),
  videoUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  content: z.string().optional(),
  duration: z.coerce.number().min(0).optional(),
  isPreview: z.boolean().optional(),
  moduleId: z.coerce.number(),
});

export type CourseLessonSchema = z.infer<typeof courseLessonSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  lessonId: z.coerce.number({ message: "Session is required!" }),
  pdfUrl: z.string().optional(),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "Score is required!" }),
  studentId: z.string().min(1, { message: "Student is required!" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
});

export type ResultSchema = z.infer<typeof resultSchema>;

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  classId: z.coerce.number().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;
