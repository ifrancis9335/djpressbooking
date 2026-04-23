import { NextResponse } from "next/server";
import { requireAdminCsrf, requireAdminRequest } from "../../../../lib/admin-auth";
import { getSiteSettings, patchSiteSettings } from "../../../../lib/site-settings";
import { sharedContentPatchSchema } from "../../../../lib/validators/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPhoneHref(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return `tel:+${digits}`;
  }

  if (digits.length === 10) {
    return `tel:+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `tel:+${digits}`;
  }

  return `tel:+${digits}`;
}

export async function PATCH(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
    }

    const parsed = sharedContentPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const phoneHref = toPhoneHref(parsed.data.contact.phone);
    const currentSettings = await getSiteSettings();
    const settings = await patchSiteSettings({
      contact: {
        phone: parsed.data.contact.phone,
        phoneHref,
        email: parsed.data.contact.email,
        serviceArea: parsed.data.contact.serviceArea
      },
      site: {
        primaryCtaLabel: parsed.data.site.primaryCtaLabel,
        heroSupportText: currentSettings.site.heroSupportText,
        serviceAreaLine: parsed.data.site.serviceAreaLine
      },
      content: {
        homepageHero: {
          title: parsed.data.homepageHero.title,
          description: parsed.data.homepageHero.description,
          primaryCtaLabel: parsed.data.homepageHero.primaryCtaLabel,
          secondaryCtaLabel: parsed.data.homepageHero.secondaryCtaLabel
        },
        contact: {
          phone: parsed.data.contact.phone,
          phoneHref,
          email: parsed.data.contact.email,
          serviceArea: parsed.data.contact.serviceArea
        }
      }
    });

    return NextResponse.json({
      message: "Shared content updated",
      settings,
      content: settings.content
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update shared content" },
      { status: 500 }
    );
  }
}