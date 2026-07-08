import AvatarLightbox from "@/components/AvatarLightbox";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import ProfileEditModal from "@/components/ProfileEditModal";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { approveTeacherAction } from "@/lib/courseActions";
import { Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params: { id },
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await getSession();
  const role = session?.role;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      parentTeacher: { select: { id: true, name: true } },
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
          courses: true,
        },
      },
    },
  });

  const subTeachers = role === "admin"
    ? await prisma.teacher.findMany({
        where: { parentTeacherId: id },
        select: { id: true, name: true, email: true, username: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  if (!teacher) {
    return notFound();
  }
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4 min-w-0 overflow-hidden">
            <AvatarLightbox
              src={teacher.img || "/noAvatar.png"}
              className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex flex-col gap-1 flex-1">
                  <h1 className="text-xl font-semibold leading-tight break-words" title={teacher.name}>{teacher.name}</h1>
                  {teacher.parentTeacher && (
                    <span className="text-[11px] text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-white/15 border border-transparent dark:border-white/10 px-2 py-0.5 rounded font-medium inline-block w-fit backdrop-blur-sm">
                      Sub-teacher of{" "}
                      <Link
                        href={`/list/teachers/${teacher.parentTeacher.id}`}
                        className="font-bold underline hover:text-skillBlue"
                      >
                        {teacher.parentTeacher.name}
                      </Link>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {role === "admin" && (
                    <FormContainer table="teacher" type="update" data={teacher} />
                  )}
                  {session?.userId === id && (
                    <ProfileEditModal
                      username=""
                      role="teacher"
                      currentData={{
                        id: teacher.id,
                        name: teacher.name,
                        email: teacher.email,
                        phone: teacher.phone,
                        address: teacher.address,
                        bloodType: teacher.bloodType,
                        sex: teacher.sex,
                        birthday: teacher.birthday,
                        accountHolderName: (teacher as any).accountHolderName,
                        bankName: (teacher as any).bankName,
                        accountNumber: (teacher as any).accountNumber,
                        ifsc: (teacher as any).ifsc,
                        upiId: (teacher as any).upiId,
                        panNumber: (teacher as any).panNumber,
                        aadharNumber: (teacher as any).aadharNumber,
                        certificateUrl: (teacher as any).certificateUrl,
                      }}
                      iconOnly
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                Instructor at SkillNest. Dedicated to empowering students through interactive learning and practical skill development.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium min-w-0">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-1.5 min-w-0">
                  <Image src="/blood.png" alt="" width={14} height={14} className="shrink-0" />
                  <span className="truncate">{teacher.bloodType || "N/A"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-1.5 min-w-0">
                  <Image src="/date.png" alt="" width={14} height={14} className="shrink-0" />
                  <span className="truncate">
                    {new Intl.DateTimeFormat("en-GB").format(teacher.birthday)}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-1.5 min-w-0" title={teacher.email || ""}>
                  <Image src="/mail.png" alt="" width={14} height={14} className="shrink-0" />
                  <span className="truncate">{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-1.5 min-w-0">
                  <Image src="/phone.png" alt="" width={14} height={14} className="shrink-0" />
                  <span className="truncate">{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
            {/* CARD */}
            <Link
              href={`/courses?teacherId=${teacher.id}`}
              className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] hover:shadow-md transition-shadow group"
            >
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold group-hover:text-skillBlue transition-colors">
                  {teacher._count.courses}
                </h1>
                <span className="text-sm text-gray-400 font-medium">View Courses &rarr;</span>
              </div>
            </Link>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher._count.lessons}
                </h1>
                <span className="text-sm text-gray-400">Sessions</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher._count.classes}
                </h1>
                <span className="text-sm text-gray-400">Batches</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Instructor&apos;s Schedule</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} date={searchParams.date} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {(role === "admin" || session?.userId === id) && (
          <div className="bg-white p-4 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-semibold">Payout & Bank Details</h1>
              {role === "admin" && !teacher.isVerified && (
                <form action={approveTeacherAction}>
                  <input type="hidden" name="teacherId" value={teacher.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-green-600 hover:bg-green-700 transition px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Instructor
                  </button>
                </form>
              )}
              {role === "admin" && teacher.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              {(teacher as any).accountHolderName && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">Account Holder:</span>
                  <span className="font-semibold text-gray-900 text-right truncate min-w-0" title={(teacher as any).accountHolderName}>{(teacher as any).accountHolderName}</span>
                </div>
              )}
              {(teacher as any).bankName && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">Bank Name:</span>
                  <span className="font-medium text-right truncate min-w-0" title={(teacher as any).bankName}>{(teacher as any).bankName}</span>
                </div>
              )}
              {(teacher as any).accountNumber && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">Account Number:</span>
                  <span className="font-mono font-medium text-right truncate min-w-0" title={(teacher as any).accountNumber}>{(teacher as any).accountNumber}</span>
                </div>
              )}
              {(teacher as any).ifsc && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">IFSC Code:</span>
                  <span className="font-mono font-medium text-right truncate min-w-0" title={(teacher as any).ifsc}>{(teacher as any).ifsc}</span>
                </div>
              )}
              {(teacher as any).upiId && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">UPI ID:</span>
                  <span className="font-semibold text-skillGreen text-right truncate min-w-0" title={(teacher as any).upiId}>{(teacher as any).upiId}</span>
                </div>
              )}
              {(teacher as any).panNumber && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">PAN Card No:</span>
                  <span className="font-mono font-semibold text-skillBlue text-right truncate min-w-0" title={(teacher as any).panNumber}>{(teacher as any).panNumber}</span>
                </div>
              )}
              {(teacher as any).aadharNumber && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">Aadhaar Card No:</span>
                  <span className="font-mono font-semibold text-purple-600 dark:text-purple-400 text-right truncate min-w-0" title={(teacher as any).aadharNumber}>{(teacher as any).aadharNumber}</span>
                </div>
              )}
              {(teacher as any).certificateUrl && (
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 min-w-0">
                  <span className="text-gray-400 shrink-0">Certificate:</span>
                  <a
                    href={(teacher as any).certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-skillBlue dark:text-blue-400 hover:underline font-semibold text-right truncate min-w-0 font-mono"
                    title="View Certificate"
                  >
                    View Document ↗
                  </a>
                </div>
              )}
              {!(teacher as any).bankName && !(teacher as any).upiId && !(teacher as any).panNumber && (
                <p className="text-gray-400 italic text-center py-2">No bank/PAN details added yet.</p>
              )}
            </div>
          </div>
        )}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
           <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/classes?supervisorId=${teacher.id}`}
            >
              Instructor&apos;s Batches
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              Instructor&apos;s Learners
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              Instructor&apos;s Sessions
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?teacherId=${teacher.id}`}
            >
              Instructor&apos;s Assessments
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?teacherId=${teacher.id}`}
            >
              Instructor&apos;s Projects
            </Link>
          </div>
        </div>
        {role === "admin" && subTeachers.length > 0 && (
          <div className="bg-white p-4 rounded-md">
            <h1 className="text-xl font-semibold">Sub-teachers ({subTeachers.length})</h1>
            <div className="mt-3 flex flex-col gap-2">
              {subTeachers.map((t) => (
                <Link
                  key={t.id}
                  href={`/list/teachers/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.email || t.username}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
