import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { cmsDefaults, cmsPageMeta, CmsPageKey, getCmsPage, updateCmsPage } from "@/lib/cms";

function isCmsPageKey(value: string): value is CmsPageKey {
  return value in cmsDefaults;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isCmsPageKey(params.slug)) {
    return NextResponse.json({ error: "Unknown CMS page" }, { status: 404 });
  }

  const content = await getCmsPage(params.slug);
  return NextResponse.json({
    slug: params.slug,
    title: cmsPageMeta[params.slug].title,
    description: cmsPageMeta[params.slug].description,
    content,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isCmsPageKey(params.slug)) {
    return NextResponse.json({ error: "Unknown CMS page" }, { status: 404 });
  }

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = body?.content;

    if (!content || typeof content !== "object") {
      return NextResponse.json({ error: "Invalid CMS payload" }, { status: 400 });
    }

    const updated = await updateCmsPage(params.slug, content);
    cmsPageMeta[params.slug].revalidatePaths.forEach((item) => revalidatePath(item));

    return NextResponse.json({
      success: true,
      slug: params.slug,
      content: updated,
    });
  } catch (error) {
    console.error("CMS update error:", error);
    return NextResponse.json({ error: "Failed to update CMS content" }, { status: 500 });
  }
}
