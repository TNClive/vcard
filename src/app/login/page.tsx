"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase, supabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // already signed in -> straight to the dashboard
  useEffect(() => {
    if (!supabaseConfigured) return;
    getBrowserSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) window.location.replace("/dashboard/");
      });
  }, []);

  const redirectTo = () => `${window.location.origin}/dashboard/`;

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const { error } = await getBrowserSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  };

  const google = async () => {
    const { error } = await getBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Link href="/" className="eyebrow">
        ← vCard.in.th
      </Link>
      <h1 className="mt-2 text-3xl">เข้าสู่ระบบ</h1>
      <p className="mt-2 text-ink-3">เข้าสู่ระบบเพื่อสร้างหรือแก้ไขการ์ดของคุณ</p>

      {!supabaseConfigured ? (
        <p className="mt-6 rounded-[2px] border border-flame bg-white p-3 text-[14px]">
          ยังไม่ได้ตั้งค่า Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
        </p>
      ) : status === "sent" ? (
        <p className="mt-6 rounded-[2px] border border-line-soft bg-white p-4 text-[14px]">
          ส่งลิงก์เข้าสู่ระบบไปที่ <b>{email}</b> แล้ว กรุณาเปิดอีเมลแล้วกดลิงก์บนอุปกรณ์เครื่องนี้
        </p>
      ) : (
        <>
          <button type="button" onClick={google} className="btn-ghost mt-6 w-full">
            เข้าสู่ระบบด้วย Google
          </button>
          <div className="my-4 flex items-center gap-3 text-[12px] text-muted">
            <span className="h-px flex-1 bg-line-soft" /> หรือ <span className="h-px flex-1 bg-line-soft" />
          </div>
          <form onSubmit={sendLink} className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[13px] font-semibold">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@example.com"
            />
            <button type="submit" disabled={status === "sending"} className="btn-primary mt-2 disabled:opacity-60">
              {status === "sending" ? "กำลังส่ง…" : "ส่งลิงก์เข้าสู่ระบบ"}
            </button>
          </form>
        </>
      )}
      {error && <p className="mt-3 text-[13px] text-flame">{error}</p>}
    </main>
  );
}
