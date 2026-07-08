import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import PrintButton from "@/components/course/PrintButton";

export const metadata: Metadata = {
  title: "Certificate · SkillNest",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const CertificatePage = async ({
  params: { code },
}: {
  params: { code: string };
}) => {
  const cert = await prisma.certificate.findUnique({
    where: { code },
    include: {
      student: { select: { name: true } },
      course: {
        select: {
          title: true,
          instructor: { select: { name: true } },
        },
      },
    },
  });

  if (!cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171b12] p-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-[#1f2419] p-10 text-center">
          <div className="text-4xl">⚠️</div>
          <h1 className="mt-3 text-xl font-bold">Certificate not found</h1>
          <p className="mt-2 text-sm text-white/60">
            The code <span className="font-mono">{code}</span> does not match any
            SkillNest certificate.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-md bg-[#c5f82a] px-5 py-2 text-sm font-semibold text-black"
          >
            Back to SkillNest
          </Link>
        </div>
      </div>
    );
  }

  const verifyUrl = `${APP_URL}/certificate/${cert.code}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
    verifyUrl
  )}`;
  const issued = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(cert.issuedAt);

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* toolbar (hidden in print) */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <span className="inline-flex items-center gap-2 rounded-full bg-skillGreen/15 px-3 py-1 text-sm font-medium text-skillGreen">
            ✓ Verified Certificate
          </span>
          <PrintButton />
        </div>

        {/* certificate */}
        <div className="relative overflow-hidden rounded-2xl border-[6px] border-double border-skillBlue bg-white p-10 text-center shadow-xl print:rounded-none print:border-skillBlue print:shadow-none">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-skillBlue/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-skillPurple/10" />

          <div className="flex items-center justify-center gap-3">
            <Image
              src="/skillnest.png"
              alt="SkillNest"
              width={160}
              height={50}
              className="object-contain"
            />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-gray-400">
            Certificate of Completion
          </p>
          <p className="mt-6 text-sm text-gray-500">This certifies that</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-skillDark">
            {cert.student.name}
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            has successfully completed the course
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-skillBlue">
            {cert.course.title}
          </h2>

          <div className="mt-8 flex items-end justify-between">
            <div className="text-left">
              <p className="text-sm font-medium">
                {cert.course.instructor.name}
              </p>
              <p className="border-t border-gray-300 pt-1 text-xs text-gray-400">
                Instructor
              </p>
            </div>

            <img
              src={qr}
              alt="Verification QR"
              width={110}
              height={110}
              className="rounded-md border border-gray-200"
            />

            <div className="text-right">
              <p className="text-sm font-medium">{issued}</p>
              <p className="border-t border-gray-300 pt-1 text-xs text-gray-400">
                Date Issued
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-400">
            Certificate ID: <span className="font-mono">{cert.code}</span> · Verify at{" "}
            <span className="font-mono">{verifyUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;
