import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { prismaRaw } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Check if database is online
    try {
      await prismaRaw.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error("Database connection failed during login:", dbError);
      return NextResponse.json(
        { error: "Database connection failed. Please check if Docker/Database is running." },
        { status: 503 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const tables = [
      { name: "admin", role: "admin", find: (u: string) => prisma.admin.findUnique({ where: { username: u } }) },
      { name: "teacher", role: "teacher", find: (u: string) => prisma.teacher.findUnique({ where: { username: u } }) },
      { name: "student", role: "student", find: (u: string) => prisma.student.findUnique({ where: { username: u } }) },
      { name: "parent", role: "parent", find: (u: string) => prisma.parent.findUnique({ where: { username: u } }) },
      { name: "affiliate", role: "affiliate", find: (u: string) => prisma.affiliate.findUnique({ where: { username: u } }) },
    ];

    for (const table of tables) {
      const user = await table.find(username);
      if (user && "password" in user) {
        const isValid = await bcrypt.compare(password, (user as any).password);
        if (isValid) {
          await createSession({
            userId: user.id,
            role: table.role,
            username: user.username,
          });

          const isVerified =
            table.role === "teacher"
              ? (user as any).isVerified ?? true
              : undefined;

          return NextResponse.json({
            role: table.role,
            userId: user.id,
            ...(isVerified !== undefined ? { isVerified } : {}),
          });
        }
      }
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
