import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student", "parent", "affiliate"],
      },
      {
        icon: "/result.png",
        label: "Affiliate Dashboard",
        href: "/affiliate",
        visible: ["affiliate"],
      },
   
      {
        icon: "/subject.png",
        label: "My Courses",
        href: "/courses",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/result.png",
        label: "Analytics",
        href: "/instructor/analytics",
        visible: ["teacher"],
      },
      {
        icon: "/singleClass.png",
        label: "Course Approvals",
        href: "/admin/approvals",
        visible: ["admin"],
      },
      {
        icon: "/result.png",
        label: "Platform Analytics",
        href: "/admin/analytics",
        visible: ["admin"],
      },
      {
        icon: "/result.png",
        label: "Certificates",
        href: "/admin/certificates",
        visible: ["admin"],
      },
      {
        icon: "/lesson.png",
        label: "Browse Courses",
        href: "/browse",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "My Learning",
        href: "/my-learning",
        visible: ["student"],
      },
      {
        icon: "/calendar.png",
        label: "Cart",
        href: "/cart",
        visible: ["student"],
      },
      {
        icon: "/result.png",
        label: "AI Tutor",
        href: "/ai-tutor",
        visible: ["student", "teacher", "admin"],
      },
      {
        icon: "/calendar.png",
        label: "Wishlist",
        href: "/wishlist",
        visible: ["student"],
      },
      {
        icon: "/result.png",
        label: "Certificates",
        href: "/certificates",
        visible: ["student"],
      },
      {
        icon: "/teacher.png",
        label: "Instructors",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Learners",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/parent.png",
        label: "Guardians",
        href: "/list/parents",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        label: "Courses",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/setting.png",
        label: "CMS",
        href: "/admin/cms",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Batches",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/lesson.png",
        label: "Sessions",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/exam.png",
        label: "Assessments",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.png",
        label: "Projects",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "Scores",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    title: "SKILLNEST",
    items: [
      {
        icon: "/lesson.png",
        label: "Learning Paths",
        href: "/list/learning-paths",
        visible: ["admin", "teacher", "student", "parent"],
        badge: "Coming Soon",
      },

      {
        icon: "/subject.png",
        label: "Skill Badges",
        href: "/list/badges",
        visible: ["admin", "teacher", "student", "parent"],
        badge: "Coming Soon",
      },
    ],
  },
  {
    title: "CODING",
    items: [
      {
        icon: "/exam.png",
        label: "Problems",
        href: "/problems",
        visible: ["admin", "teacher", "student"],
        badge: "Coming Soon",
      },
      {
        icon: "/lesson.png",
        label: "Playground",
        href: "/playground",
        visible: ["admin", "teacher", "student"],
        badge: "Coming Soon",
      },
      {
        icon: "/result.png",
        label: "Submissions",
        href: "/submissions",
        visible: ["admin", "teacher", "student"],
        badge: "Coming Soon",
      },
      {
        icon: "/class.png",
        label: "Leaderboard",
        href: "/leaderboard",
        visible: ["admin", "teacher", "student"],
        badge: "Coming Soon",
      },
      {
        icon: "/calendar.png",
        label: "Contests",
        href: "/contests",
        visible: ["admin", "teacher", "student"],
        badge: "Coming Soon",
      },
      {
        icon: "/singleClass.png",
        label: "Manage Problems",
        href: "/admin/problems",
        visible: ["admin"],
        badge: "Coming Soon",
      },
      {
        icon: "/singleClass.png",
        label: "Manage Contests",
        href: "/list/contests",
        visible: ["admin", "teacher"],
        badge: "Coming Soon",
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/singleClass.png",
        label: "Invite Teachers",
        href: "/list/invite-teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/result.png",
        label: "Teacher Payouts",
        href: "/admin/payouts",
        visible: ["admin"],
      },
      {
        icon: "/result.png",
        label: "Sub-Teacher Payouts",
        href: "/teacher/payouts",
        visible: ["teacher"],
      },
      {
        icon: "/setting.png",
        label: "Bank Details",
        href: "/admin/bank-details",
        visible: ["admin"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/api/auth/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = async () => {
  const session = await getSession();
  const role = session?.role || "";


let isSubTeacher = false;

if (role === "teacher" && session?.userId) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.userId },
      select: {
        parentTeacherId: true,
      },
    });

    isSubTeacher = !!teacher?.parentTeacherId;
  } catch (error) {
    console.error("Database unavailable:", error);
    isSubTeacher = false;
  }
}
   


  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 dark:text-white/25 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            const badge = "badge" in item ? (item as { badge?: string }).badge : undefined;
            if (!item.visible.includes(role)) return null;
            if ((item.label === "Invite Teachers" || item.label === "Sub-Teacher Payouts") && isSubTeacher) return null;

            // Logout posts to the API route (POST is not prefetched, so it
            // won't accidentally destroy the session on render like a Link would).
            if (item.label === "Logout") {
              return (
                <form action={item.href} method="POST" key={item.label}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center lg:justify-start gap-4 text-gray-500 dark:text-[#6b6a60] py-2 md:px-2 rounded-md hover:bg-lamaSkyLight dark:hover:bg-white/10 dark:hover:text-red-400"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span className="hidden lg:block dark:text-[#a8a79c]">{item.label}</span>
                  </button>
                </form>
              );
            }

            // "Coming Soon" items are future features with no page yet —
            // render them as non-clickable so they don't fall through to login.
            if (badge) {
              return (
                <div
                  key={item.label}
                  title={`${item.label} — ${badge}`}
                  aria-disabled="true"
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-400 dark:text-[#a8a79c] py-2 md:px-2 rounded-md cursor-not-allowed opacity-60 select-none dark:hover:bg-white/10"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block dark:text-[#aaa]">{item.label}</span>
                  <span className="hidden lg:block ml-auto text-[10px] bg-skillYellow text-white px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                </div>
              );
            }

            // "Home" should land on the role dashboard, not the public landing page
            const href =
              item.label === "Home" && role ? `/${role}` : item.href;

            return (
              <Link
                href={href}
                key={item.label}
                className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 dark:text-[#a8a79c] py-2 md:px-2 rounded-md hover:bg-lamaSkyLight dark:hover:bg-white/10"
              >
                <Image src={item.icon} alt="" width={20} height={20} />
                <span className="hidden lg:block dark:text-[#aaa]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
