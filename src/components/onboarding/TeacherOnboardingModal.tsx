"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, ShieldCheck, Clock, Mail, CheckCircle2 } from "lucide-react";

interface TeacherOnboardingModalProps {
  onClose: () => void;
  teacherName: string;
}

type Step = 1 | 2 | 3 | 4;

interface FormData {
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  website: string;
  linkedin: string;
  youtube: string;
  category: string;
  qualification: string;
  accountHolderName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;
  panNumber: string;
  aadharNumber: string;
  certificateUrl: string;
}

const steps = [
  { num: 1, label: "Profile" },
  { num: 2, label: "Expertise" },
  { num: 3, label: "Payout" },
  { num: 4, label: "Review" },
];

const categories = [
  { value: "dev", label: "Development & Programming" },
  { value: "data", label: "Data Science & AI" },
  { value: "biz", label: "Business & Entrepreneurship" },
  { value: "design", label: "Design & Creativity" },
  { value: "marketing", label: "Marketing & Sales" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "personal", label: "Personal Development" },
  { value: "language", label: "Language Learning" },
  { value: "health", label: "Health & Fitness" },
];

const skillMap: Record<string, string[]> = {
  dev: ["JavaScript","React","Node.js","TypeScript","Next.js","Vue.js","Angular","Flutter","Swift","Kotlin","C++","Go","Rust","GraphQL","Docker"],
  data: ["Python","Machine Learning","Deep Learning","Data Analysis","SQL","Power BI","TensorFlow","PyTorch","Statistics","NLP","Computer Vision","Tableau","Spark","R"],
  biz: ["Entrepreneurship","Product Management","Business Strategy","Leadership","Project Management","Lean Startup","OKRs","Business Analysis","Operations","Supply Chain"],
  design: ["UI/UX Design","Figma","Adobe XD","Graphic Design","Motion Graphics","Illustrator","Photoshop","Canva","3D Modeling","Brand Identity"],
  marketing: ["Digital Marketing","SEO","Content Marketing","Social Media","Email Marketing","Google Ads","Meta Ads","Copywriting","Analytics","Growth Hacking"],
  finance: ["Financial Modeling","Accounting","Stock Market","Investing","GST & Taxation","Excel for Finance","Crypto","Valuation","FP&A","CFA Prep"],
  personal: ["Public Speaking","Time Management","Productivity","Mindfulness","Communication","Critical Thinking","Negotiation","Goal Setting","Emotional Intelligence"],
  language: ["English Speaking","Hindi","French","German","Spanish","IELTS Prep","TOEFL","Japanese","Business English","Sanskrit"],
  health: ["Yoga","Fitness Training","Nutrition","Meditation","Weight Loss","Strength Training","Mental Health","Ayurveda","Running","Sports Coaching"],
};

const experienceLevels = ["Brand new", "1\u20133 years", "4\u20137 years", "8+ years"];

const qualifications = [
  { value: "graduate", label: "Graduate (B.Tech / B.Sc / BA)" },
  { value: "postgraduate", label: "Post Graduate (M.Tech / M.Sc)" },
  { value: "phd", label: "PhD / Doctorate" },
  { value: "certification", label: "Industry Certification" },
  { value: "selftaught", label: "Self-taught Professional" },
];

const allLanguages = ["English", "Hindi", "Tamil", "Telugu", "Marathi", "Bengali", "Kannada"];

export default function TeacherOnboardingModal({ onClose, teacherName }: TeacherOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<"terms" | "agreement" | null>(null);
  const [agreements, setAgreements] = useState<{ termsOfService: string; instructorAgreement: string } | null>(null);

  useEffect(() => {
    fetch("/api/cms/agreements")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) {
          setAgreements(data.content);
        }
      })
      .catch((err) => console.error("Failed to load agreements", err));
  }, []);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    website: "",
    linkedin: "",
    youtube: "",
    category: "",
    qualification: "selftaught",
    accountHolderName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
    panNumber: "",
    aadharNumber: "",
    certificateUrl: "",
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["English"]);
  const [selectedExp, setSelectedExp] = useState("1\u20133 years");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [currentStep]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleLang = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleClose = () => {
    if (submitted) {
      onClose();
    } else {
      const confirmed = window.confirm("Close onboarding? Progress will be saved.");
      if (confirmed) onClose();
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      if (!formData.accountHolderName.trim()) {
        alert("Account Holder Name is required.");
        return;
      }
      if (!formData.bankAccountNumber.trim()) {
        alert("Bank Account Number is required.");
        return;
      }
      if (!formData.ifscCode.trim()) {
        alert("IFSC Code is required.");
        return;
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!formData.panNumber.trim() || !panRegex.test(formData.panNumber)) {
        alert("A valid 10-digit PAN Card Number (e.g., ABCDE1234F) is required.");
        return;
      }
      const aadharRegex = /^[0-9]{12}$/;
      if (!formData.aadharNumber.trim() || !aadharRegex.test(formData.aadharNumber)) {
        alert("A valid 12-digit Aadhaar Card Number is required.");
        return;
      }
    }
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const handleSkip = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step);
  };

  const handleCategoryChange = (value: string) => {
    updateField("category", value);
    const skills = skillMap[value] || [];
    setSelectedSkills(skills.slice(0, 3));
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCert(true);
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload?folder=uploads", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      updateField("certificateUrl", data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCert(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      alert("You must agree to the Terms of Service and Instructor Agreement to submit.");
      return;
    }
    try {
      // First save profile data
      const updateRes = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "teacher",
          data: {
            accountHolderName: formData.accountHolderName,
            accountNumber: formData.bankAccountNumber,
            ifsc: formData.ifscCode,
            upiId: formData.upiId,
            panNumber: formData.panNumber,
            aadharNumber: formData.aadharNumber,
            certificateUrl: formData.certificateUrl,
          },
        }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok || !updateData.success) {
        throw new Error(updateData.error || "Failed to save profile details");
      }

      await fetch('/api/teacher/complete-onboarding', { method: 'POST' });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Onboarding failed");
      return;
    } finally {
      setSubmitted(true);
    }
  };

  const availableSkills = formData.category ? skillMap[formData.category] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
      <div className="w-full max-w-[490px] overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#c8ff00] text-[14px] font-bold text-[#0d0d0d]">
              S
            </div>
            <span className="text-[15px] font-bold text-[#c8ff00]">SkillNest</span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#3a3a3a] bg-[#2a2a2a] text-[#aaa] transition-colors hover:bg-[#3a3a3a] hover:text-[#f0f0f0]"
          >
            <X size={13} />
          </button>
        </div>

        {/* Step Progress Bar */}
        {!submitted && (
          <div className="flex items-center justify-between px-9 pt-3 pb-1">
            {steps.map((step, idx) => {
              const isDone = currentStep > step.num;
              const isActive = currentStep === step.num;
              return (
                <div key={step.num} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {isDone ? (
                      <CheckCircle2 size={26} className="fill-[#c8ff00] stroke-[#0d0d0d] text-[#c8ff00]" />
                    ) : (
                      <div
                        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 text-[11px] font-medium ${
                          isActive
                            ? "border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]"
                            : "border-[#3a3a3a] bg-[#1a1a1a] text-[#555]"
                        }`}
                      >
                        {step.num}
                      </div>
                    )}
                    {idx < steps.length - 1 && (
                      <div
                        className={`mx-1.5 h-[2px] min-w-[10px] flex-1 ${
                          isDone ? "bg-[#c8ff00]" : "bg-[#2e2e2e]"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-1 whitespace-nowrap text-[10px] ${
                      isActive
                        ? "font-medium text-[#c8ff00]"
                        : isDone
                        ? "text-[#777]"
                        : "text-[#555]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div
          ref={bodyRef}
          className="overflow-y-auto px-6 py-[22px]"
          style={{ maxHeight: "430px" }}
        >
          {submitted ? (
            /* ==================== SUCCESS SCREEN ==================== */
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <div className="mb-5 flex h-20 w-20 animate-[scaleIn_0.4s_ease-out] items-center justify-center rounded-full border-2 border-[#c8ff00] bg-[#c8ff00]/10">
                <Check size={36} color="#c8ff00" />
              </div>
              <h2 className="mb-2 text-[22px] font-semibold text-[#f0f0f0]">
                Application Submitted!
              </h2>
              <p className="mb-6 text-[13px] leading-relaxed text-[#888]">
                Your profile is being reviewed by our admin team.
              </p>
              <div className="mb-5 h-px w-full bg-[#2e2e2e]" />
              <div className="mb-7 flex w-full flex-col gap-3 text-left">
                <div className="flex items-start gap-3">
                  <Clock size={15} className="mt-0.5 shrink-0 text-[#c8ff00]" />
                  <span className="text-[13px] text-[#999]">
                    Profile goes live within 24 hours of approval
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={15} className="mt-0.5 shrink-0 text-[#c8ff00]" />
                  <span className="text-[13px] text-[#999]">
                    You&apos;ll receive a confirmation email once verified
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full cursor-pointer rounded-lg bg-[#c8ff00] py-3 text-[13px] font-bold text-[#0d0d0d] transition-colors hover:bg-[#b5e600]"
              >
                Go to Dashboard →
              </button>
            </div>
          ) : currentStep === 1 ? (
            /* ==================== STEP 1: Profile ==================== */
            <div className="flex flex-col gap-4">
              <p className="mb-1 text-[22px] font-semibold text-[#f0f0f0]">
                Hello, {teacherName}! 👋
              </p>
              <p className="mb-5 text-[13px] leading-relaxed text-[#888]">
                Let&apos;s set up your instructor profile. It only takes a few minutes.
              </p>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Headline
                </label>
                <input
                  value={formData.headline}
                  onChange={(e) => updateField("headline", e.target.value.slice(0, 60))}
                  placeholder="e.g. Full Stack Developer | 5+ years | React & Node.js"
                  className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                />
                <div className="flex items-center justify-between">
                  <span className="mt-[3px] text-[11px] text-[#555]">
                    Shown below your name on your profile.
                  </span>
                  <span className="mt-[2px] text-right text-[11px] text-[#555]">
                    {formData.headline.length}/60
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value.slice(0, 500))}
                  placeholder="e.g. I'm a software engineer with 6 years of industry experience. I've worked at startups and product companies, and I love breaking down complex topics into simple, practical lessons..."
                  className="min-h-[76px] w-full resize-y rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] leading-relaxed text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                  rows={4}
                />
                <span className="mt-[2px] block text-right text-[11px] text-[#555]">
                  {formData.bio.length}/500
                </span>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Website <span className="text-[#555]">(optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                />
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Social links <span className="text-[#555]">(optional)</span>
                </label>
                <div className="flex mb-2">
                  <span className="rounded-l-lg border border-r-0 border-[#2e2e2e] bg-[#111] px-[10px] py-[10px] text-[11px] text-[#555] whitespace-nowrap">
                    🔗 linkedin.com/in/
                  </span>
                  <input
                    value={formData.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    placeholder="username"
                    className="flex-1 rounded-r-lg border border-[#2e2e2e] bg-[#111] px-[11px] py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                  />
                </div>
                <div className="flex">
                  <span className="rounded-l-lg border border-r-0 border-[#2e2e2e] bg-[#111] px-[10px] py-[10px] text-[11px] text-[#555] whitespace-nowrap">
                    ▶ youtube.com/@
                  </span>
                  <input
                    value={formData.youtube}
                    onChange={(e) => updateField("youtube", e.target.value)}
                    placeholder="channel"
                    className="flex-1 rounded-r-lg border border-[#2e2e2e] bg-[#111] px-[11px] py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                  />
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* ==================== STEP 2: Expertise ==================== */
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#f0f0f0]">
                  Your teaching expertise
                </h2>
                <p className="mt-0.5 text-[12px] text-[#888]">
                  Choose your category — skill topics will update automatically.
                </p>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Primary category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors focus:border-[#c8ff00]"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Skill topics
                </label>
                {!formData.category ? (
                  <p className="text-[12px] italic text-[#555]">
                    ← Select a category first
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSkills.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`cursor-pointer rounded-full border-[1.5px] px-3 py-[6px] text-[12px] transition-all ${
                            selectedSkills.includes(skill)
                              ? "border-[#c8ff00] bg-[#c8ff00]/10 font-medium text-[#c8ff00]"
                              : "border-[#2e2e2e] bg-[#111] text-[#aaa] hover:border-[#c8ff00] hover:text-[#c8ff00]"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                    <span className="mt-[3px] block text-[11px] text-[#555]">
                      Select 3–8 topics you&apos;ll teach
                    </span>
                  </>
                )}
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Teaching experience
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {experienceLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedExp(level)}
                      className={`cursor-pointer rounded-full border-[1.5px] px-3 py-[6px] text-[12px] transition-all ${
                        selectedExp === level
                          ? "border-[#c8ff00] bg-[#c8ff00]/10 font-medium text-[#c8ff00]"
                          : "border-[#2e2e2e] bg-[#111] text-[#aaa] hover:border-[#c8ff00] hover:text-[#c8ff00]"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Highest qualification
                </label>
                <select
                  value={formData.qualification}
                  onChange={(e) => updateField("qualification", e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors focus:border-[#c8ff00]"
                >
                  {qualifications.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Teaching language
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLang(lang)}
                      className={`cursor-pointer rounded-full border-[1.5px] px-3 py-[6px] text-[12px] transition-all ${
                        selectedLangs.includes(lang)
                          ? "border-[#c8ff00] bg-[#c8ff00]/10 font-medium text-[#c8ff00]"
                          : "border-[#2e2e2e] bg-[#111] text-[#aaa] hover:border-[#c8ff00] hover:text-[#c8ff00]"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* ==================== STEP 3: Payout ==================== */
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#f0f0f0]">
                  Set up payouts
                </h2>
                <p className="mt-0.5 text-[12px] text-[#888]">
                  Your earnings will be transferred directly to your bank account.
                </p>
              </div>

              <div className="mb-[14px] flex items-start gap-[9px] rounded-[9px] border border-[#c8ff00]/25 bg-[#c8ff00]/[0.07] p-[11px]">
                <span className="text-[12px] leading-relaxed text-[#b5d900]">
                  💸 Earnings are transferred directly to your bank account via NEFT/IMPS.
                </span>
              </div>

              <div className="mb-[14px] rounded-xl border border-[#2e2e2e] bg-[#111] p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                      Account holder name
                    </label>
                    <input
                      value={formData.accountHolderName}
                      onChange={(e) => updateField("accountHolderName", e.target.value)}
                      placeholder="e.g. Rahul Kumar Singh"
                      className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                    />
                    <span className="mt-[3px] block text-[11px] text-[#555]">
                      As per your bank records
                    </span>
                  </div>
                  <div>
                    <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                      Bank account number
                    </label>
                    <input
                      value={formData.bankAccountNumber}
                      onChange={(e) => updateField("bankAccountNumber", e.target.value.slice(0, 18))}
                      maxLength={18}
                      placeholder="e.g. 9876543210123"
                      className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                    />
                  </div>
                  <div>
                    <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                      IFSC code
                    </label>
                    <input
                      value={formData.ifscCode}
                      onChange={(e) => updateField("ifscCode", e.target.value.toUpperCase().slice(0, 11))}
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] uppercase text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                    />
                    <span className="mt-[3px] block text-[11px] text-[#555]">
                      11-character code on your cheque book or passbook
                    </span>
                  </div>
                  <div>
                    <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                      UPI ID <span className="text-[#555]">(optional — for faster payouts)</span>
                    </label>
                    <input
                      value={formData.upiId}
                      onChange={(e) => updateField("upiId", e.target.value)}
                      placeholder="e.g. rahul@upi"
                      className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  PAN number <span className="text-[#555]">(required for tax compliance)</span>
                </label>
                <input
                  value={formData.panNumber}
                  onChange={(e) => updateField("panNumber", e.target.value.toUpperCase().slice(0, 10))}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] uppercase text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                />
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Aadhaar number <span className="text-[#555]">(required for identity verification)</span>
                </label>
                <input
                  value={formData.aadharNumber}
                  onChange={(e) => updateField("aadharNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  maxLength={12}
                  placeholder="12-digit Aadhaar Number"
                  className="w-full rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-[10px] text-[13px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#444] focus:border-[#c8ff00]"
                />
              </div>

              <div>
                <label className="mb-[5px] block text-[12px] font-medium text-[#999]">
                  Upload Certificate <span className="text-[#555]">(optional, JPEG/PNG/PDF/IMG)</span>
                </label>
                {formData.certificateUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#111] px-3 py-2 text-[13px] text-[#f0f0f0]">
                    <span className="truncate text-xs text-[#aaa]">
                      {formData.certificateUrl.split('/').pop()}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <a
                        href={formData.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] text-[#c8ff00] hover:underline"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => updateField("certificateUrl", "")}
                        className="text-[12px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2e2e2e] bg-[#111] p-4 text-center">
                    <span className="text-xs text-[#666] mb-2">JPEG, PNG, JPG, or PDF</span>
                    <label className="cursor-pointer rounded bg-[#2a2a2a] px-3 py-1.5 text-xs text-[#c8ff00] hover:bg-[#3a3a3a] transition-colors">
                      {uploadingCert ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleCertUpload}
                        disabled={uploadingCert}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#c8ff00]" />
                <span className="text-[11px] text-[#555]">
                  256-bit SSL encryption — your details are completely secure
                </span>
              </div>
            </div>
          ) : (
            /* ==================== STEP 4: Review ==================== */
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#f0f0f0]">
                  Review &amp; submit
                </h2>
                <p className="mt-0.5 text-[12px] text-[#888]">
                  Everything looks good? Submit to activate your instructor account.
                </p>
              </div>

              <div className="mb-[11px] rounded-xl border border-[#2e2e2e] bg-[#111] p-[13px]">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#c8ff00]/[0.12] text-[16px]">
                    👨‍🏫
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#f0f0f0]">
                      {teacherName}
                    </p>
                    {formData.headline && (
                      <p className="text-[12px] text-[#c8ff00]">{formData.headline}</p>
                    )}
                  </div>
                </div>
                <div>
                  {[
                    formData.category && { label: "Category", value: categories.find(c => c.value === formData.category)?.label },
                    selectedSkills.length > 0 && { label: "Skills", value: selectedSkills.join(", ") },
                    { label: "Experience", value: selectedExp },
                    { label: "Language", value: selectedLangs.join(", ") },
                    formData.ifscCode && { label: "Payout", value: `Bank Transfer \u00b7 ${formData.ifscCode}` },
                    formData.upiId && { label: "UPI", value: formData.upiId },
                    formData.panNumber && { label: "PAN", value: formData.panNumber },
                    formData.aadharNumber && { label: "Aadhaar", value: formData.aadharNumber },
                    formData.certificateUrl && { label: "Certificate", value: formData.certificateUrl.split('/').pop() },
                  ].filter(Boolean).map((row: any) => (
                    <div
                      key={row.label}
                      className="flex justify-between border-b border-[#222] py-[5px] last:border-b-0"
                    >
                      <span className="text-[12px] text-[#666]">{row.label}</span>
                      <span className="max-w-[58%] text-right text-[12px] font-medium text-[#f0f0f0]">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#c8ff00]"
                />
                <label htmlFor="terms" className="cursor-pointer text-[11px] leading-relaxed text-[#555]">
                  By submitting you agree to our{' '}
                  <span onClick={() => setViewingDoc("terms")} className="cursor-pointer text-[#c8ff00] hover:underline">Terms of Service</span>
                  {' '}and{' '}
                  <span onClick={() => setViewingDoc("agreement")} className="cursor-pointer text-[#c8ff00] hover:underline">Instructor Agreement</span>.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex items-center justify-between gap-2.5 border-t border-[#2e2e2e] px-6 py-[14px]">
            <button
              onClick={handleBack}
              className={`cursor-pointer rounded-lg border border-[#2e2e2e] bg-transparent px-[18px] py-[9px] text-[13px] text-[#888] transition-colors hover:bg-[#222] hover:text-[#f0f0f0] ${
                currentStep === 1 ? "invisible" : ""
              }`}
            >
              Back
            </button>
            <div className="flex items-center gap-2.5">
              {currentStep < 4 && currentStep !== 3 && (
                <button
                  onClick={handleSkip}
                  className="cursor-pointer border-none bg-transparent text-[12px] text-[#666] underline underline-offset-[3px] transition-colors hover:text-[#aaa]"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={currentStep < 4 ? handleNext : handleSubmit}
                disabled={currentStep === 4 && !agreed}
                className={`cursor-pointer rounded-lg bg-[#c8ff00] px-6 py-[10px] text-[13px] font-bold text-[#0d0d0d] transition-colors hover:bg-[#b5e600] ${
                  currentStep === 4 && !agreed ? "opacity-50 cursor-not-allowed hover:bg-[#c8ff00]" : ""
                }`}
              >
                {currentStep < 4 ? "Continue \u2192" : "\ud83d\ude80 Submit"}
              </button>
            </div>
          </div>
        )}
      </div>

      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#2e2e2e] bg-[#111] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {viewingDoc === "terms" ? "Terms of Service" : "Instructor Agreement"}
              </h3>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-[#2e2e2e] bg-black p-4 text-[13px] leading-relaxed text-[#aaa] whitespace-pre-wrap font-sans">
              {viewingDoc === "terms"
                ? agreements?.termsOfService || "Loading Terms of Service..."
                : agreements?.instructorAgreement || "Loading Instructor Agreement..."}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingDoc(null)}
                className="rounded-lg bg-[#c8ff00] px-5 py-2 text-[13px] font-bold text-[#0d0d0d] hover:bg-[#b5e600] transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
