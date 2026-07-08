"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const CodeEditor = dynamic(() => import("@/components/coding/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-900 rounded-lg animate-pulse" />,
});

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

interface ProblemData {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  constraints: string;
  hints: string;
  starterCode: Record<string, string> | null;
  timeLimit: number;
  memoryLimit: number;
  tags: { tag: { name: string } }[];
  testCases: TestCase[];
}

interface SubmissionResult {
  testCase: number;
  status: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  expected: string;
  input: string;
}

const LANGUAGES = [
  { key: "javascript", label: "JavaScript", id: 63 },
  { key: "typescript", label: "TypeScript", id: 74 },
  { key: "python", label: "Python", id: 71 },
  { key: "java", label: "Java", id: 62 },
  { key: "c", label: "C", id: 50 },
  { key: "cpp", label: "C++", id: 54 },
  { key: "go", label: "Go", id: 60 },
];

export default function ProblemPage({ problem }: { problem: ProblemData }) {
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [code, setCode] = useState(
    () => problem.starterCode?.javascript || "// Write your solution here\n"
  );
  const [stdin, setStdin] = useState(problem.testCases[0]?.input || "");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: string;
    passedCount: number;
    totalCount: number;
    runtime: number | null;
    memory: number | null;
    results: SubmissionResult[];
  } | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "testcases" | "result" | "ai">("description");

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      const starter = problem.starterCode?.[lang] || `// Write your solution in ${lang}\n`;
      setCode(starter);
    },
    [problem.starterCode]
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput("");
    setActiveTab("result");
    try {
      const langId = LANGUAGES.find((l) => l.key === language)?.id || 63;
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: code, languageId: langId, stdin }),
      });
      const data = await res.json();
      setOutput(
        data.stdout || data.stderr || data.compile_output || "No output"
      );
    } catch (err) {
      setOutput("Error: Failed to run code. Is Judge0 running?");
    } finally {
      setRunning(false);
    }
  }, [code, language, stdin]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitResult(null);
    setActiveTab("result");
    try {
      const langId = LANGUAGES.find((l) => l.key === language)?.id || 63;
      const res = await fetch("/api/code/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          source: code,
          languageId: langId,
        }),
      });
      const data = await res.json();
      setSubmitResult(data);
    } catch (err) {
      setSubmitResult({
        status: "ERROR",
        passedCount: 0,
        totalCount: 0,
        runtime: null,
        memory: null,
        results: [],
      });
    } finally {
      setSubmitting(false);
    }
  }, [code, language, problem.slug]);

  const askAI = useCallback(
    async (type: string) => {
      setAiLoading(true);
      setAiResponse("");
      setActiveTab("ai");
      try {
        const endpoints: Record<string, string> = {
          hint: "/api/ai/hint",
          explain: "/api/ai/explain",
          review: "/api/ai/review",
          optimize: "/api/ai/optimize",
        };
        const res = await fetch(endpoints[type], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemSlug: problem.slug,
            code,
          }),
        });
        const data = await res.json();
        setAiResponse(data.response || data.error || "No response");
      } catch (err) {
        setAiResponse("AI service unavailable. Make sure ANTHROPIC_API_KEY is set.");
      } finally {
        setAiLoading(false);
      }
    },
    [code, problem.slug]
  );

  const diffColor = (d: string) => {
    if (d === "EASY") return "text-green-400";
    if (d === "MEDIUM") return "text-yellow-400";
    return "text-red-400";
  };

  const sampleCases = problem.testCases.filter((tc) => tc.isSample);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT - Problem Description */}
      <div className="lg:w-[45%] xl:w-[40%] overflow-y-auto border-r border-gray-200 bg-white">
        <div className="p-6">
          {/* Title & Difficulty */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/problems" className="text-gray-400 hover:text-gray-600 text-sm">
                &larr; Problems
              </Link>
            </div>
            <h1 className="text-xl font-bold text-skillDark">{problem.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-sm font-medium ${diffColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              {problem.tags.map((t) => (
                <span key={t.tag.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {t.tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "description"
                  ? "border-skillBlue text-skillBlue"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("testcases")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "testcases"
                  ? "border-skillBlue text-skillBlue"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Test Cases
            </button>
          </div>

          {/* Description Content */}
          {activeTab === "description" && (
            <div className="space-y-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {problem.description}
              </div>

              {problem.constraints && (
                <div>
                  <h3 className="text-sm font-semibold text-skillDark mb-2">Constraints</h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg text-gray-600 whitespace-pre-wrap font-mono">
                    {problem.constraints}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Test Cases */}
          {activeTab === "testcases" && (
            <div className="space-y-3">
              {sampleCases.map((tc, i) => (
                <div key={tc.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Sample {i + 1}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Input</div>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 font-mono whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Expected Output</div>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 font-mono whitespace-pre-wrap">{tc.expectedOutput}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Panel */}
          {activeTab === "ai" && (
            <div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => askAI("hint")} className="px-3 py-1.5 text-xs bg-skillYellow text-white rounded-lg hover:opacity-90" disabled={aiLoading}>
                  {aiLoading ? "..." : "Give Hint"}
                </button>
                <button onClick={() => askAI("explain")} className="px-3 py-1.5 text-xs bg-skillBlue text-white rounded-lg hover:opacity-90" disabled={aiLoading}>
                  Explain
                </button>
                <button onClick={() => askAI("review")} className="px-3 py-1.5 text-xs bg-skillPurple text-white rounded-lg hover:opacity-90" disabled={aiLoading}>
                  Review
                </button>
                <button onClick={() => askAI("optimize")} className="px-3 py-1.5 text-xs bg-skillGreen text-white rounded-lg hover:opacity-90" disabled={aiLoading}>
                  Optimize
                </button>
              </div>
              {aiLoading && (
                <div className="text-sm text-gray-400 animate-pulse">AI is thinking...</div>
              )}
              {aiResponse && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {aiResponse}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT - Code Editor + Output */}
      <div className="lg:w-[55%] xl:w-[60%] flex flex-col bg-gray-950 overflow-hidden">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-800 text-gray-200 text-xs border border-gray-600 rounded px-3 py-1.5 focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "vs-dark" ? "vs-light" : "vs-dark")}
              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
            >
              {theme === "vs-dark" ? "Light" : "Dark"}
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`text-xs px-2 py-1 rounded ${showAI ? "bg-skillYellow text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              AI Tutor
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            theme={theme}
            height="100%"
            onRun={handleRun}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Bottom Panel: stdin + output */}
        <div className="border-t border-gray-700 bg-gray-900">
          {/* Stdin input */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            <span className="text-xs text-gray-400 shrink-0">Input:</span>
            <input
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter test input..."
              className="flex-1 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-skillBlue"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-1.5 text-xs font-medium bg-skillGreen text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Running..." : "Run (Ctrl+Enter)"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-medium bg-skillBlue text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit (Ctrl+Shift+Enter)"}
            </button>
            {submitResult && (
              <span className={`text-xs font-medium ${submitResult.status === "AC" ? "text-green-400" : "text-red-400"}`}>
                {submitResult.status === "AC" ? "Accepted" : submitResult.status} - {submitResult.passedCount}/{submitResult.totalCount} passed
              </span>
            )}
          </div>

          {/* Output */}
          <div className="px-4 py-3 max-h-[200px] overflow-y-auto">
            {output && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Output:</div>
                <pre className="text-xs text-gray-200 font-mono whitespace-pre-wrap">{output}</pre>
              </div>
            )}

            {submitResult?.results && (
              <div className="space-y-2">
                {submitResult.results.map((r) => (
                  <div
                    key={r.testCase}
                    className={`text-xs p-2 rounded border ${
                      r.status === "AC"
                        ? "border-green-700 bg-green-900/20"
                        : "border-red-700 bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400">Test {r.testCase}:</span>
                      <span className={r.status === "AC" ? "text-green-400" : "text-red-400"}>
                        {r.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-300">
                      <div>
                        <span className="text-gray-500">Input: </span>
                        {r.input}
                      </div>
                      <div>
                        <span className="text-gray-500">Expected: </span>
                        {r.expected}
                      </div>
                    </div>
                    {r.stdout && (
                      <div className="mt-1">
                        <span className="text-gray-500">Your output: </span>
                        <span className="text-gray-300">{r.stdout}</span>
                      </div>
                    )}
                    {r.stderr && (
                      <div className="mt-1 text-red-400">{r.stderr}</div>
                    )}
                    {r.compile_output && (
                      <div className="mt-1 text-yellow-400">{r.compile_output}</div>
                    )}
                  </div>
                ))}
                {submitResult.runtime != null && (
                  <div className="text-xs text-gray-400">
                    Runtime: {submitResult.runtime}ms | Memory: {submitResult.memory}KB
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
