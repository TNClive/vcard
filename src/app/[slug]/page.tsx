import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ProfileCard } from "@/components/ProfileCard";
import { getProfile, getSlugParams } from "@/lib/profiles";
import { SITE_URL } from "@/lib/site";

// Only slugs known at build time exist; anything else is the static 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return getSlugParams();
}

function absolute(url: string) {
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfile(slug);
  if (!data) return { title: "ไม่พบโปรไฟล์", robots: { index: false } };

  const p = data.profile;
  const nameEn = `${p.first_name_en} ${p.last_name_en}`.trim();
  const nameTh = `${p.first_name_th} ${p.last_name_th}`.trim();
  const name = nameEn || nameTh;
  const title = [name, p.title_en || p.title_th].filter(Boolean).join(" · ");
  const ogTitle = [name, p.company_en || p.company].filter(Boolean).join(" — ");
  const description = p.tagline || p.bio.slice(0, 160);
  const url = `${SITE_URL}/${p.slug}/`;
  const images = p.avatar_url ? [absolute(p.avatar_url)] : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title: ogTitle, description, url, type: "profile", images },
    twitter: { card: images ? "summary_large_image" : "summary", title: ogTitle, description, images },
  };
}

export default async function ProfilePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const data = await getProfile(slug);
  if (!data) notFound();

  const p = data.profile;
  const shareUrl = `${SITE_URL}/${p.slug}/`;
  const qrSvg = await QRCode.toString(shareUrl, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0b", light: "#ffffff" },
  });

  // schema.org Person for search engines / AI answer engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${p.first_name_en} ${p.last_name_en}`.trim() || `${p.first_name_th} ${p.last_name_th}`.trim(),
    alternateName: [`${p.first_name_th} ${p.last_name_th}`.trim(), p.nickname].filter(Boolean),
    jobTitle: p.title_en || p.title_th || undefined,
    worksFor: p.company_en || p.company ? { "@type": "Organization", name: p.company_en || p.company } : undefined,
    description: p.bio_en || p.bio || undefined,
    image: p.avatar_url ? absolute(p.avatar_url) : undefined,
    url: shareUrl,
    sameAs: data.socials.map((s) => s.url),
    knowsAbout: p.tags.length ? p.tags : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProfileCard data={data} qrSvg={qrSvg} shareUrl={shareUrl} vcardUrl={`/${p.slug}/vcard.vcf`} />
    </>
  );
}
