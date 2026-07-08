import { callClaude } from "./ai";
import prisma from "./prisma";

async function getProblemContext(slug: string) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      testCases: { where: { isSample: true } },
    },
  });
  if (!problem) return null;
  return {
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    constraints: problem.constraints,
    tags: problem.tags.map((t) => t.tag.name),
    sampleTests: problem.testCases.map((tc) => ({
      input: tc.input,
      expected: tc.expectedOutput,
    })),
  };
}

export async function getHint(slug: string, code: string) {
  const ctx = await getProblemContext(slug);
  if (!ctx) return { ok: false, error: "Problem not found" };

  return callClaude({
    system: `You are a coding tutor helping a student solve a programming problem. 
NEVER give the full solution or complete code. Instead, provide a conceptual hint that guides them toward the right approach.
Be encouraging and use beginner-friendly language. Keep your response concise (under 200 words).`,
    messages: [
      {
        role: "user",
        content: `Problem: ${ctx.title}\n${ctx.description}\n\nConstraints: ${ctx.constraints}\n\nMy current code:\n\`\`\`\n${code}\n\`\`\`\n\nPlease give me a hint to help me solve this.`,
      },
    ],
  });
}

export async function explainProblem(slug: string, error?: string) {
  const ctx = await getProblemContext(slug);
  if (!ctx) return { ok: false, error: "Problem not found" };

  if (error) {
    return callClaude({
      system: `You are a coding tutor. A student encountered an error in their code. Explain the error clearly in beginner-friendly language.
Suggest how to fix it without giving the complete solution. Be specific about what caused the error.`,
      messages: [
        {
          role: "user",
          content: `Problem: ${ctx.title}\n\nError encountered:\n\`\`\`\n${error}\n\`\`\`\n\nPlease explain this error and how to fix it.`,
        },
      ],
    });
  }

  return callClaude({
    system: `You are a coding tutor. Explain the problem statement in simple, beginner-friendly language.
Break down the problem into smaller steps. Use examples and analogies. Keep it concise (under 300 words).`,
    messages: [
      {
        role: "user",
        content: `Problem: ${ctx.title}\n${ctx.description}\n\nConstraints: ${ctx.constraints}\nTags: ${ctx.tags.join(", ")}\n\nPlease explain this problem in simple terms.`,
      },
    ],
  });
}

export async function reviewCode(slug: string, code: string) {
  const ctx = await getProblemContext(slug);
  if (!ctx) return { ok: false, error: "Problem not found" };

  return callClaude({
    system: `You are a senior code reviewer. Review the student's code for this problem. Provide structured feedback:

**Strengths:** What they did well
**Weaknesses:** Areas for improvement  
**Edge Cases:** Any cases they might have missed
**Code Quality:** Naming conventions, readability, structure
**Best Practices:** Industry-standard practices

Be constructive and encouraging. Use specific examples from their code.`,
    messages: [
      {
        role: "user",
        content: `Problem: ${ctx.title}\n${ctx.description}\n\nMy solution:\n\`\`\`\n${code}\n\`\`\`\n\nPlease review my code.`,
      },
    ],
  });
}

export async function optimizeCode(slug: string, code: string) {
  const ctx = await getProblemContext(slug);
  if (!ctx) return { ok: false, error: "Problem not found" };

  return callClaude({
    system: `You are an algorithm expert. Analyze the student's code and suggest optimizations.

Provide:
1. **Current Time Complexity:** What's the current complexity?
2. **Current Space Complexity:** What's the current space usage?
3. **Optimized Approach:** Describe a better approach (conceptually, not full code)
4. **Optimized Complexity:** What would the new complexity be?
5. **Key Insight:** The main idea behind the optimization

Do NOT provide the complete optimized code. Guide them to discover it themselves.`,
    messages: [
      {
        role: "user",
        content: `Problem: ${ctx.title}\n${ctx.description}\nConstraints: ${ctx.constraints}\n\nMy solution:\n\`\`\`\n${code}\n\`\`\`\n\nPlease analyze and suggest optimizations.`,
      },
    ],
  });
}
