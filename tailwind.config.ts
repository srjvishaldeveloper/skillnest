import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // SkillNest brand palette
        skillYellow: "#F5A623", // primary accent
        skillBlue: "#2563EB", // primary brand blue
        skillPurple: "#7C3AED", // secondary accent
        skillGreen: "#c5f82a", // success / progress
        skillLight: "#F0F4FF", // background tint
        skillDark: "#1E1B4B", // dark text / header bg
        // Legacy lama color names remapped to the SkillNest palette
        lamaSky: "#EFF6FF",
        lamaSkyLight: "#DBEAFE",
        lamaPurple: "#F5F3FF",
        lamaPurpleLight: "#EDE9FE",
        lamaYellow: "#FFFBEB",
        lamaYellowLight: "#FEF3C7",
      },
    },
  },
  plugins: [],
};
export default config;
