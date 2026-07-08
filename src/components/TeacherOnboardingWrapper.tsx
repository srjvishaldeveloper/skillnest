"use client";

import { useState } from "react";
import { TeacherOnboardingModal } from "./onboarding";

interface TeacherOnboardingWrapperProps {
  onboardingComplete: boolean;
  teacherName: string;
}

export default function TeacherOnboardingWrapper({
  onboardingComplete,
  teacherName,
}: TeacherOnboardingWrapperProps) {
  const [show, setShow] = useState(!onboardingComplete);
  if (!show) return null;
  return (
    <TeacherOnboardingModal
      teacherName={teacherName}
      onClose={() => setShow(false)}
    />
  );
}
