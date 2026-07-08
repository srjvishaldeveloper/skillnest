"use client";

import { useState } from "react";
import StudentDetail from "./StudentDetail";

type Instructor = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  address: string;
  bloodType: string;
  sex: string | null;
  img: string | null;
  createdAt: Date;
};

type Buyer = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  address: string;
  bloodType: string;
  sex: string | null;
  img: string | null;
  createdAt: Date;
};

export default function CourseCard({
  courseTitle,
  instructor,
  buyers,
}: {
  courseTitle: string;
  instructor: Instructor;
  buyers: Buyer[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-medium">{courseTitle}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {buyers.length} student{buyers.length !== 1 ? "s" : ""} • {instructor.name}
          </p>
        </div>
        <span className={`transition-transform text-gray-400 ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
          {/* Instructor Details */}
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Instructor
          </h3>
          <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md bg-white p-3 text-sm">
            <div>
              <span className="text-gray-400">Name</span>
              <p className="font-medium">{instructor.name}</p>
            </div>
            <div>
              <span className="text-gray-400">Username</span>
              <p className="font-medium">{instructor.username}</p>
            </div>
            <div>
              <span className="text-gray-400">Email</span>
              <p>{instructor.email || "—"}</p>
            </div>
            <div>
              <span className="text-gray-400">Phone</span>
              <p>{instructor.phone || "—"}</p>
            </div>
            <div>
              <span className="text-gray-400">Address</span>
              <p>{instructor.address || "—"}</p>
            </div>
            <div>
              <span className="text-gray-400">Gender</span>
              <p>{instructor.sex || "—"}</p>
            </div>
            <div>
              <span className="text-gray-400">Blood Group</span>
              <p>{instructor.bloodType || "—"}</p>
            </div>
            <div>
              <span className="text-gray-400">Joined</span>
              <p>{new Date(instructor.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Buyers List */}
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Buyers ({buyers.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {buyers.map((s) => (
              <div key={s.id} className="rounded bg-white px-3 py-2 text-sm">
                <StudentDetail student={s} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
