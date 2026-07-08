"use client";

import React, { useState, useEffect } from "react";

// Inline Custom SVGs for a self-contained premium component
const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4 text-violet-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 4.929a10 10 0 00-14.142 0M12 3v3m0 12v3M3 12h3m12 0h3" />
  </svg>
);

export default function HeroConsole() {
  const [activeTab, setActiveTab] = useState<"resume" | "interview" | "match">("resume");
  const [atsScore, setAtsScore] = useState(65);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Animate the ATS score on tab mount/change
  useEffect(() => {
    if (activeTab === "resume") {
      setIsAnalyzing(true);
      setAtsScore(55);
      const interval = setInterval(() => {
        setAtsScore((prev) => {
          if (prev >= 88) {
            clearInterval(interval);
            setIsAnalyzing(false);
            return 88;
          }
          return prev + 3;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Glow Effects */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 rounded-[2.5rem] blur-xl opacity-30 group-hover:opacity-40 transition duration-1000"></div>
      
      {/* Main Console Box */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">SkillNest AI Console v2.0</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            System Live
          </span>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100/50 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("resume")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-300 ${
              activeTab === "resume"
                ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(99,91,255,0.08)]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            Resume AI
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-300 ${
              activeTab === "interview"
                ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(99,91,255,0.08)]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            Interview AI
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-300 ${
              activeTab === "match"
                ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(99,91,255,0.08)]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            Job Match AI
          </button>
        </div>

        {/* Console Content */}
        <div className="p-6 min-h-[300px] flex flex-col justify-between">
          
          {/* TAB 1: RESUME AI */}
          {activeTab === "resume" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Resume Quality Report</h4>
                  <p className="text-xs text-slate-500">Analysis completed for senior candidate profile</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">ATS score:</span>
                  <span className={`text-lg font-mono font-black ${atsScore >= 80 ? "text-indigo-600" : "text-amber-500"}`}>
                    {atsScore}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${atsScore}%` }}
                ></div>
              </div>

              {/* Insights */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                  <div className="p-1 rounded bg-indigo-50 shrink-0">
                    <SparklesIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Impact Metrics Added</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">+15 pts</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Identified quantitative metrics for frontend optimization projects.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                  <div className="p-1 rounded bg-emerald-50 shrink-0">
                    <CheckIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Keyword Alignment</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Optimal</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Keywords matched 94% of React/Next.js job descriptions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition">
                  <div className="p-1 rounded bg-amber-50 shrink-0">
                    <WarningIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-800">Missing Section Link</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Action</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-0.5">Add a direct portfolio URL or GitHub link to increase callbacks.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEW AI */}
          {activeTab === "interview" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Real-Time Interview Simulator</h4>
                <p className="text-xs text-slate-500">Practicing behavioral &amp; technical questions</p>
              </div>

              {/* Voice and Wave Visualizer */}
              <div className="relative flex flex-col items-center justify-center p-4 py-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,91,255,0.15),_transparent_70%)]"></div>
                
                <span className="relative text-[10px] text-indigo-300 font-mono tracking-widest uppercase mb-1">INTERVIEWER AI</span>
                <p className="relative text-xs text-center text-slate-200 px-4 max-w-sm italic mb-4">
                  &quot;Tell me about a time you had to resolve a performance bottleneck in a production app.&quot;
                </p>

                {/* Animated Audio Waves */}
                <div className="relative flex items-center justify-center gap-1 h-8">
                  <span className="w-1 bg-indigo-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]" style={{ height: "40%" }}></span>
                  <span className="w-1 bg-violet-400 rounded-full animate-[wave_1s_ease-in-out_infinite_0.2s]" style={{ height: "70%" }}></span>
                  <span className="w-1 bg-cyan-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite_0.4s]" style={{ height: "90%" }}></span>
                  <span className="w-1 bg-indigo-500 rounded-full animate-[wave_1.4s_ease-in-out_infinite_0.1s]" style={{ height: "55%" }}></span>
                  <span className="w-1 bg-violet-400 rounded-full animate-[wave_1.1s_ease-in-out_infinite_0.3s]" style={{ height: "80%" }}></span>
                  <span className="w-1 bg-cyan-300 rounded-full animate-[wave_0.9s_ease-in-out_infinite_0.5s]" style={{ height: "45%" }}></span>
                </div>
              </div>

              {/* Real-time coaching feedback */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <SparklesIcon /> AI Coached Feedback
                </div>
                <p className="text-[11px] text-indigo-700/90 mt-1 leading-relaxed">
                  Your answer demonstrates strong technical skills. **Pro Tip:** Structure using the **STAR** framework (explain the Situation, then Task, Action, and specific Result).
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: JOB MATCH AI */}
          {activeTab === "match" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Job Recommendation Dashboard</h4>
                <p className="text-xs text-slate-500">Matching your profile to open market opportunities</p>
              </div>

              <div className="space-y-2.5">
                {/* Match 1 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 font-bold text-xs text-indigo-600">V</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Senior Frontend Engineer</h5>
                      <p className="text-[10px] text-slate-500">Vercel · Remote</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">98% Match</span>
                    <p className="text-[9px] text-slate-400 mt-1">Matched 9 skills</p>
                  </div>
                </div>

                {/* Match 2 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 font-bold text-xs text-emerald-600">L</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Full-Stack Engineer</h5>
                      <p className="text-[10px] text-slate-500">Linear · Hybrid</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">92% Match</span>
                    <p className="text-[9px] text-slate-400 mt-1">Matched 8 skills</p>
                  </div>
                </div>

                {/* Match 3 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 font-bold text-xs text-rose-600">F</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">UI Engineer</h5>
                      <p className="text-[10px] text-slate-500">Figma · SF / Hybrid</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">85% Match</span>
                    <p className="text-[9px] text-slate-400 mt-1">Missing: Tailwind v4</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer of the Console */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by Gemini 3.5 Flash</span>
            <span className="font-mono text-indigo-500 font-semibold cursor-pointer hover:underline flex items-center gap-1">
              Configure parameters 
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
