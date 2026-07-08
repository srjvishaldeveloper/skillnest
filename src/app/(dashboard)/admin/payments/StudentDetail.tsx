"use client";

import { useState } from "react";

export default function StudentDetail({
  student,
}: {
  student: {
    id: string;
    name: string;
    email: string | null;
    username: string;
    phone: string | null;
    address: string;
    bloodType: string;
    sex: string | null;
    img: string | null;
    createdAt: Date;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-medium text-skillBlue hover:underline text-left"
      >
        {student.name}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Student Details</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{student.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Username</span>
                <span className="font-medium">{student.username}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{student.email || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{student.phone || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Address</span>
                <span className="font-medium">{student.address || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium">{student.sex || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Blood Group</span>
                <span className="font-medium">{student.bloodType || "—"}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium">
                  {new Date(student.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-md bg-gray-100 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
