import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, data } = await req.json();
  if (!data || typeof data !== "object") return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const targetId = data.id || session.userId;

  const allowed: Record<string, string[]> = {
    teacher: ["name", "email", "phone", "address", "bloodType", "sex", "birthday", "accountHolderName", "bankName", "accountNumber", "ifsc", "upiId", "panNumber", "img", "aadharNumber", "certificateUrl"],
    student: ["name", "email", "phone", "address", "bloodType", "sex", "birthday", "img"],
    parent: ["name", "email", "phone", "address"],
    admin: ["username", "img"],
  };

  const allowedKeys = allowed[role] || [];
  const cleanData: Record<string, any> = {};

  for (const key of allowedKeys) {
    if (data[key] !== undefined && data[key] !== null) {
      if (key === "img") {
        cleanData[key] = data[key] || null;
      } else if (key === "birthday") {
        if (data[key]) cleanData[key] = new Date(data[key]);
      } else if (key === "sex") {
        if (data[key] === "MALE" || data[key] === "FEMALE") {
          cleanData[key] = data[key];
        }
      } else {
        if (typeof data[key] === "string") {
          const val = data[key].trim();
          const nullableKeys = ["email", "phone", "accountHolderName", "bankName", "accountNumber", "ifsc", "upiId", "panNumber", "aadharNumber", "certificateUrl"];
          if (nullableKeys.includes(key)) {
            cleanData[key] = val || null;
          } else {
            cleanData[key] = val;
          }
        }
      }
    }
  }

  if (Object.keys(cleanData).length === 0) {
    return NextResponse.json({ error: "No changes to save" }, { status: 400 });
  }

  try {
    switch (role) {
      case "teacher":
        try {
          await prisma.teacher.update({ where: { id: targetId }, data: cleanData });
        } catch (err: any) {
          console.warn("[Prisma ORM update failed, running SQL fallback]:", err?.message);
          const keys = Object.keys(cleanData);
          if (keys.length > 0) {
            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;
            for (const k of keys) {
              if (k === "sex") {
                setClauses.push(`"sex" = $${idx}::"UserSex"`);
              } else {
                setClauses.push(`"${k}" = $${idx}`);
              }
              values.push(cleanData[k]);
              idx++;
            }
            values.push(targetId);
            const query = `UPDATE "Teacher" SET ${setClauses.join(", ")} WHERE "id" = $${idx}`;
            await prisma.$executeRawUnsafe(query, ...values);
          }
        }
        break;
      case "student":
        await prisma.student.update({ where: { id: targetId }, data: cleanData });
        break;
      case "parent":
        await prisma.parent.update({ where: { id: targetId }, data: cleanData });
        break;
      case "admin":
        await prisma.admin.update({ where: { id: targetId }, data: cleanData });
        break;
      default:
        return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[DB update failed]:", e);
    return NextResponse.json({ error: "Could not update profile. Please check your inputs and try again." }, { status: 500 });
  }
}
