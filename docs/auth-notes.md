# SkillNest — Auth Notes

Seeded test accounts (local development only). All use the password `password123`.

| Username   | Password    | Role    |
| ---------- | ----------- | ------- |
| admin1     | password123 | admin   |
| teacher1   | password123 | teacher |
| student1   | password123 | student |
| parentId1  | password123 | parent  |

> Auth role keys (`admin`, `teacher`, `student`, `parent`) are the JWT role
> strings used by `src/lib/auth.ts` and `src/middleware.ts`. They are kept
> as-is even though the UI now labels them Admin / Instructor / Learner /
> Guardian respectively.
