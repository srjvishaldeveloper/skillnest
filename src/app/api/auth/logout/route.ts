import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
  } catch (error) {
    console.error("Logout session deletion error:", error);
  }
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function GET() {
  try {
    await deleteSession();
  } catch (error) {
    console.error("Logout session deletion error:", error);
  }
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
