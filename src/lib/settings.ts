export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/parent(.*)": ["parent"],
  "/list/teachers": ["admin", "teacher"],
  "/list/students": ["admin", "teacher"],
  "/list/parents": ["admin", "teacher"],
  "/list/subjects": ["admin"],
  "/list/classes": ["admin", "teacher"],
  "/list/exams": ["admin", "teacher", "student", "parent"],
  "/list/assignments": ["admin", "teacher", "student", "parent"],
  "/list/results": ["admin", "teacher", "student", "parent"],
  "/list/attendance": ["admin", "teacher", "student", "parent"],
  "/list/events": ["admin", "teacher", "student", "parent"],
  "/list/announcements": ["admin", "teacher", "student", "parent"],
  "/list/invite-teachers": ["admin", "teacher"],
  // SkillNest LMS course content
  "/courses(.*)": ["admin", "teacher"],
  "/instructor(.*)": ["admin", "teacher"],
  "/affiliate(.*)": ["affiliate", "admin"],
  "/superadmin(.*)": ["admin"],
  "/org(.*)": ["admin", "teacher"],
  "/browse(.*)": ["admin", "teacher", "student", "parent"],
  "/my-learning(.*)": ["admin", "teacher", "student", "parent"],
  "/learn(.*)": ["admin", "teacher", "student", "parent"],
  "/messages(.*)": ["admin", "teacher", "student"],
  // Coding Practice Platform
  "/problems(.*)": ["admin", "teacher", "student"],
  "/playground(.*)": ["admin", "teacher", "student"],
  "/submissions(.*)": ["admin", "teacher", "student"],
  "/leaderboard(.*)": ["admin", "teacher", "student"],
  "/list/contests": ["admin", "teacher"],
  "/contests(.*)": ["admin", "teacher", "student"],
};