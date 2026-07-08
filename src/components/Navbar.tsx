import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import ProfileEditModal from "./ProfileEditModal";
import GlobalSearch from "./GlobalSearch";

const Navbar = async () => {
  const session = await getSession();
  let profileData: Record<string, any> = {};
  let announcementCount = 0;
  let cartCount = 0;

  if (session?.userId && session?.role) {
    try {
      switch (session.role) {
        case "teacher": {
          const t = await prisma.teacher.findUnique({
            where: { id: session.userId },
            select: { name: true, email: true, phone: true, address: true, bloodType: true, sex: true, birthday: true, accountHolderName: true, bankName: true, accountNumber: true, ifsc: true, upiId: true, img: true },
          });
          if (t) profileData = t;
          break;
        }
        case "student": {
          const s = await prisma.student.findUnique({
            where: { id: session.userId },
            select: { name: true, email: true, phone: true, address: true, bloodType: true, sex: true, birthday: true, img: true },
          });
          if (s) profileData = s;
          break;
        }
        case "parent": {
          const p = await prisma.parent.findUnique({
            where: { id: session.userId },
            select: { name: true, email: true, phone: true, address: true },
          });
          if (p) profileData = p;
          break;
        }
        case "admin": {
          const a = await prisma.admin.findUnique({
            where: { id: session.userId },
            select: { username: true },
          });
          if (a) profileData = a;
          break;
        }
      }
    } catch { /* ignore */ }

    try {
      const systemNoticesFilter = [
        { title: { contains: "course awaiting review", mode: "insensitive" as const } },
        { title: { contains: "Withdrawal request", mode: "insensitive" as const } },
        { title: { contains: "Payout request", mode: "insensitive" as const } },
        { title: { contains: "teacher registered", mode: "insensitive" as const } },
        { title: { contains: "registration", mode: "insensitive" as const } },
        { authorRole: "system" },
      ];

      let announcementWhere: any = {};
      if (session.role !== "admin") {
        announcementWhere.NOT = systemNoticesFilter;
      }

      if (session.role === "teacher") {
        announcementWhere.OR = [
          { authorId: session.userId },
          { classId: null, authorRole: "admin" },
        ];
      } else if (session.role === "student") {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: session.userId },
          select: { course: { select: { instructorId: true } } },
        });
        const tIds = Array.from(new Set(enrollments.map((e) => e.course.instructorId)));
        announcementWhere.OR = [
          { authorRole: "admin", classId: null },
          ...(tIds.length > 0 ? [{ authorId: { in: tIds }, authorRole: "teacher" }] : []),
        ];
      } else if (session.role === "parent") {
        const children = await prisma.student.findMany({
          where: { parentId: session.userId },
          select: { id: true },
        });
        const cIds = children.map((c) => c.id);
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: { in: cIds } },
          select: { course: { select: { instructorId: true } } },
        });
        const tIds = Array.from(new Set(enrollments.map((e) => e.course.instructorId)));
        announcementWhere.OR = [
          { authorRole: "admin", classId: null },
          ...(tIds.length > 0 ? [{ authorId: { in: tIds }, authorRole: "teacher" }] : []),
        ];
      }
      announcementCount = await prisma.announcement.count({ where: announcementWhere });
    } catch { /* ignore */ }

    if (session.role === "student") {
      try {
        cartCount = await prisma.cart.count({ where: { studentId: session.userId } });
      } catch { /* ignore */ }
    }
  }

  const profileUrl =
    session?.role === "teacher"
      ? `/list/teachers/${session.userId}`
      : session?.role === "student"
      ? `/list/students/${session.userId}`
      : session?.role === "parent"
      ? `/list/parents/${session.userId}`
      : null;

  return (
    <div className="flex items-center justify-between p-4">
      {/* Search */}
      <GlobalSearch />
      {/* Right side */}
      <div className="flex items-center gap-6 justify-end w-full">
        <ThemeToggle />
        {session?.role === "student" && (
          <Link
            href="/cart"
            className="navbar-icon-btn bg-white dark:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative border border-transparent dark:border-white/[0.15]"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartCount > 0 && (
              <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-skillBlue text-white rounded-full text-xs font-bold shadow-sm">
                {cartCount > 99 ? "99+" : cartCount}
              </div>
            )}
          </Link>
        )}
        <Link
          href="/messages"
          className="navbar-icon-btn bg-white dark:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative border border-transparent dark:border-white/[0.15]"
        >
          <Image src="/message.png" alt="" width={20} height={20} />
        </Link>
        <Link
          href="/list/announcements"
          className="navbar-icon-btn bg-white dark:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative border border-transparent dark:border-white/[0.15]"
        >
          <Image src="/announcement.png" alt="" width={20} height={20} />
          {announcementCount > 0 && (
            <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs font-bold shadow-sm">
              {announcementCount > 99 ? "99+" : announcementCount}
            </div>
          )}
        </Link>

        {/* Profile Pill -> Navigates directly to full Profile View Page */}
        {session?.userId && profileUrl ? (
          <Link
            href={profileUrl}
            className="text-xs leading-3 font-medium text-gray-800 dark:text-gray-200 hover:text-skillBlue text-left flex items-center gap-2 cursor-pointer group"
            title="View full profile"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-zinc-700 shadow-sm group-hover:border-skillBlue transition">
              <img
                src={profileData.img || "/avatar.png"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs leading-3 font-medium text-gray-800 dark:text-[#f0f0f0] flex items-center gap-1 group-hover:text-skillBlue transition">
                {session?.username || "User"}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-[#6b6a60] capitalize">{session?.role}</span>
            </div>
          </Link>
        ) : session?.userId ? (
          <div className="text-xs leading-3 font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
              <img src={profileData.img || "/avatar.png"} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs leading-3 font-medium text-gray-800 dark:text-[#f0f0f0]">{session?.username}</span>
              <span className="text-[10px] text-gray-500 capitalize">{session?.role}</span>
            </div>
          </div>
        ) : null}

        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-xs text-gray-500 dark:text-[#6b6a60] hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 ml-2">
            <Image src="/logout.png" alt="" width={20} height={20} /> Logout
          </button>
        </form>
      </div>
    </div>
  );
};

export default Navbar;
