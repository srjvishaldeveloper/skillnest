export type CmsPageKey =
  | "landing"
  | "adminDashboard"
  | "studentDashboard"
  | "teacherDashboard"
  | "parentDashboard"
  | "agreements";

export const cmsPageMeta: Record<
  CmsPageKey,
  { title: string; description: string; revalidatePaths: string[] }
> = {
  landing: {
    title: "Landing Page",
    description: "Controls the public homepage hero, sections, testimonials, FAQs, and CTA.",
    revalidatePaths: ["/"],
  },
  adminDashboard: {
    title: "Admin Dashboard",
    description: "Controls the super admin welcome area and dashboard management cards.",
    revalidatePaths: ["/admin", "/admin/cms"],
  },
  studentDashboard: {
    title: "Student Dashboard",
    description: "Controls the learner dashboard headings, empty states, and CTA copy.",
    revalidatePaths: ["/student"],
  },
  teacherDashboard: {
    title: "Teacher Dashboard",
    description: "Controls the instructor dashboard welcome copy.",
    revalidatePaths: ["/teacher"],
  },
  parentDashboard: {
    title: "Parent Dashboard",
    description: "Controls the guardian dashboard welcome copy.",
    revalidatePaths: ["/parent"],
  },
  agreements: {
    title: "Terms & Agreements",
    description: "Controls the Terms of Service and Instructor Agreement text copy.",
    revalidatePaths: ["/teacher"],
  },
};

export const cmsDefaults = {
  landing: {
    seo: {
      title: "SkillNest - Learn. Grow. Get Hired.",
      description:
        "Master in-demand skills with SkillNest. Expert mentors, hands-on projects, and career-focused courses to help you learn, grow, and get hired.",
    },
    brand: {
      name: "SkillNest",
      tagline: "Learn. Grow. Get Hired.",
    },
    navLinks: ["Home", "About", "Courses", "Testimonials", "Free Webinars"],
    hero: {
      eyebrow: "Career-first learning platform",
      titlePrefix: "Master",
      titleHighlight: "In-Demand Skills",
      titleSuffix: "in record time",
      description:
        "Unlock fast, efficient, and career-focused learning with expert mentors, hands-on projects, and practical pathways that help learners become job-ready.",
      primaryCtaLabel: "Browse Courses",
      primaryCtaHref: "/explore-courses",
      reviewCount: "12,947",
      reviewLabel: "Positive Reviews",
      learnerCount: "410,732",
      learnerLabel: "Happy Learners",
      mediaLabel: "Watch how SkillNest works",
      videoUrl: "",
      thumbnailUrl: "",
    },
    successStories: {
      title: "Success story of our learners",
      cards: [
        {
          name: "Niharika Sharma",
          role: "Learner at SkillNest",
          quote:
            "I was blown away by how quickly I improved. The lessons are clear, practical, and easy to follow.",
          videoUrl: "",
          mediaLabel: "Learner story",
        },
        {
          name: "Henry Arthur",
          role: "Learner at SkillNest",
          quote:
            "The structure kept me moving. I always knew the next step and felt supported throughout the journey.",
          videoUrl: "",
          mediaLabel: "Learner story",
        },
        {
          name: "Flores Juanita",
          role: "Learner at SkillNest",
          quote:
            "I now learn faster and more professionally, and the projects helped me become confident in my skills.",
          videoUrl: "",
          mediaLabel: "Learner story",
        },
      ],
    },
    popularCourse: {
      title: "Master Web Development: From Beginner to Pro",
      author: "Aarav Mehta",
      mentor: "Lead Engineer",
      description:
        "Learn step-by-step, hands-on shortcuts, and real-world workflows that empower you to build faster and get hired with confidence.",
      level: "Entry Level",
      duration: "7h 30m",
      students: "12,593",
      oldPrice: "$90",
      price: "$58",
      ctaLabel: "Enroll Now",
      ctaHref: "/explore-courses",
      videoUrl: "",
      mediaLabel: "Popular course preview",
    },
    about: {
      eyebrow: "About us",
      title: "Expert mentors and instructors with 12+ years of experience",
      description:
        "Our mentors are engineers, designers, and industry leaders who have built careers across startups and global companies. We help beginners and working professionals learn with confidence and momentum.",
      ctaLabel: "View Our Courses",
      ctaHref: "/explore-courses",
      videoUrl: "",
      mediaLabel: "Meet the mentors",
    },
    difference: {
      eyebrow: "Why Choose Us",
      title: "What makes our learning different from others",
      description:
        "We help learners build real-world skills through guided projects, expert mentorship, and a community that keeps progress consistent.",
      features: [
        "12+ years of mentor experience",
        "Personalized guidance",
        "Support groups and Discord community",
        "Professional certification",
      ],
    },
    categories: {
      title: "Top Categories",
      items: [
        { name: "Development", icon: "code", count: "120+ courses" },
        { name: "Design", icon: "pen", count: "85+ courses" },
        { name: "Business", icon: "briefcase", count: "95+ courses" },
        { name: "IT & Software", icon: "monitor", count: "60+ courses" },
        { name: "Marketing", icon: "megaphone", count: "45+ courses" },
        { name: "Photography", icon: "camera", count: "30+ courses" },
      ]
    },
    courses: {
      title: "Explore our courses",
      ctaLabel: "Explore All Courses",
      ctaHref: "/explore-courses",
      items: [
        {
          title: "Python Programming for Beginners",
          author: "John Smith",
          level: "Beginner",
          duration: "12h 45m",
          oldPrice: "₹1,999",
          price: "₹499",
          rating: 4.7,
          reviewsCount: "12.4K",
          subject: "python",
          category: "Development",
          featured: false,
        },
        {
          title: "React - The Complete Guide (2024)",
          author: "Emily Johnson",
          level: "Intermediate",
          duration: "18h 30m",
          oldPrice: "₹1,999",
          price: "₹599",
          rating: 4.8,
          reviewsCount: "8.7K",
          subject: "react",
          category: "Development",
          featured: true,
        },
        {
          title: "UI/UX Design Fundamentals",
          author: "David Lee",
          level: "Beginner",
          duration: "10h 15m",
          oldPrice: "₹1,799",
          price: "₹499",
          rating: 4.6,
          reviewsCount: "6.3K",
          subject: "design",
          category: "Design",
          featured: false,
        },
        {
          title: "Microsoft Excel - From Beginner to Expert",
          author: "Sarah Wilson",
          level: "Beginner",
          duration: "8h 00m",
          oldPrice: "₹1,499",
          price: "₹399",
          rating: 4.7,
          reviewsCount: "9.1K",
          subject: "excel",
          category: "Business",
          featured: false,
        },
        {
          title: "AWS Certified Solutions Architect - Associate",
          author: "Michael Brown",
          level: "Advanced",
          duration: "22h 15m",
          oldPrice: "₹2,499",
          price: "₹699",
          rating: 4.8,
          reviewsCount: "7.2K",
          subject: "aws",
          category: "IT & Software",
          featured: false,
        },
        {
          title: "PowerPoint Presentation Masterclass",
          author: "Lisa Anderson",
          level: "Beginner",
          duration: "6h 45m",
          oldPrice: "₹999",
          price: "₹299",
          rating: 4.6,
          reviewsCount: "5.6K",
          subject: "powerpoint",
          category: "Office Productivity",
          featured: false,
        },
      ],
    },
    testimonials: {
      title: "Hear words from our learners",
      items: [
        {
          name: "Ananya Bhat",
          role: "Frontend Developer",
          quote:
            "SkillNest helped me close the gap between theory and practice and land a job within months.",
        },
        {
          name: "Marcus Lee",
          role: "Product Designer",
          quote:
            "The real-world projects were a game-changer. They helped me build a portfolio that got me hired.",
        },
        {
          name: "Ralph Edwards",
          role: "Data Analyst",
          quote:
            "Before this course, I struggled to create professional work. Now I can confidently produce job-ready output.",
        },
      ],
    },
    faqs: {
      title: "Got questions? We have answers.",
      description:
        "These are the most common questions learners ask before getting started.",
      contactLabel: "Contact Support",
      contactHref: "/signin",
      items: [
        {
          question: "Which skills will I learn in the course?",
          answer:
            "Each track covers in-demand, job-ready skills with hands-on projects and real workflows used in the industry.",
          open: false,
        },
        {
          question: "How long is the course?",
          answer:
            "Courses range from 6 to 12 hours of focused content, and you get lifetime access to learn at your own pace.",
          open: false,
        },
        {
          question: "Do I need prior experience to join?",
          answer:
            "No prior experience is required. The learning paths support both beginners and intermediate learners.",
          open: true,
        },
        {
          question: "Will I get a certificate after finishing?",
          answer:
            "Yes. Learners earn a professional SkillNest certificate they can share on resumes and LinkedIn.",
          open: false,
        },
      ],
    },
    cta: {
      eyebrow: "Learn fast, build better, create stronger careers",
      titlePrefix: "Ready to become a",
      titleHighlight: "pro and get hired",
      description:
        "Take your skills to the next level with proven techniques, practical tools, and mentor-backed learning paths.",
      buttonLabel: "Start Learning",
      buttonHref: "/register",
    },
    footer: {
      copyright: "Copyright 2026 SkillNest. All rights reserved.",
    },
    inAction: {
      title: "See SkillNest in action",
      videoUrl: "/testvideo.mp4",
      tabs: [
        {
          tab: "Watch video about SkillNest",
          lesson: "Overview | Learn all about our platform",
          eyebrow: "Watch & Discover",
          title: "See how SkillNest simplifies online learning, classes, batches, and career acceleration for organizations globally.",
        },
        {
          tab: "E-learning",
          lesson: "Module 2 | Interactive Courses",
          eyebrow: "Build a lesson",
          title: "Drag and drop blocks to create interactive e-learning in minutes — no design or code needed.",
        },
        {
          tab: "Instructor",
          lesson: "Live Session | Instructor-led",
          eyebrow: "Teach live",
          title: "Run instructor-led classes with real-time engagement, polls and Q&A across every team.",
        },
        {
          tab: "Live Game",
          lesson: "Quiz Arena | Live Game",
          eyebrow: "Gamify learning",
          title: "Turn assessments into live, competitive games that boost participation and retention.",
        },
      ],
    },
  },
  adminDashboard: {
    welcomeTitle: "Welcome back, Super Admin. SkillNest is live and growing.",
    welcomeSubtitle:
      "Use this dashboard to monitor performance, manage operations, and control the public experience from one place.",
    heroStats: [
      { label: "Platform mode", value: "Production-ready" },
      { label: "CMS scope", value: "Landing + Dashboards" },
      { label: "Control center", value: "Admin managed" },
    ],
    cmsCard: {
      title: "CMS Control Center",
      description:
        "Manage the public landing page, dashboard copy, and future content blocks from one protected workspace.",
      buttonLabel: "Open CMS",
      buttonHref: "/admin/cms",
    },
    operationsCard: {
      title: "Operations Overview",
      description:
        "Track learners, instructors, guardians, classes, assessments, announcements, and platform activity.",
    },
  },
  studentDashboard: {
    welcomeTitle: "Welcome back. Continue building your skills.",
    welcomeSubtitle:
      "Track your enrolled courses, keep your momentum, and stay on top of your schedule.",
    browseLabel: "Browse courses ->",
    continueLearningTitle: "Continue Learning",
    emptyLearningMessage:
      "You have not enrolled in any course yet. Start with a role-relevant learning path today.",
    scheduleTitle: "Schedule",
    scheduleEmptyMessage: "No batch schedule assigned yet.",
  },
  teacherDashboard: {
    welcomeTitle: "Welcome back, Instructor.",
    welcomeSubtitle:
      "Review your schedule, manage learning delivery, and keep students progressing.",
    scheduleTitle: "Schedule",
    announcementsTitle: "Announcements",
  },
  parentDashboard: {
    welcomeTitle: "Welcome back, Guardian.",
    welcomeSubtitle:
      "Monitor learner progress, attendance, and important updates from the institute.",
  },
  agreements: {
    termsOfService: "SkillNest Terms of Service\n\n1. Acceptance of Terms\nBy signing up as an instructor on SkillNest, you agree to comply with all platform regulations, code of conduct guidelines, and legal policies.\n\n2. Platform Usage\nYou agree not to distribute malicious code, scrape user directories, or perform other actions harmful to the institute or system integrity.\n\n3. Account Security\nKeep your password and credentials safe. You are responsible for any actions taken through your instructor profile.",
    instructorAgreement: "SkillNest Instructor Agreement\n\n1. Content Guidelines\nAs an instructor, you agree to create high-quality, original, and accurate educational content. Plagiarism, misleading titles, or copyright infringements are strictly prohibited.\n\n2. Revenue Share & Pricing\nPayouts and revenue share structure will be determined by your contract terms. Standard platform administrative fees are processed before final payouts.\n\n3. Course Ownership\nYou retain the copyright to your materials, but you grant SkillNest a non-exclusive, sublicensable license to host, display, and promote your courses.",
  },
} as const;

type WidenLiteral<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends readonly (infer U)[]
  ? WidenLiteral<U>[]
  : T extends object
  ? { [K in keyof T]: WidenLiteral<T[K]> }
  : T;

export type CmsContentMap = WidenLiteral<typeof cmsDefaults>;
export type LandingCmsContent = CmsContentMap["landing"];
