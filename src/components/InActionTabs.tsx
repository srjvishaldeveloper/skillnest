"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type Tab = { tab: string; lesson: string; eyebrow: string; title: React.ReactNode };

const editorBlocks: { label: string; glyph?: string; desc: string }[] = [
  { label: "Text", glyph: "T", desc: "Paragraphs, headers, callouts" },
  { label: "Image", glyph: "▦", desc: "Upload layouts, banners" },
  { label: "Video", glyph: "🎬", desc: "HLS streams, YouTube links" },
  { label: "Quiz", glyph: "❓", desc: "Multiple choice, coding tests" },
  { label: "Evaluation", glyph: "★", desc: "Assessments, certificates" },
  { label: "Feedback", glyph: "💬", desc: "Survey questions, ratings" },
];

export default function InActionTabs({
  brand,
  data,
}: {
  brand: string;
  data?: {
    title?: string;
    videoUrl?: string;
    tabs?: {
      tab: string;
      lesson: string;
      eyebrow: string;
      title: string;
    }[];
  };
}) {
  const tabs: Tab[] = (data?.tabs && data.tabs.length > 0)
    ? data.tabs.map((t) => ({
        tab: t.tab.replace(/\${brand}/g, brand).replace(/{brand}/g, brand),
        lesson: t.lesson,
        eyebrow: t.eyebrow,
        title: <>{t.title.replace(/\${brand}/g, brand).replace(/{brand}/g, brand)}</>
      }))
    : [
        {
          tab: `Watch video about ${brand}`,
          lesson: "Overview | Learn all about our platform",
          eyebrow: "Watch & Discover",
          title: (
            <>
              See how <span className="text-[#2ee6a6]">{brand}</span> simplifies online learning,
              classes, batches, and <span className="text-[#2ee6a6]">career acceleration</span> for organizations globally.
            </>
          ),
        },
        {
          tab: "E-learning",
          lesson: "Module 2 | Interactive Courses",
          eyebrow: "Build a lesson",
          title: (
            <>
              Drag and drop blocks to create{" "}
              <span className="text-[#2ee6a6]">interactive e-learning</span> in minutes — no design or
              code needed.
            </>
          ),
        },
        {
          tab: "Instructor",
          lesson: "Live Session | Instructor-led",
          eyebrow: "Teach live",
          title: (
            <>
              Run <span className="text-[#2ee6a6]">instructor-led classes</span> with real-time
              engagement, polls and Q&amp;A across every team.
            </>
          ),
        },
        {
          tab: "Live Game",
          lesson: "Quiz Arena | Live Game",
          eyebrow: "Gamify learning",
          title: (
            <>
              Turn assessments into{" "}
              <span className="text-[#2ee6a6]">live, competitive games</span> that boost participation
              and retention.
            </>
          ),
        },
      ];

  const [active, setActive] = useState(0);
  const current = tabs[active];

  // State for interactive features
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Instructor states
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [pollVotes, setPollVotes] = useState({ yes: 28, no: 12 });
  const [hasVoted, setHasVoted] = useState(false);

  // Live Game states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handlePollVote = (option: "yes" | "no") => {
    if (hasVoted) return;
    setPollVotes((prev) => ({
      ...prev,
      [option]: prev[option] + 1,
    }));
    setHasVoted(true);
  };

  const renderRightPanel = () => {
    switch (active) {
      case 0: // Watch video
        return (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video flex flex-col items-center justify-center group shadow-2xl">
            <video
              ref={videoRef}
              src={data?.videoUrl || "/testvideo.mp4"}
              className="w-full h-full object-cover"
              loop
              playsInline
              onClick={handlePlayVideo}
            />
            {!isVideoPlaying && (
              <div
                onClick={handlePlayVideo}
                className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center cursor-pointer transition hover:bg-black/30"
              >
                <div className="w-16 h-16 rounded-full bg-[#2ee6a6] flex items-center justify-center text-black text-2xl font-bold shadow-[0_0_30px_#2ee6a6] transition transform group-hover:scale-110">
                  ▶
                </div>
                <span className="mt-4 text-xs font-semibold text-white tracking-widest uppercase">
                  Click to Play Video
                </span>
              </div>
            )}
            {isVideoPlaying && (
              <button
                onClick={handlePlayVideo}
                className="absolute bottom-4 right-4 bg-black/60 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-md backdrop-blur-md transition border border-white/10"
              >
                Pause ⏸
              </button>
            )}
          </div>
        );

      case 1: // E-learning
        return (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col h-full justify-between">
            <div>
              <p className="text-xs font-semibold text-white/90 mb-1">Lesson Builder Workspace</p>
              <div className="dashed-border rounded-lg border border-dashed border-white/20 bg-white/5 p-3 text-center mb-4 transition hover:bg-white/10 cursor-pointer">
                <span className="text-xs text-white/50">✦ Drag components here to build lesson</span>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] uppercase font-bold text-[#2ee6a6] tracking-wider mb-2">Available Blocks</p>
              <div className="grid grid-cols-3 gap-2.5">
                {editorBlocks.map((b) => (
                  <div
                    key={b.label}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0a3a29] text-center transition border border-white/5 hover:border-[#2ee6a6]/30 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 duration-200"
                  >
                    <span className="text-lg mb-1">{b.glyph}</span>
                    <span className="text-[10px] font-semibold text-white/90">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Instructor
        const totalVotes = pollVotes.yes + pollVotes.no;
        const yesPct = Math.round((pollVotes.yes / totalVotes) * 100);
        const noPct = Math.round((pollVotes.no / totalVotes) * 100);

        return (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4 flex flex-col justify-between">
            {/* Live Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide">LIVE CLASSROOM</span>
              </div>
              <span className="text-[10px] font-semibold text-white/60">👥 48 Learners</span>
            </div>

            {/* Stream Simulation controls */}
            <div className="flex items-center justify-center gap-4 bg-black/35 py-3 rounded-xl border border-white/5">
              <button
                onClick={() => setMicActive(!micActive)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition border ${
                  micActive 
                    ? "bg-[#0a3a29] text-[#2ee6a6] border-[#2ee6a6]/30" 
                    : "bg-rose-950/60 text-rose-400 border-rose-500/30"
                }`}
              >
                {micActive ? "🎙️" : "🔇"}
              </button>
              <button
                onClick={() => setVideoActive(!videoActive)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition border ${
                  videoActive 
                    ? "bg-[#0a3a29] text-[#2ee6a6] border-[#2ee6a6]/30" 
                    : "bg-rose-950/60 text-rose-400 border-rose-500/30"
                }`}
              >
                {videoActive ? "📹" : "❌"}
              </button>
              <span className="text-[11px] text-white/70 font-medium">
                {videoActive ? "Sharing Camera" : "Camera Muted"}
              </span>
            </div>

            {/* Live Poll Widget */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="text-[11px] font-bold text-[#2ee6a6] uppercase tracking-wider mb-2">Active Poll</p>
              <p className="text-xs text-white font-medium mb-3">Understood the circular saw safety procedures?</p>
              
              {!hasVoted ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePollVote("yes")}
                    className="flex-1 py-1.5 rounded-md bg-[#0a3a29] border border-[#2ee6a6]/20 text-[#2ee6a6] text-xs font-semibold hover:bg-[#0d4d37] transition"
                  >
                    Yes, clear!
                  </button>
                  <button
                    onClick={() => handlePollVote("no")}
                    className="flex-1 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-xs font-semibold hover:bg-white/10 transition"
                  >
                    Need recap
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-white/80 mb-1">
                      <span>Yes, clear!</span>
                      <span className="font-mono">{yesPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full">
                      <div className="h-1.5 bg-[#2ee6a6] rounded-full transition-all" style={{ width: `${yesPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-white/80 mb-1">
                      <span>Need recap</span>
                      <span className="font-mono">{noPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full">
                      <div className="h-1.5 bg-white/30 rounded-full transition-all" style={{ width: `${noPct}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Live Game
        const options = ["React Native", "Tailwind CSS", "Prisma ORM", "Next.js App"];
        return (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between space-y-3">
            {/* Game Head */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white tracking-wide">🏆 GAME ARENA</span>
              <span className="text-[10px] font-semibold text-[#2ee6a6]">Multiplier: 2.5x</span>
            </div>

            {/* Quiz Question */}
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Question 4 of 10</p>
              <p className="text-xs text-white font-semibold leading-relaxed">
                Which of the following is a utility-first CSS styling framework?
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === 1; // Tailwind CSS is correct
                
                let btnCls = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10";
                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnCls = "bg-emerald-950/60 border-emerald-500/40 text-emerald-400";
                  } else if (isSelected) {
                    btnCls = "bg-rose-950/60 border-rose-500/40 text-rose-400";
                  } else {
                    btnCls = "bg-white/5 border-white/5 opacity-55 text-white/40";
                  }
                }

                return (
                  <button
                    key={opt}
                    disabled={selectedOption !== null}
                    onClick={() => setSelectedOption(idx)}
                    className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition ${btnCls}`}
                  >
                    <span className="font-mono text-white/40 mr-1.5">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Mini Leaderboard */}
            <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl text-[10px] border border-white/5">
              <div className="flex items-center gap-1.5">
                <span>🥇</span>
                <span className="font-bold text-white">Rohan</span>
                <span className="text-white/60">(1,250 pts)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🥈</span>
                <span className="font-bold text-white">Shreya</span>
                <span className="text-white/60">(1,120 pts)</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Dynamic Tab Bar */}
      <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#e2e8e4] bg-white p-1.5 shadow-sm">
        {tabs.map((t, i) => (
          <button
            key={t.tab}
            type="button"
            onClick={() => {
              setActive(i);
              // Reset interactive states
              setIsVideoPlaying(false);
              setSelectedOption(null);
              setHasVoted(false);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${
              i === active 
                ? "bg-[#0b1a14] text-white shadow-md" 
                : "text-[#5b6b63] hover:text-[#0b1a14] hover:bg-gray-50"
            }`}
          >
            {i === 0 ? "▶ " : ""}
            {t.tab}
          </button>
        ))}
      </div>

      {/* Main Feature Container */}
      <div className="mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#06281d] via-[#094732] to-[#0a7a52] p-6 text-left shadow-[0_30px_70px_-30px_rgba(10,122,82,0.55)] border border-[#2ee6a6]/10 relative">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#2ee6a6]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#2ee6a6]/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-5 flex items-center justify-between text-[11px] font-bold text-white/50 tracking-wider uppercase">
            <span>{current.lesson}</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6a6]" />
              {brand}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2ee6a6]">
                {current.eyebrow}
              </p>
              <h3 className="mt-3.5 text-lg md:text-xl font-bold leading-8 text-white tracking-wide">
                {current.title}
              </h3>
            </div>
            
            {/* Dynamic Interactive Panel */}
            <div className="min-h-[220px] transition-all duration-300">
              {renderRightPanel()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
