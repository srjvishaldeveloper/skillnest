import InviteManager from "@/components/InviteManager";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

const InviteTeachersPage = async () => {
  const session = await getSession();
  const role = session?.role;
  const userId = session?.userId;

  let links: any[] = [];
  let subTeachers: any[] = [];
  let isSubTeacher = false;

  if (role === "teacher" && userId) {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { id: userId },
        select: { parentTeacherId: true },
      });
      isSubTeacher = !!teacher?.parentTeacherId;
    } catch (e) {
      console.error("DB error fetching teacher:", e);
    }

    try {
      links = await prisma.teacherInviteLink.findMany({
        where: { teacherId: userId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { invitedTeachers: true } } },
      });
    } catch (e) {
      console.error("DB error fetching links:", e);
    }

    try {
      subTeachers = await prisma.teacher.findMany({
        where: { parentTeacherId: userId },
        select: { id: true, name: true, email: true, username: true },
      });
    } catch (e) {
      console.error("DB error fetching sub-teachers:", e);
    }
  }

  if (role === "admin") {
    try {
      links = await prisma.teacherInviteLink.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { invitedTeachers: true } },
          teacher: { select: { name: true } },
        },
      });
    } catch (e) {
      console.error("DB error fetching all links:", e);
    }
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          {role === "admin" ? "All Invite Links" : "Invite Teachers"}
        </h1>
      </div>
      <InviteManager
        links={links}
        subTeachers={subTeachers}
        isSubTeacher={isSubTeacher}
        isAdmin={role === "admin"}
      />
    </div>
  );
};

export default InviteTeachersPage;