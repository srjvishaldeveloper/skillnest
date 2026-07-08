import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Merge name + surname for all Students
  const students = await prisma.student.findMany({ select: { id: true, name: true, surname: true } });
  for (const s of students) {
    const fullName = [s.name, s.surname].filter(Boolean).join(" ").trim();
    if (fullName !== s.name) {
      await prisma.student.update({ where: { id: s.id }, data: { name: fullName } });
    }
  }
  console.log(`Updated ${students.length} students`);

  // Merge name + surname for all Teachers
  const teachers = await prisma.teacher.findMany({ select: { id: true, name: true, surname: true } });
  for (const t of teachers) {
    const fullName = [t.name, t.surname].filter(Boolean).join(" ").trim();
    if (fullName !== t.name) {
      await prisma.teacher.update({ where: { id: t.id }, data: { name: fullName } });
    }
  }
  console.log(`Updated ${teachers.length} teachers`);

  // Merge name + surname for all Parents
  const parents = await prisma.parent.findMany({ select: { id: true, name: true, surname: true } });
  for (const p of parents) {
    const fullName = [p.name, p.surname].filter(Boolean).join(" ").trim();
    if (fullName !== p.name) {
      await prisma.parent.update({ where: { id: p.id }, data: { name: fullName } });
    }
  }
  console.log(`Updated ${parents.length} parents`);

  console.log("Done! All name+surname merged into name.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
