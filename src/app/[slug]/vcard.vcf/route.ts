import { getProfile, getSlugParams } from "@/lib/profiles";
import { SITE_URL } from "@/lib/site";
import { buildVCard } from "@/lib/vcard";

// Emitted at build time as out/<slug>/vcard.vcf
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getSlugParams();
}

export async function GET(_req: Request, { params }: RouteContext<"/[slug]/vcard.vcf">) {
  const { slug } = await params;
  const data = await getProfile(slug);
  if (!data || !data.profile.show_vcard) {
    return new Response("BEGIN:VCARD\r\nVERSION:3.0\r\nFN:\r\nEND:VCARD\r\n", {
      headers: { "Content-Type": "text/vcard; charset=utf-8" },
    });
  }
  return new Response(buildVCard(data, SITE_URL), {
    headers: { "Content-Type": "text/vcard; charset=utf-8" },
  });
}
