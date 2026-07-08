import Announcements from "@/components/Announcements";
import FormContainer from "@/components/FormContainer";
import ProfileEditModal from "@/components/ProfileEditModal";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleParentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const session = await getSession();
  const role = session?.role;

  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      students: true,
    },
  });

  if (!parent) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row bg-[#f8f9fa] dark:bg-zinc-950">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-[#eaf4fc] dark:bg-zinc-900 py-6 px-4 rounded-xl flex-1 flex gap-4 border border-gray-200/80 dark:border-zinc-800">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-300 dark:border-zinc-700 shadow-sm">
              <img
                src="/avatar.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4 text-gray-900 dark:text-white">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className="text-xl font-bold leading-tight">{parent.name}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  {role === "admin" && (
                    <FormContainer table="parent" type="update" data={parent} />
                  )}
                  {session?.userId === id && (
                    <ProfileEditModal
                      username={parent.username}
                      role="parent"
                      currentData={parent}
                      iconOnly
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Guardian Account linked to learners.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-semibold">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{parent.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{parent.phone || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/home.png" alt="" width={14} height={14} />
                  <span>{parent.address || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LINKED CHILDREN CARD */}
          <div className="flex-1 bg-white dark:bg-[#18181b] p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <h2 className="text-md font-bold mb-3 text-gray-900 dark:text-white">Linked Learners (Children)</h2>
            <div className="flex flex-col gap-3">
              {parent.students.length === 0 ? (
                <p className="text-xs text-gray-500">No student profiles linked to this parent account.</p>
              ) : (
                parent.students.map((student) => (
                  <Link
                    key={student.id}
                    href={`/list/students/${student.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0">
                      <img src={student.img || "/avatar.png"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{student.name}</h4>
                      <p className="text-[10px] text-gray-500">Username: {student.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements />
      </div>
    </div>
  );
};

export default SingleParentPage;
