import type { ProfileBundle } from "./types";

// vCard 3.0 — the version iOS and Android contacts both import reliably.

function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** Thai mobile 08x... -> +668x... so the number dials from abroad too. */
export function toE164(mobile: string): string {
  const d = mobile.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("0")) return `+66${d.slice(1)}`;
  return d;
}

export function buildVCard({ profile: p, socials }: ProfileBundle, siteUrl: string): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N;CHARSET=UTF-8:${esc(p.last_name_th || p.last_name_en)};${esc(p.first_name_th || p.first_name_en)};;;`,
    `FN;CHARSET=UTF-8:${esc([p.first_name_th, p.last_name_th].join(" ").trim() || [p.first_name_en, p.last_name_en].join(" ").trim())}`,
  ];
  if (p.nickname) lines.push(`NICKNAME;CHARSET=UTF-8:${esc(p.nickname)}`);
  if (p.company) lines.push(`ORG;CHARSET=UTF-8:${esc(p.company)}`);
  if (p.title_th || p.title_en) lines.push(`TITLE;CHARSET=UTF-8:${esc(p.title_th || p.title_en)}`);
  if (p.mobile) lines.push(`TEL;TYPE=CELL:${toE164(p.mobile)}`);
  if (p.email_1) lines.push(`EMAIL;TYPE=INTERNET,PREF:${p.email_1}`);
  if (p.email_2) lines.push(`EMAIL;TYPE=INTERNET,WORK:${p.email_2}`);
  if (p.website) lines.push(`URL:${p.website}`);
  lines.push(`URL;TYPE=vcard:${siteUrl}/${p.slug}/`);
  for (const s of socials) lines.push(`X-SOCIALPROFILE;TYPE=${s.kind}:${s.url}`);
  if (p.bio) lines.push(`NOTE;CHARSET=UTF-8:${esc(p.bio)}`);
  if (p.avatar_url?.startsWith("http")) lines.push(`PHOTO;VALUE=URI:${p.avatar_url}`);
  lines.push(`REV:${p.updated_at}`, "END:VCARD");
  return lines.join("\r\n") + "\r\n";
}
