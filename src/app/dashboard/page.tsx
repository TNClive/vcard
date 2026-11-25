"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabase, supabaseConfigured } from "@/lib/supabase";
import { SOCIAL_KINDS, type Cta, type Profile, type Social } from "@/lib/types";

type Draft = Omit<Profile, "id" | "user_id" | "updated_at"> & { id?: string };
type SocialDraft = Omit<Social, "id" | "profile_id"> & { id?: string };
type CtaDraft = Omit<Cta, "id" | "profile_id"> & { id?: string };

const EMPTY: Draft = {
  slug: "",
  first_name_th: "",
  last_name_th: "",
  first_name_en: "",
  last_name_en: "",
  nickname: "",
  title_th: "",
  title_en: "",
  company: "",
  company_en: "",
  tagline: "",
  bio: "",
  bio_en: "",
  mobile: "",
  email_1: "",
  email_2: "",
  website: "",
  location: "",
  avatar_url: "",
  banner_url: "",
  tags: [],
  published: false,
  show_vcard: true,
  show_lang_toggle: true,
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [socials, setSocials] = useState<SocialDraft[]>([]);
  const [ctas, setCtas] = useState<CtaDraft[]>([]);
  const [tagsText, setTagsText] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (s: Session) => {
    const sb = getBrowserSupabase();
    const { data: p, error } = await sb.from("profiles").select("*").eq("user_id", s.user.id).maybeSingle();
    if (error) {
      setMsg({ kind: "err", text: error.message });
    } else if (p) {
      setDraft(p as Profile);
      setTagsText((p as Profile).tags.join(", "));
      const [so, ct] = await Promise.all([
        sb.from("socials").select("*").eq("profile_id", p.id).order("sort_order"),
        sb.from("ctas").select("*").eq("profile_id", p.id).order("sort_order"),
      ]);
      setSocials((so.data ?? []) as Social[]);
      setCtas((ct.data ?? []) as Cta[]);
    } else {
      setDraft({ ...EMPTY, email_1: s.user.email ?? "" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) load(data.session);
      else window.location.replace("/login/");
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const uploadAvatar = async (file: File) => {
    if (!session) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsg({ kind: "err", text: "ไฟล์รูปต้องไม่เกิน 2 MB" });
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
    const sb = getBrowserSupabase();
    const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    set("avatar_url", sb.storage.from("avatars").getPublicUrl(path).data.publicUrl);
  };

  const save = async () => {
    if (!session) return;
    const slug = draft.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      setMsg({ kind: "err", text: "ลิงก์ต้องเป็นตัวอักษร a-z, 0-9 หรือ - ยาว 2-32 ตัว" });
      return;
    }
    setSaving(true);
    setMsg(null);
    const sb = getBrowserSupabase();
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12);
    const row = { ...draft, slug, tags, user_id: session.user.id };
    delete (row as Partial<Profile>).updated_at;

    const { data: saved, error } = await sb.from("profiles").upsert(row, { onConflict: "user_id" }).select().single();
    if (error) {
      setSaving(false);
      setMsg({
        kind: "err",
        text: error.code === "23505" ? `ลิงก์ /${slug} มีคนใช้แล้ว ลองชื่ออื่นนะคะ` : error.message,
      });
      return;
    }
    const pid = (saved as Profile).id;

    // replace child rows: simplest correct approach for small lists
    const writeChildren = async (table: "socials" | "ctas", rows: (SocialDraft | CtaDraft)[]) => {
      const del = await sb.from(table).delete().eq("profile_id", pid);
      if (del.error) throw del.error;
      const clean = rows
        .filter((r) => r.url.trim())
        .map((r, i) => {
          const { id: _id, ...rest } = r;
          void _id;
          return { ...rest, profile_id: pid, sort_order: i + 1 };
        });
      if (clean.length) {
        const ins = await sb.from(table).insert(clean);
        if (ins.error) throw ins.error;
      }
    };
    try {
      await writeChildren("socials", socials);
      await writeChildren("ctas", ctas);
      setDraft(saved as Profile);
      setMsg({
        kind: "ok",
        text: draft.published
          ? `บันทึกแล้ว การ์ดจะอัปเดตที่ vcard.in.th/${slug} ภายในไม่กี่นาที`
          : "บันทึกแล้ว (ยังไม่เผยแพร่ เปิด “เผยแพร่การ์ด” เมื่อพร้อม)",
      });
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    }
    setSaving(false);
  };

  const signOut = async () => {
    await getBrowserSupabase().auth.signOut();
    window.location.replace("/");
  };

  if (!supabaseConfigured) {
    return <Shell><p>ยังไม่ได้ตั้งค่า Supabase</p></Shell>;
  }
  if (loading || !session) {
    return <Shell><p className="text-muted">กำลังโหลด…</p></Shell>;
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">แดชบอร์ด</p>
          <h1 className="text-2xl">การ์ดของฉัน</h1>
          <p className="text-[13px] text-muted">{session.user.email}</p>
        </div>
        <div className="flex gap-2">
          {draft.id && draft.published && (
            <Link href={`/${draft.slug}/`} target="_blank" className="btn-ghost text-[14px]">
              ดูการ์ด
            </Link>
          )}
          <button type="button" onClick={signOut} className="btn-ghost text-[14px]">
            ออกจากระบบ
          </button>
        </div>
      </div>

      <Group title="ลิงก์และการเผยแพร่">
        <Field label="ลิงก์การ์ด" hint="a-z, 0-9, - เท่านั้น">
          <div className="flex items-center">
            <span className="rounded-l-[2px] border border-r-0 border-line-soft bg-paper px-2 py-[0.55rem] font-mono text-[13px] text-muted">vcard.in.th/</span>
            <input className="field rounded-l-none font-mono" value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="yourname" />
          </div>
        </Field>
        <Toggle label="เผยแพร่การ์ด" checked={draft.published} onChange={(v) => set("published", v)} />
        <Toggle label="แสดงปุ่มบันทึกรายชื่อ (vCard)" checked={draft.show_vcard} onChange={(v) => set("show_vcard", v)} />
        <Toggle label="แสดงปุ่มสลับภาษา TH/EN" checked={draft.show_lang_toggle} onChange={(v) => set("show_lang_toggle", v)} />
      </Group>

      <Group title="รูปโปรไฟล์">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {draft.avatar_url && <img src={draft.avatar_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} className="text-[13px]" />
        </div>
      </Group>

      <Group title="ชื่อและตำแหน่ง">
        <Two>
          <Text label="ชื่อ (ไทย)" v={draft.first_name_th} on={(v) => set("first_name_th", v)} />
          <Text label="นามสกุล (ไทย)" v={draft.last_name_th} on={(v) => set("last_name_th", v)} />
          <Text label="First name" v={draft.first_name_en} on={(v) => set("first_name_en", v)} />
          <Text label="Last name" v={draft.last_name_en} on={(v) => set("last_name_en", v)} />
          <Text label="ชื่อเล่น" v={draft.nickname} on={(v) => set("nickname", v)} />
          <Text label="พื้นที่" v={draft.location} on={(v) => set("location", v)} placeholder="Bangkok · Thailand" />
          <Text label="ตำแหน่ง (ไทย)" v={draft.title_th} on={(v) => set("title_th", v)} />
          <Text label="Title (EN)" v={draft.title_en} on={(v) => set("title_en", v)} />
          <Text label="บริษัท (ไทย)" v={draft.company} on={(v) => set("company", v)} />
          <Text label="Company (EN)" v={draft.company_en} on={(v) => set("company_en", v)} />
        </Two>
        <Text label="Tagline (ใช้เป็น meta description)" v={draft.tagline} on={(v) => set("tagline", v)} />
        <Field label="ความเชี่ยวชาญ (คั่นด้วย ,)">
          <input className="field" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="SEO, Google Ads, WordPress" />
        </Field>
        <Field label="เกี่ยวกับฉัน (ไทย)">
          <textarea className="field min-h-24" value={draft.bio} onChange={(e) => set("bio", e.target.value)} />
        </Field>
        <Field label="About (EN)">
          <textarea className="field min-h-24" value={draft.bio_en} onChange={(e) => set("bio_en", e.target.value)} />
        </Field>
      </Group>

      <Group title="ข้อมูลติดต่อ">
        <Two>
          <Text label="มือถือ" v={draft.mobile} on={(v) => set("mobile", v)} placeholder="0812345678" type="tel" />
          <Text label="เว็บไซต์" v={draft.website} on={(v) => set("website", v)} placeholder="https://" type="url" />
          <Text label="อีเมลหลัก" v={draft.email_1} on={(v) => set("email_1", v)} type="email" />
          <Text label="อีเมลสำรอง" v={draft.email_2} on={(v) => set("email_2", v)} type="email" />
        </Two>
      </Group>

      <Group title="โซเชียลมีเดีย">
        {socials.map((s, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr_auto] gap-2 sm:grid-cols-[120px_1fr_140px_auto]">
            <select className="field" value={s.kind} onChange={(e) => setSocials(upd(socials, i, { kind: e.target.value }))}>
              {SOCIAL_KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <input className="field" placeholder="https://" value={s.url} onChange={(e) => setSocials(upd(socials, i, { url: e.target.value }))} />
            <input className="field hidden sm:block" placeholder="handle" value={s.handle} onChange={(e) => setSocials(upd(socials, i, { handle: e.target.value }))} />
            <RowTools i={i} list={socials} setList={setSocials} />
          </div>
        ))}
        <button type="button" className="btn-ghost self-start text-[13px]" onClick={() => setSocials([...socials, { kind: "facebook", label: "", handle: "", url: "", sort_order: socials.length + 1, is_active: true }])}>
          + เพิ่มช่องทาง
        </button>
      </Group>

      <Group title="ปุ่ม Call-to-Action">
        {ctas.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input className="field" placeholder="ข้อความบนปุ่ม" value={c.label} onChange={(e) => setCtas(upd(ctas, i, { label: e.target.value }))} />
            <input className="field" placeholder="https://" value={c.url} onChange={(e) => setCtas(upd(ctas, i, { url: e.target.value }))} />
            <RowTools i={i} list={ctas} setList={setCtas} />
          </div>
        ))}
        <button type="button" className="btn-ghost self-start text-[13px]" onClick={() => setCtas([...ctas, { label: "", url: "", sort_order: ctas.length + 1, is_active: true }])}>
          + เพิ่มปุ่ม
        </button>
      </Group>

      <div className="sticky bottom-0 -mx-5 mt-8 flex flex-wrap items-center gap-3 border-t border-line-soft bg-paper/95 px-5 py-3 backdrop-blur">
        <button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        {msg && <p className={`text-[13px] ${msg.kind === "ok" ? "text-ink-3" : "text-flame"}`}>{msg.text}</p>}
      </div>
    </Shell>
  );
}

function upd<T>(list: T[], i: number, patch: Partial<T>): T[] {
  return list.map((x, j) => (j === i ? { ...x, ...patch } : x));
}

function RowTools<T>({ i, list, setList }: { i: number; list: T[]; setList: (l: T[]) => void }) {
  const move = (d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };
  return (
    <div className="flex gap-1">
      <button type="button" aria-label="ขึ้น" className="field w-8 px-0" onClick={() => move(-1)}>↑</button>
      <button type="button" aria-label="ลง" className="field w-8 px-0" onClick={() => move(1)}>↓</button>
      <button type="button" aria-label="ลบ" className="field w-8 px-0 text-flame" onClick={() => setList(list.filter((_, j) => j !== i))}>×</button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 border-t-2 border-ink pt-3 text-[17px]">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Two({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold">
        {label} {hint && <span className="font-normal text-muted">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Text({ label, v, on, placeholder, type = "text" }: { label: string; v: string; on: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <Field label={label}>
      <input className="field" type={type} value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} />
    </Field>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[14px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#ff4d00]" />
      {label}
    </label>
  );
}
