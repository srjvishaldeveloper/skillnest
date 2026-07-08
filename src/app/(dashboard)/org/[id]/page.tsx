import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AssignMemberForm, RemoveMemberButton } from "@/components/saas/OrgMembers";

const OrgDetailPage = async ({ params: { id } }: { params: { id: string } }) => {
  const session = await getSession();
  const orgId = parseInt(id);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      teachers: { select: { id: true, name: true, username: true } },
      students: { select: { id: true, name: true, username: true } },
    },
  });
  if (!org) return notFound();

  // only super-admins can edit membership
  let isSuper = false;
  if (session?.role === "admin") {
    const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
    isSuper = !!admin?.isSuper;
  }

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-4">
      <div className="mb-1 flex items-center gap-2 text-sm">
        <Link href="/superadmin" className="text-gray-400 hover:underline">
          Super Admin
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium">{org.name}</span>
      </div>

      <div className="rounded-3xl bg-skillDark px-6 py-5 text-white">
        <h1 className="text-xl font-semibold">{org.name}</h1>
        <p className="mt-1 text-sm text-white/70">
          Plan: {org.plan} · {org.teachers.length} instructors · {org.students.length} learners
        </p>
      </div>

      {isSuper && (
        <div className="rounded-md bg-white p-5">
          <h2 className="font-semibold">Add a member</h2>
          <p className="mb-3 text-xs text-gray-400">
            Add an existing instructor or learner to this organization by username.
          </p>
          <AssignMemberForm orgId={org.id} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md bg-white p-5">
          <h2 className="font-semibold">Instructors ({org.teachers.length})</h2>
          <div className="mt-3 flex flex-col gap-2">
            {org.teachers.length === 0 && <p className="text-sm text-gray-400">None yet.</p>}
            {org.teachers.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                <span>
                  {t.name}{" "}
                  <span className="text-xs text-gray-400">@{t.username}</span>
                </span>
                {isSuper && <RemoveMemberButton memberId={t.id} type="teacher" orgId={org.id} />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-white p-5">
          <h2 className="font-semibold">Learners ({org.students.length})</h2>
          <div className="mt-3 flex flex-col gap-2">
            {org.students.length === 0 && <p className="text-sm text-gray-400">None yet.</p>}
            {org.students.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                <span>
                  {s.name}{" "}
                  <span className="text-xs text-gray-400">@{s.username}</span>
                </span>
                {isSuper && <RemoveMemberButton memberId={s.id} type="student" orgId={org.id} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgDetailPage;
