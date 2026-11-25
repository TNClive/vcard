"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProfileBundle } from "@/lib/types";
import {
  ChatIcon,
  DownloadIcon,
  GlobeIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  ShareIcon,
  SOCIAL_BADGE,
  SOCIAL_COLORS,
} from "./icons";

type Lang = "th" | "en";

const T = {
  th: { save: "บันทึกรายชื่อ (vCard)", saveShort: "บันทึก", call: "โทร", email: "อีเมล", web: "เว็บไซต์", share: "แชร์", contact: "ข้อมูลติดต่อ", contactH: "ติดต่อโดยตรง", mobile: "มือถือ", email1: "อีเมลหลัก", email2: "อีเมลสำรอง", area: "พื้นที่", next: "ดำเนินการต่อ", nextH: "สิ่งที่ทำได้ตอนนี้", about: "เกี่ยวกับ", aboutH: "รู้จักกันมากขึ้น", channels: "ช่องทาง", channelsH: "ติดตามได้ที่", qr: "แชร์การ์ด", qrH: "สแกนเพื่อเปิดการ์ดนี้", qrText: "ให้อีกฝ่ายสแกน QR เพื่อเปิดหน้านี้ หรือกดคัดลอกลิงก์", copied: "คัดลอกแล้ว" },
  en: { save: "Save contact (vCard)", saveShort: "Save", call: "Call", email: "Email", web: "Website", share: "Share", contact: "Contact", contactH: "Get in touch", mobile: "Mobile", email1: "Email", email2: "Alt. email", area: "Location", next: "Next steps", nextH: "What you can do now", about: "About", aboutH: "Get to know me", channels: "Channels", channelsH: "Follow me", qr: "Share card", qrH: "Scan to open this card", qrText: "Let others scan this QR code, or copy the link.", copied: "Copied" },
} as const;

function formatThaiMobile(m: string) {
  const d = m.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : m;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className="rounded-[2px] border border-line-soft px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-ink-3 hover:border-ink"
    >
      {done ? label : "COPY"}
    </button>
  );
}

export function ProfileCard({
  data,
  qrSvg,
  shareUrl,
  vcardUrl,
}: {
  data: ProfileBundle;
  qrSvg: string;
  shareUrl: string;
  vcardUrl: string;
}) {
  const { profile: p, socials, ctas } = data;
  const [lang, setLang] = useState<Lang>("th");
  const t = T[lang];

  const nameTh = `${p.first_name_th} ${p.last_name_th}`.trim();
  const nameEn = `${p.first_name_en} ${p.last_name_en}`.trim();
  const primaryName = lang === "th" ? nameTh || nameEn : nameEn || nameTh;
  const secondaryName = lang === "th" ? nameEn : nameTh;
  const title = lang === "th" ? p.title_th || p.title_en : p.title_en || p.title_th;
  const company = lang === "th" ? p.company || p.company_en : p.company_en || p.company;
  const bio = lang === "th" ? p.bio || p.bio_en : p.bio_en || p.bio;
  const tel = p.mobile ? `tel:${p.mobile.replace(/[^\d+]/g, "")}` : "";
  const line = socials.find((s) => s.kind === "line" || s.kind === "line_oa");
  const displayUrl = shareUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: primaryName, url: shareUrl });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard?.writeText(shareUrl).catch(() => {});
  };

  const quick = [
    tel && { href: tel, label: t.call, icon: <PhoneIcon /> },
    line && { href: line.url, label: "LINE", icon: <ChatIcon />, external: true },
    p.email_1 && { href: `mailto:${p.email_1}`, label: t.email, icon: <MailIcon /> },
    p.website && { href: p.website, label: t.web, icon: <GlobeIcon />, external: true },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; external?: boolean }[];

  return (
    <main className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto w-full bg-white md:my-8 md:max-w-[640px] md:overflow-hidden md:rounded-[4px] md:shadow-[0_20px_60px_rgba(10,10,11,.15)] lg:my-0 lg:grid lg:min-h-screen lg:max-w-none lg:grid-cols-[420px_1fr] lg:rounded-none lg:shadow-none xl:grid-cols-[480px_1fr]">
        <aside className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:border-r lg:border-line-soft">
          <header className="flex items-center justify-between bg-ink px-4 py-2.5 text-white lg:px-6">
            <span className="display text-[13px] uppercase tracking-[0.2em]">
              {p.nickname || p.first_name_en || p.slug} <span className="text-acid">·</span> vCard
            </span>
            <div className="flex items-center gap-2">
              {p.show_lang_toggle && (
                <div className="flex overflow-hidden rounded-[2px] border border-line text-[11px] font-semibold">
                  {(["th", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`px-2.5 py-1 uppercase ${lang === l ? "bg-flame text-white" : "text-muted"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" aria-label={t.share} onClick={share} className="rounded-[2px] p-1.5 hover:bg-ink-3">
                <ShareIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div
            className="relative h-36 w-full overflow-hidden md:h-44 lg:h-56"
            style={
              p.banner_url
                ? { backgroundImage: `url(${p.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "linear-gradient(103deg,#ff4d00 0%,#ff7a33 48%,#c6f53c 100%)" }
            }
          >
            {!p.banner_url && (
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "repeating-linear-gradient(135deg,transparent 0 14px,#0a0a0b 14px 15px)" }}
              />
            )}
            {p.location && (
              <span className="absolute bottom-3 right-4 rounded-[2px] bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white">
                {p.location}
              </span>
            )}
          </div>

          <section className="relative z-10 px-5 lg:px-8">
            <div className="-mt-16 mb-3 lg:-mt-20">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-ink text-4xl font-bold text-white shadow-[0_8px_24px_rgba(10,10,11,.25)] lg:h-40 lg:w-40">
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={primaryName} className="h-full w-full object-cover" />
                ) : (
                  <span>{(p.nickname || primaryName).slice(0, 1).toUpperCase()}</span>
                )}
              </div>
            </div>
            <h1 className="text-[26px] leading-tight lg:text-[32px]">{primaryName}</h1>
            {secondaryName && <p className="text-[14px] text-muted">{secondaryName}</p>}
            {title && <p className="mt-1 text-[14px] font-semibold text-flame">{title}</p>}
            {company && <p className="mt-0.5 text-[14px] text-ink-3">{company}</p>}
            {p.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <span key={tag} className="rounded-[2px] border border-line-soft bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink-3">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 flex gap-2">
              {p.show_vcard && (
                <a href={vcardUrl} download={`${p.slug}.vcf`} className="btn-primary flex-1 text-[15px]">
                  <DownloadIcon className="h-4 w-4" /> {t.save}
                </a>
              )}
              <button type="button" onClick={share} className="btn-ghost px-3" aria-label={t.share}>
                <ShareIcon className="h-4 w-4" />
              </button>
            </div>
          </section>

          {quick.length > 0 && (
            <nav className="mt-5 grid border-y border-line-soft lg:mt-auto lg:border-b-0" style={{ gridTemplateColumns: `repeat(${quick.length}, minmax(0,1fr))` }}>
              {quick.map((q) => (
                <a
                  key={q.label}
                  href={q.href}
                  {...(q.external ? { target: "_blank", rel: "noopener" } : {})}
                  className="flex flex-col items-center gap-1 border-r border-line-soft py-3 text-[12px] font-semibold last:border-r-0 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-flame"
                >
                  {q.icon}
                  <span>{q.label}</span>
                </a>
              ))}
            </nav>
          )}
        </aside>

        <div className="min-w-0 lg:bg-paper/40">
          <div className="lg:mx-auto lg:max-w-5xl lg:px-6 lg:py-6 xl:grid xl:grid-cols-2 xl:gap-x-8">
            <Section eyebrow={t.contact} title={t.contactH} accent>
              <div className="divide-y divide-line-soft rounded-[2px] border border-line-soft">
                {p.mobile && <Row icon={<PhoneIcon className="h-4 w-4" />} label={t.mobile} value={formatThaiMobile(p.mobile)} href={tel} copy={p.mobile} copied={t.copied} />}
                {p.email_1 && <Row icon={<MailIcon className="h-4 w-4" />} label={t.email1} value={p.email_1} href={`mailto:${p.email_1}`} copy={p.email_1} copied={t.copied} />}
                {p.email_2 && <Row icon={<MailIcon className="h-4 w-4" />} label={t.email2} value={p.email_2} href={`mailto:${p.email_2}`} copy={p.email_2} copied={t.copied} />}
                {p.website && <Row icon={<GlobeIcon className="h-4 w-4" />} label={t.web} value={p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} href={p.website} external />}
                {p.location && <Row icon={<PinIcon className="h-4 w-4" />} label={t.area} value={p.location} />}
              </div>
            </Section>

            {ctas.length > 0 && (
              <Section eyebrow={t.next} title={t.nextH}>
                <div className="flex flex-col gap-2">
                  {ctas.map((c) => (
                    <a key={c.id} href={c.url} target="_blank" rel="noopener" className="btn-ghost w-full text-[15px]">
                      {c.label}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {bio && (
              <Section eyebrow={t.about} title={t.aboutH}>
                <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-3">{bio}</p>
              </Section>
            )}

            {socials.length > 0 && (
              <Section eyebrow={t.channels} title={t.channelsH}>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {socials.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener"
                      className="flex flex-col items-center gap-1.5 rounded-[2px] border border-line-soft bg-white py-3 text-[11px] font-semibold text-ink-3 hover:border-ink"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: SOCIAL_COLORS[s.kind] ?? SOCIAL_COLORS.website }}
                      >
                        {s.kind === "website" ? <LinkIcon className="h-4 w-4" /> : SOCIAL_BADGE[s.kind] ?? (s.label || s.kind).slice(0, 2)}
                      </span>
                      <span className="max-w-full truncate px-1">{s.label || s.kind}</span>
                      {s.handle && <span className="max-w-full truncate px-1 font-mono text-[10px] font-normal text-muted">{s.handle}</span>}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            <Section eyebrow={t.qr} title={t.qrH}>
              <div className="flex items-center gap-4 rounded-[2px] border border-line-soft bg-paper p-3">
                <div className="h-24 w-24 shrink-0 rounded-[2px] bg-white p-1 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <div className="min-w-0 text-[13px] text-ink-3">
                  <p>{t.qrText}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="truncate rounded-[2px] border border-line-soft bg-white px-2 py-1 font-mono text-[12px]">{displayUrl}</span>
                    <CopyButton value={shareUrl} label={t.copied} />
                  </div>
                </div>
              </div>
            </Section>

            <footer className="mt-6 bg-ink px-5 py-6 text-white lg:mt-8 lg:rounded-[2px] xl:col-span-2">
              {company && <p className="display text-lg">{company}</p>}
              <div className="mt-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                Personal bio profile · <Link href="/" className="text-acid">vCard.in.th</Link>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-flame bg-white md:hidden">
        <div className="mx-auto grid max-w-[430px] grid-cols-4 text-[11px] font-semibold">
          {tel ? (
            <a href={tel} className="flex flex-col items-center gap-1 py-2.5 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-flame"><PhoneIcon /><span>{t.call}</span></a>
          ) : <span />}
          {p.show_vcard ? (
            <a href={vcardUrl} download={`${p.slug}.vcf`} className="flex flex-col items-center gap-1 py-2.5 text-flame [&>svg]:h-5 [&>svg]:w-5"><DownloadIcon /><span>{t.saveShort}</span></a>
          ) : <span />}
          {p.email_1 ? (
            <a href={`mailto:${p.email_1}`} className="flex flex-col items-center gap-1 py-2.5 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-flame"><MailIcon /><span>{t.email}</span></a>
          ) : <span />}
          <button type="button" onClick={share} className="flex flex-col items-center gap-1 py-2.5"><ShareIcon className="h-5 w-5" /><span>{t.share}</span></button>
        </div>
      </div>
    </main>
  );
}

function Section({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className="px-5 pt-6 lg:px-2">
      <div className={`mb-3 border-t-2 pt-3 ${accent ? "border-flame" : "border-ink"}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-[19px]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({
  icon,
  label,
  value,
  href,
  external,
  copy,
  copied,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  copy?: string;
  copied?: string;
}) {
  const text = <span className="block truncate font-mono text-[13.5px] text-ink">{value}</span>;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted">{label}</p>
        {href ? (
          <a href={href} className="hover:text-flame" {...(external ? { target: "_blank", rel: "noopener" } : {})}>
            {text}
          </a>
        ) : (
          text
        )}
      </div>
      {copy && <CopyButton value={copy} label={copied ?? "Copied"} />}
    </div>
  );
}
