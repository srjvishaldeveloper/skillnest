import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const AdminCertificatesPage = async () => {
  const session = await getSession();

  if (session?.role !== "admin") {
    return (
      <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">
        <h1 className="text-lg font-semibold">Certificates</h1>
        <p className="mt-4 text-sm text-gray-400">Admin access only.</p>
      </div>
    );
  }

  const certificates = await prisma.certificate.findMany({
    orderBy: { issuedAt: "desc" },
    include: {
      student: { select: { name: true, username: true, img: true } },
      course: { select: { title: true, instructor: { select: { name: true } } } },
    },
  });

  const total = certificates.length;

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">All Certificates</h1>
        <p className="text-sm text-gray-500">{total} certificates issued</p>
      </div>

      {total === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No certificates issued yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-gray-400">
                <th className="py-3 pr-4 font-medium">Student</th>
                <th className="py-3 pr-4 font-medium">Course</th>
                <th className="py-3 pr-4 font-medium">Instructor</th>
                <th className="py-3 pr-4 font-medium">Code</th>
                <th className="py-3 pr-4 font-medium">Issued</th>
                <th className="py-3 pr-4 font-medium">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <Link href={`/list/students/${cert.studentId}`} className="font-medium hover:text-skillBlue">
                      {cert.student.name}
                    </Link>
                    <p className="text-xs text-gray-400">{cert.student.username}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-600">{cert.course.title}</td>
                  <td className="py-3 pr-4 text-xs text-gray-600">{cert.course.instructor.name}</td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-gray-400">{cert.code}</td>
                  <td className="py-3 pr-4 text-xs text-gray-500">
                    {new Intl.DateTimeFormat("en-GB").format(cert.issuedAt)}
                  </td>
                  <td>
                    <Link
                      href={`/certificate/${cert.code}`}
                      target="_blank"
                      className="rounded-md bg-skillBlue/10 px-3 py-1 text-xs font-medium text-skillBlue hover:bg-skillBlue/20"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCertificatesPage;
