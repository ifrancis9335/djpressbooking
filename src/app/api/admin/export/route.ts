import { NextResponse } from "next/server";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { getSiteSettings } from "../../../../lib/site-settings";
import { loadSiteContent } from "../../../../lib/site-content";
import { SiteContent } from "../../../../types/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MediaReference {
  section: string;
  id?: string;
  type: "managed" | "legacy";
  url: string;
  title?: string;
  mimeType?: string;
  size?: number;
}

function collectMediaReferences(content: SiteContent): MediaReference[] {
  const refs: MediaReference[] = [];

  if (content.branding.logoImageAsset?.url) {
    refs.push({
      section: "branding.logoImage",
      type: "managed",
      url: content.branding.logoImageAsset.url,
      title: content.branding.logoImageAsset.title,
      mimeType: content.branding.logoImageAsset.mimeType,
      size: content.branding.logoImageAsset.size
    });
  }
  if (content.branding.logoImage) {
    refs.push({ section: "branding.logoImage", type: "legacy", url: content.branding.logoImage });
  }

  if (content.homepageHero.heroImageAsset?.url) {
    refs.push({
      section: "homepageHero.heroImage",
      type: "managed",
      url: content.homepageHero.heroImageAsset.url,
      title: content.homepageHero.heroImageAsset.title,
      mimeType: content.homepageHero.heroImageAsset.mimeType,
      size: content.homepageHero.heroImageAsset.size
    });
  }
  if (content.homepageHero.heroImage) {
    refs.push({ section: "homepageHero.heroImage", type: "legacy", url: content.homepageHero.heroImage });
  }

  content.services.forEach((item) => {
    if (item.imageAsset?.url) {
      refs.push({
        section: "services",
        id: item.id,
        type: "managed",
        url: item.imageAsset.url,
        title: item.imageAsset.title,
        mimeType: item.imageAsset.mimeType,
        size: item.imageAsset.size
      });
    }
    if (item.image) {
      refs.push({ section: "services", id: item.id, type: "legacy", url: item.image });
    }
  });

  content.packages.forEach((item) => {
    if (!item.imageAsset?.url) return;
    refs.push({
      section: "packages",
      id: item.id,
      type: "managed",
      url: item.imageAsset.url,
      title: item.imageAsset.title,
      mimeType: item.imageAsset.mimeType,
      size: item.imageAsset.size
    });
  });

  content.gallery.forEach((item) => {
    if (item.imageAsset?.url) {
      refs.push({
        section: "gallery",
        id: item.id,
        type: "managed",
        url: item.imageAsset.url,
        title: item.imageAsset.title,
        mimeType: item.imageAsset.mimeType,
        size: item.imageAsset.size
      });
    }
    if (item.url) {
      refs.push({ section: "gallery", id: item.id, type: "legacy", url: item.url });
    }
  });

  return refs;
}

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const settings = await getSiteSettings();
    const content = loadSiteContent(settings);
    const mediaReferences = collectMediaReferences(content);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      settings,
      mediaReferences,
      stats: {
        mediaReferenceCount: mediaReferences.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to export admin backup" },
      { status: 500 }
    );
  }
}
