// Judge0 CE API client for code execution
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_X_AUTH_TOKEN || "";

// Judge0 language IDs
export const LANGUAGES: Record<string, { id: number; name: string }> = {
  javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  typescript: { id: 74, name: "TypeScript (3.7.4)" },
  python: { id: 71, name: "Python (3.8.1)" },
  java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
  c: { id: 50, name: "C (GCC 9.2.0)" },
  cpp: { id: 54, name: "C++ (GCC 9.2.0)" },
  go: { id: 60, name: "Go (1.13.5)" },
};

// Judge0 status IDs
const STATUS_MAP: Record<number, string> = {
  1: "IN_QUEUE",
  2: "PROCESSING",
  3: "AC",     // Accepted
  4: "WA",     // Wrong Answer
  5: "TLE",    // Time Limit Exceeded
  6: "CE",     // Compilation Error
  7: "RE",     // Runtime Error (SIGSEGV)
  8: "RE",     // Runtime Error (SIGXFSZ)
  9: "RE",     // Runtime Error (SIGFPE)
  10: "RE",    // Runtime Error (SIGABRT)
  11: "RE",    // Runtime Error (NZEC)
  12: "RE",    // Runtime Error (Other)
  13: "IE",    // Internal Error
  14: "IE",    // Exec Format Error
};

export interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: string;
  time: string | null;
  memory: number | null;
  token: string;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (JUDGE0_AUTH_TOKEN) {
    headers["X-Auth-Token"] = JUDGE0_AUTH_TOKEN;
  }
  return headers;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submit code to Judge0 and return a token for polling
 */
export async function submitToJudge0(
  sourceCode: string,
  languageId: number,
  stdin?: string,
  expectedOutput?: string,
  cpuTimeLimit?: number,
  memoryLimit?: number
): Promise<string> {
  const body: Record<string, unknown> = {
    language_id: languageId,
    source_code: sourceCode,
    stdin: stdin || "",
    redirect_stderr_to_stdout: true,
  };

  if (expectedOutput !== undefined) {
    body.expected_output = expectedOutput;
  }
  if (cpuTimeLimit) {
    body.cpu_time_limit = cpuTimeLimit;
  }
  if (memoryLimit) {
    body.memory_limit = memoryLimit * 1024; // KB to bytes
  }

  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Judge0 submit failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.token;
}

/**
 * Poll Judge0 for submission result with retry logic
 */
export async function getJudge0Result(
  token: string,
  maxRetries: number = 10,
  pollInterval: number = 500
): Promise<SubmissionResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      throw new Error(`Judge0 poll failed (${res.status})`);
    }

    const data = await res.json();
    const statusId = data.status?.id;

    // Status 1 (IN_QUEUE) or 2 (PROCESSING) means still running
    if (statusId !== 1 && statusId !== 2) {
      return {
        stdout: data.stdout,
        stderr: data.stderr,
        compile_output: data.compile_output,
        message: data.message,
        status: STATUS_MAP[statusId] || "UNKNOWN",
        time: data.time,
        memory: data.memory,
        token: data.token,
      };
    }

    await sleep(pollInterval * (1 + attempt * 0.2)); // slight backoff
  }

  throw new Error("Judge0 timeout: submission took too long");
}

/**
 * Run code against a single input (for "Run" button)
 */
export async function runCode(
  sourceCode: string,
  languageId: number,
  stdin: string,
  cpuTimeLimit: number = 5,
  memoryLimit: number = 256
): Promise<SubmissionResult> {
  const token = await submitToJudge0(
    sourceCode,
    languageId,
    stdin,
    undefined,
    cpuTimeLimit,
    memoryLimit
  );
  return getJudge0Result(token);
}

/**
 * Run code against multiple test cases (for "Submit" button)
 */
export async function runTestCases(
  sourceCode: string,
  languageId: number,
  testCases: { input: string; expectedOutput: string }[],
  cpuTimeLimit: number = 2,
  memoryLimit: number = 256
): Promise<{
  status: string;
  passedCount: number;
  totalCount: number;
  results: SubmissionResult[];
}> {
  const results: SubmissionResult[] = [];
  let passedCount = 0;

  // Submit all test cases
  const tokens: string[] = [];
  for (const tc of testCases) {
    const token = await submitToJudge0(
      sourceCode,
      languageId,
      tc.input,
      tc.expectedOutput,
      cpuTimeLimit,
      memoryLimit
    );
    tokens.push(token);
  }

  // Poll all results
  for (const token of tokens) {
    const result = await getJudge0Result(token);
    results.push(result);
    if (result.status === "AC") {
      passedCount++;
    }
  }

  // Determine overall status
  let status: string;
  if (passedCount === testCases.length) {
    status = "AC";
  } else {
    // Find the first non-AC status that's not just wrong answer
    const firstError = results.find(
      (r) => r.status !== "AC" && r.status !== "WA"
    );
    status = firstError ? firstError.status : "WA";
  }

  return { status, passedCount, totalCount: testCases.length, results };
}
