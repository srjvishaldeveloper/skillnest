import { PrismaClient } from "@prisma/client";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

const prisma = new PrismaClient();

// Tags for coding problems
const TAGS = [
  "Array", "String", "Math", "Hash Table", "Two Pointers",
  "Sorting", "Binary Search", "Linked List", "Stack", "Queue",
  "Tree", "Graph", "Dynamic Programming", "Greedy", "Recursion",
  "Bit Manipulation", "Sliding Window", "Backtracking", "Divide and Conquer", "Heap",
  "Matrix", "Simulation", "Counting",
];

// Starter code templates per language
function starterCode(fnName: string, params: string, returnType: string): Record<string, string> {
  return {
    javascript: `/**\n * @param {${params}} args\n * @return {${returnType}}\n */\nfunction ${fnName}() {\n  // Write your code here\n}\n`,
    typescript: `function ${fnName}(): ${returnType} {\n  // Write your code here\n}\n`,
    python: `def ${fnName}():\n    # Write your code here\n    pass\n`,
    java: `class Solution {\n    public ${returnType.toLowerCase()} ${fnName}() {\n        // Write your code here\n    }\n}\n`,
    c: `#include <stdio.h>\n\n${returnType.toLowerCase()} ${fnName}() {\n    // Write your code here\n}\n`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\n${returnType.toLowerCase()} ${fnName}() {\n    // Write your code here\n}\n`,
    go: `package main\n\nimport "fmt"\n\nfunc ${fnName}() {\n    // Write your code here\n}\n\nfunc main() {\n    ${fnName}()\n}\n`,
  };
}

interface ProblemSeed {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  constraints: string;
  hints: string;
  tags: string[];
  testCases: { input: string; expectedOutput: string; isSample: boolean }[];
  starterFn: string;
  starterParams: string;
  starterReturn: string;
}

const PROBLEMS: ProblemSeed[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n**Example 1:**\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\n**Example 2:**\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]",
    difficulty: "EASY",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    hints: "Think about using a hash map to store complements. For each number, check if its complement (target - number) exists in the map.",
    tags: ["Array", "Hash Table"],
    testCases: [
      { input: "2 7 11 15\n9", expectedOutput: "0 1", isSample: true },
      { input: "3 2 4\n6", expectedOutput: "1 2", isSample: true },
      { input: "3 3\n6", expectedOutput: "0 1", isSample: false },
      { input: "1 5 8 12\n13", expectedOutput: "1 2", isSample: false },
    ],
    starterFn: "twoSum",
    starterParams: "number[] nums, number target",
    starterReturn: "number[]",
  },
  {
    slug: "reverse-string",
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\n**Example 1:**\nInput: s = ['h','e','l','l','o']\nOutput: ['o','l','l','e','h']\n\n**Example 2:**\nInput: s = ['H','a','n','n','a','h']\nOutput: ['h','a','n','n','a','H']",
    difficulty: "EASY",
    constraints: "1 <= s.length <= 10^5\ns[i] is a printable ASCII character.",
    hints: "Use two pointers, one at the start and one at the end. Swap characters and move pointers towards each other.",
    tags: ["Two Pointers", "String", "Recursion"],
    testCases: [
      { input: "hello", expectedOutput: "olleh", isSample: true },
      { input: "Hannah", expectedOutput: "hannaH", isSample: true },
      { input: "a", expectedOutput: "a", isSample: false },
      { input: "ab", expectedOutput: "ba", isSample: false },
    ],
    starterFn: "reverseString",
    starterParams: "string s",
    starterReturn: "string",
  },
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.\n\n**Example 1:**\nInput: s = 'A man, a plan, a canal: Panama'\nOutput: true\n\n**Example 2:**\nInput: s = 'race a car'\nOutput: false",
    difficulty: "EASY",
    constraints: "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
    hints: "First clean the string by removing non-alphanumeric characters and converting to lowercase. Then check if it equals its reverse.",
    tags: ["Two Pointers", "String"],
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isSample: true },
      { input: "race a car", expectedOutput: "false", isSample: true },
      { input: " ", expectedOutput: "true", isSample: false },
      { input: "0P", expectedOutput: "false", isSample: false },
    ],
    starterFn: "isPalindrome",
    starterParams: "string s",
    starterReturn: "boolean",
  },
  {
    slug: "fizz-buzz",
    title: "Fizz Buzz",
    description: "Given an integer `n`, return a string array where:\n- 'FizzBuzz' if i is divisible by 3 and 5\n- 'Fizz' if i is divisible by 3\n- 'Buzz' if i is divisible by 5\n- i (as string) otherwise\n\n**Example:**\nInput: n = 15\nOutput: ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz']",
    difficulty: "EASY",
    constraints: "1 <= n <= 10000",
    hints: "Loop from 1 to n. Check divisibility by both 3 and 5 first, then individually.",
    tags: ["Math", "Simulation"],
    testCases: [
      { input: "5", expectedOutput: "1 2 Fizz 4 Buzz", isSample: true },
      { input: "3", expectedOutput: "1 2 Fizz", isSample: true },
      { input: "1", expectedOutput: "1", isSample: false },
      { input: "15", expectedOutput: "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz", isSample: false },
    ],
    starterFn: "fizzBuzz",
    starterParams: "number n",
    starterReturn: "string[]",
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n**Example 1:**\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: [4,-1,2,1] has the largest sum = 6.\n\n**Example 2:**\nInput: nums = [1]\nOutput: 1",
    difficulty: "MEDIUM",
    constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    hints: "Kadane's Algorithm: maintain a running sum. If it goes below 0, reset to 0. Track the maximum seen.",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isSample: true },
      { input: "1", expectedOutput: "1", isSample: true },
      { input: "5 4 -1 7 8", expectedOutput: "23", isSample: false },
      { input: "-1 -2 -3", expectedOutput: "-1", isSample: false },
    ],
    starterFn: "maxSubArray",
    starterParams: "number[] nums",
    starterReturn: "number",
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    description: "Given an array of integers `nums` sorted in ascending order, and an integer `target`, search for `target` in `nums`.\n\nIf target exists, return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.\n\n**Example 1:**\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\n**Example 2:**\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1",
    difficulty: "EASY",
    constraints: "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.",
    hints: "Use two pointers: left and right. Calculate mid and compare with target. Narrow the search range.",
    tags: ["Array", "Binary Search"],
    testCases: [
      { input: "-1 0 3 5 9 12\n9", expectedOutput: "4", isSample: true },
      { input: "-1 0 3 5 9 12\n2", expectedOutput: "-1", isSample: true },
      { input: "5\n5", expectedOutput: "0", isSample: false },
      { input: "1 2 3 4 5\n1", expectedOutput: "0", isSample: false },
    ],
    starterFn: "search",
    starterParams: "number[] nums, number target",
    starterReturn: "number",
  },
  {
    slug: "merge-sorted-arrays",
    title: "Merge Sorted Arrays",
    description: "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order. Merge nums2 into nums1 as one sorted array.\n\n**Example 1:**\nInput: nums1 = [1,2,3], nums2 = [2,5,6]\nOutput: [1,2,2,3,5,6]\n\n**Example 2:**\nInput: nums1 = [1], nums2 = []\nOutput: [1]",
    difficulty: "EASY",
    constraints: "nums1.length, nums2.length <= 200\n-10^9 <= nums1[i], nums2[i] <= 10^9",
    hints: "Use two pointers starting from the beginning of each array. Compare and pick the smaller element.",
    tags: ["Array", "Two Pointers", "Sorting"],
    testCases: [
      { input: "1 2 3\n2 5 6", expectedOutput: "1 2 2 3 5 6", isSample: true },
      { input: "1\n", expectedOutput: "1", isSample: true },
      { input: "\n1 2 3", expectedOutput: "1 2 3", isSample: false },
      { input: "0 0 0\n1 2 3", expectedOutput: "0 0 0 1 2 3", isSample: false },
    ],
    starterFn: "merge",
    starterParams: "number[] nums1, number[] nums2",
    starterReturn: "number[]",
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\n**Example 1:**\nInput: n = 2\nOutput: 2\nExplanation: [1,1] or [2]\n\n**Example 2:**\nInput: n = 3\nOutput: 3\nExplanation: [1,1,1], [1,2], [2,1]",
    difficulty: "EASY",
    constraints: "1 <= n <= 45",
    hints: "This is the Fibonacci sequence. ways(n) = ways(n-1) + ways(n-2). Use dynamic programming.",
    tags: ["Math", "Dynamic Programming", "Recursion"],
    testCases: [
      { input: "2", expectedOutput: "2", isSample: true },
      { input: "3", expectedOutput: "3", isSample: true },
      { input: "1", expectedOutput: "1", isSample: false },
      { input: "5", expectedOutput: "8", isSample: false },
      { input: "10", expectedOutput: "89", isSample: false },
    ],
    starterFn: "climbStairs",
    starterParams: "number n",
    starterReturn: "number",
  },
  {
    slug: "longest-substring-no-repeat",
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.\n\n**Example 1:**\nInput: s = 'abcabcbb'\nOutput: 3\nExplanation: 'abc' has length 3.\n\n**Example 2:**\nInput: s = 'bbbbb'\nOutput: 1",
    difficulty: "MEDIUM",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    hints: "Use a sliding window with a set to track characters. Expand right, shrink left when a duplicate is found.",
    tags: ["Hash Table", "String", "Sliding Window"],
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isSample: true },
      { input: "bbbbb", expectedOutput: "1", isSample: true },
      { input: "pwwkew", expectedOutput: "3", isSample: false },
      { input: "", expectedOutput: "0", isSample: false },
      { input: " ", expectedOutput: "1", isSample: false },
    ],
    starterFn: "lengthOfLongestSubstring",
    starterParams: "string s",
    starterReturn: "number",
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nA string is valid if:\n1. Open brackets are closed by the same type.\n2. Open brackets are closed in the correct order.\n3. Every close bracket has a corresponding open bracket.\n\n**Example 1:**\nInput: s = '()'\nOutput: true\n\n**Example 2:**\nInput: s = '()[]{}'\nOutput: true\n\n**Example 3:**\nInput: s = '(]'\nOutput: false",
    difficulty: "EASY",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    hints: "Use a stack. Push opening brackets, pop and match when you see a closing bracket.",
    tags: ["String", "Stack"],
    testCases: [
      { input: "()", expectedOutput: "true", isSample: true },
      { input: "()[]{}", expectedOutput: "true", isSample: true },
      { input: "(]", expectedOutput: "false", isSample: true },
      { input: "([)]", expectedOutput: "false", isSample: false },
      { input: "{[]}", expectedOutput: "true", isSample: false },
    ],
    starterFn: "isValid",
    starterParams: "string s",
    starterReturn: "boolean",
  },
  {
    slug: "container-with-most-water",
    title: "Container With Most Water",
    description: "You are given an integer array `height` of length n. Find two lines that together with the x-axis form a container that holds the most water.\n\nReturn the maximum amount of water a container can store.\n\n**Example 1:**\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\n\n**Example 2:**\nInput: height = [1,1]\nOutput: 1",
    difficulty: "MEDIUM",
    constraints: "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
    hints: "Two pointer approach: start from both ends. Move the pointer with smaller height inward to potentially find a taller line.",
    tags: ["Array", "Two Pointers", "Greedy"],
    testCases: [
      { input: "1 8 6 2 5 4 8 3 7", expectedOutput: "49", isSample: true },
      { input: "1 1", expectedOutput: "1", isSample: true },
      { input: "4 3 2 1 4", expectedOutput: "16", isSample: false },
      { input: "1 2 1", expectedOutput: "2", isSample: false },
    ],
    starterFn: "maxArea",
    starterParams: "number[] height",
    starterReturn: "number",
  },
  {
    slug: "three-sum",
    title: "3Sum",
    description: "Given an integer array `nums`, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nThe solution set must not contain duplicate triplets.\n\n**Example 1:**\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]\n\n**Example 2:**\nInput: nums = [0,0,0]\nOutput: [[0,0,0]]",
    difficulty: "MEDIUM",
    constraints: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
    hints: "Sort the array. For each element, use two pointers on the remaining portion to find pairs that sum to its negation.",
    tags: ["Array", "Two Pointers", "Sorting"],
    testCases: [
      { input: "-1 0 1 2 -1 -4", expectedOutput: "-1 -1 2;-1 0 1", isSample: true },
      { input: "0 0 0", expectedOutput: "0 0 0", isSample: true },
      { input: "0 1 1", expectedOutput: "", isSample: false },
      { input: "-2 0 1 1 2", expectedOutput: "-2 0 2;-2 1 1", isSample: false },
    ],
    starterFn: "threeSum",
    starterParams: "number[] nums",
    starterReturn: "number[][]",
  },
  {
    slug: "best-time-buy-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    description: "You are given an array `prices` where prices[i] is the price of a stock on day i.\n\nYou want to maximize your profit by choosing a single day to buy and a single day to sell.\n\nReturn the maximum profit. If you cannot achieve any profit, return 0.\n\n**Example 1:**\nInput: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price=1), sell on day 5 (price=6), profit = 5.\n\n**Example 2:**\nInput: prices = [7,6,4,3,1]\nOutput: 0",
    difficulty: "EASY",
    constraints: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    hints: "Track the minimum price seen so far and the maximum profit. For each price, profit = price - minPrice.",
    tags: ["Array", "Dynamic Programming"],
    testCases: [
      { input: "7 1 5 3 6 4", expectedOutput: "5", isSample: true },
      { input: "7 6 4 3 1", expectedOutput: "0", isSample: true },
      { input: "1 2", expectedOutput: "1", isSample: false },
      { input: "2 4 1", expectedOutput: "2", isSample: false },
    ],
    starterFn: "maxProfit",
    starterParams: "number[] prices",
    starterReturn: "number",
  },
  {
    slug: "linked-list-cycle",
    title: "Linked List Cycle",
    description: "Given the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle if some node is reachable by continuously following the `next` pointer.\n\nReturn `true` if there is a cycle, otherwise `false`.\n\nNote: Use array representation where -1 means no cycle and a number means the index where the tail connects back to.\n\n**Example 1:**\nInput: [3,2,0,-4] cycle at 1\nOutput: true\n\n**Example 2:**\nInput: [1,2] cycle at 0\nOutput: true\n\n**Example 3:**\nInput: [1] no cycle\nOutput: false",
    difficulty: "EASY",
    constraints: "The number of nodes is in range [0, 10^4].\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index.",
    hints: "Floyd's Cycle Detection: Use slow and fast pointers. If they meet, there's a cycle.",
    tags: ["Linked List", "Two Pointers"],
    testCases: [
      { input: "3 2 0 -4\n1", expectedOutput: "true", isSample: true },
      { input: "1 2\n0", expectedOutput: "true", isSample: true },
      { input: "1\n-1", expectedOutput: "false", isSample: true },
      { input: "\n-1", expectedOutput: "false", isSample: false },
    ],
    starterFn: "hasCycle",
    starterParams: "number[] values, number pos",
    starterReturn: "boolean",
  },
  {
    slug: "coin-change",
    title: "Coin Change",
    description: "You are given an integer array `coins` representing denominations and an integer `amount`.\n\nReturn the fewest number of coins needed to make up that amount. If impossible, return -1.\n\nYou have an infinite number of each kind of coin.\n\n**Example 1:**\nInput: coins = [1,5,10,25], amount = 30\nOutput: 2 (25 + 5)\n\n**Example 2:**\nInput: coins = [2], amount = 3\nOutput: -1",
    difficulty: "MEDIUM",
    constraints: "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
    hints: "Dynamic Programming: dp[i] = minimum coins for amount i. For each coin, dp[i] = min(dp[i], dp[i - coin] + 1).",
    tags: ["Array", "Dynamic Programming"],
    testCases: [
      { input: "1 5 10 25\n30", expectedOutput: "2", isSample: true },
      { input: "2\n3", expectedOutput: "-1", isSample: true },
      { input: "1\n0", expectedOutput: "0", isSample: false },
      { input: "1 2 5\n11", expectedOutput: "3", isSample: false },
      { input: "186 419 83 408\n6249", expectedOutput: "20", isSample: false },
    ],
    starterFn: "coinChange",
    starterParams: "number[] coins, number amount",
    starterReturn: "number",
  },
];

export async function seedCodingPlatform() {
  console.log("Seeding coding platform...");

  // Create tags
  const tagMap: Record<string, number> = {};
  for (const tagName of TAGS) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
    tagMap[tagName] = tag.id;
  }
  console.log(`Created ${TAGS.length} tags`);

  // Create problems with test cases
  for (const p of PROBLEMS) {
    const existing = await prisma.problem.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    const problem = await prisma.problem.create({
      data: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        constraints: p.constraints,
        hints: p.hints,
        published: true,
        starterCode: starterCode(p.starterFn, p.starterParams, p.starterReturn),
      },
    });

    // Create test cases
    for (let i = 0; i < p.testCases.length; i++) {
      await prisma.testCase.create({
        data: {
          input: p.testCases[i].input,
          expectedOutput: p.testCases[i].expectedOutput,
          isSample: p.testCases[i].isSample,
          order: i,
          problemId: problem.id,
        },
      });
    }

    // Create tag relations
    for (const tagName of p.tags) {
      if (tagMap[tagName]) {
        await prisma.problemTag.create({
          data: { problemId: problem.id, tagId: tagMap[tagName] },
        });
      }
    }
  }
  console.log(`Created ${PROBLEMS.length} problems with test cases`);

  // Create badges
  const badges = [
    { name: "First Solve", description: "Solved your first problem", icon: "trophy", threshold: 1 },
    { name: "10 Problems", description: "Solved 10 problems", icon: "star", threshold: 10 },
    { name: "50 Problems", description: "Solved 50 problems", icon: "medal", threshold: 50 },
    { name: "100 Problems", description: "Solved 100 problems", icon: "crown", threshold: 100 },
    { name: "7 Day Streak", description: "7 consecutive days of coding", icon: "fire", threshold: 7 },
    { name: "30 Day Streak", description: "30 consecutive days of coding", icon: "flame", threshold: 30 },
    { name: "Speed Solver", description: "Solved a problem in under 5 minutes", icon: "lightning", threshold: 1 },
    { name: "Contest Participant", description: "Participated in a contest", icon: "users", threshold: 1 },
    { name: "Contest Winner", description: "Won first place in a contest", icon: "award", threshold: 1 },
  ];

  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`Created ${badges.length} badges`);

  // Create sample contests (skip if already exist)
  const existingContests = await prisma.contest.count();
  if (existingContests === 0) {
    const now = new Date();
    const futureStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const pastStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
    const pastEnd = new Date(pastStart.getTime() + 2 * 60 * 60 * 1000);

    const contest1 = await prisma.contest.create({
      data: {
        title: "Weekly Coding Challenge #1",
        description: "Test your skills with 5 problems in 2 hours!",
        startTime: futureStart,
        endTime: futureEnd,
        published: true,
      },
    });

    const contest2 = await prisma.contest.create({
      data: {
        title: "Beginner Friendly Contest",
        description: "Easy problems for beginners. Perfect to get started!",
        startTime: pastStart,
        endTime: pastEnd,
        published: true,
      },
    });

    // Add problems to contests
    const allProblems = await prisma.problem.findMany({ take: 10 });
    for (let i = 0; i < Math.min(5, allProblems.length); i++) {
      await prisma.contestProblem.create({
        data: {
          contestId: contest1.id,
          problemId: allProblems[i].id,
          order: i,
          points: (allProblems[i].difficulty === "EASY" ? 100 : allProblems[i].difficulty === "MEDIUM" ? 200 : 300),
        },
      });
    }

    for (let i = 0; i < Math.min(3, allProblems.length); i++) {
      const easyProblems = allProblems.filter((p) => p.difficulty === "EASY");
      if (easyProblems[i]) {
        await prisma.contestProblem.create({
          data: {
            contestId: contest2.id,
            problemId: easyProblems[i].id,
            order: i,
            points: 100,
          },
        });
      }
    }
    console.log("Created 2 sample contests");
  } else {
    console.log("Contests already exist, skipping.");
  }

  // Create daily challenges for next 7 days
  const now = new Date();
  const allProblems = await prisma.problem.findMany({ take: 7 });
  for (let i = 0; i < 7 && i < allProblems.length; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    await prisma.dailyChallenge.upsert({
      where: { date },
      update: {},
      create: {
        date,
        xpReward: 15,
        problemId: allProblems[i].id,
      },
    });
  }
  console.log("Created daily challenges for next 7 days");

  console.log("Coding platform seed complete!");
}
