import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.update({
      where: { id: session.userId },
      data: { onboardingComplete: true },
      select: { id: true, name: true, username: true },
    });

    // Notify admin that teacher completed onboarding and needs approval
    await prisma.announcement.create({
      data: {
        title: `Teacher onboarding completed: ${teacher.name}`,
        description: `Teacher ${teacher.name} (${teacher.username}) has completed onboarding and is awaiting verification. Click to review and approve.###link:/list/teachers/${teacher.id}`,
        date: new Date(),
        authorId: teacher.id,
        authorRole: "teacher",
        authorName: teacher.name,
        classId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
