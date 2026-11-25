# vCard.in.th

นามบัตรออนไลน์แบบหลายผู้ใช้: ทุกคนมีหน้าโปรไฟล์ที่ `vcard.in.th/<slug>/` พร้อมปุ่มบันทึกรายชื่อ (`.vcf`), QR Code, ลิงก์โซเชียล และ CTA และแก้ไขข้อมูลเองได้ผ่าน Supabase Auth

**Stack:** Next.js 16 (App Router, `output: "export"`) · Tailwind CSS 4 · Supabase (Postgres + Auth + Storage) · GitHub Pages

## ทำงานอย่างไร

```
ผู้ใช้แก้ข้อมูลที่ /dashboard  ──►  Supabase (profiles / socials / ctas)
                                         │ Database Webhook
                                         ▼
                              Edge Function trigger-rebuild
                                         │ repository_dispatch
                                         ▼
                 GitHub Actions: next build (ดึงโปรไฟล์ที่ published) ──► GitHub Pages
```

- หน้าโปรไฟล์ทุกหน้าถูก render เป็น HTML ตอน build ทำให้ SEO, OG tags และ JSON-LD (`Person`) อยู่ใน HTML ตั้งแต่ต้น
- `/login` และ `/dashboard` เป็น client-side ล้วน (GitHub Pages ไม่มี server)
- ถ้าดึงข้อมูลจาก Supabase ไม่สำเร็จ build จะ **fail** เพื่อไม่ให้ deploy เว็บที่โปรไฟล์หายหมด
- แก้ข้อมูลแล้วจะออนไลน์หลัง rebuild เสร็จ (ประมาณ 1-3 นาที) และมี cron rebuild วันละครั้งเผื่อ webhook หลุด

## โครงสร้าง

| Path | หน้าที่ |
|---|---|
| `src/app/[slug]/page.tsx` | หน้าโปรไฟล์ (SSG ผ่าน `generateStaticParams`) + metadata + JSON-LD |
| `src/app/[slug]/vcard.vcf/route.ts` | ไฟล์ vCard 3.0 แบบ static ต่อโปรไฟล์ |
| `src/app/login`, `src/app/dashboard` | Login (Magic link / Google) และฟอร์มแก้ไข |
| `src/lib/profiles.ts` | ดึงข้อมูลตอน build |
| `supabase/migrations/0001_init.sql` | Tables, RLS, bucket `avatars` |
| `supabase/functions/trigger-rebuild` | Edge Function สั่ง GitHub rebuild |
| `.github/workflows/deploy.yml` | Build + deploy GitHub Pages |

## ตั้งค่าครั้งแรก

### 1. Supabase
1. รัน `supabase/migrations/0001_init.sql` ใน **SQL Editor**
2. **Authentication → URL Configuration**: Site URL = `https://vcard.in.th`, Redirect URLs เพิ่ม `https://vcard.in.th/dashboard/` และ `http://localhost:3000/dashboard/`
3. (ถ้าใช้ Google) เปิด provider Google ใน **Authentication → Providers**

### 2. GitHub
1. **Settings → Pages → Source:** GitHub Actions และตั้ง Custom domain `vcard.in.th` (ไฟล์ `public/CNAME` มีให้แล้ว)
2. **Settings → Secrets and variables → Actions → Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://eugknnmtnlqtoqaosdcb.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key (`sb_publishable_...`) ซึ่งเป็นค่าสาธารณะอยู่แล้ว
   - `NEXT_PUBLIC_SITE_URL` = `https://vcard.in.th`
3. DNS ของ `vcard.in.th`: A records ไปที่ GitHub Pages (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`)

### 3. Auto rebuild เมื่อข้อมูลเปลี่ยน
1. สร้าง fine-grained PAT สำหรับ repo `TNClive/vcard` สิทธิ์ **Contents: Read and write**
2. Deploy function และตั้ง secrets:
   ```bash
   supabase functions deploy trigger-rebuild --no-verify-jwt
   supabase secrets set GITHUB_TOKEN=<pat> GITHUB_REPO=TNClive/vcard WEBHOOK_SECRET=<random>
   ```
3. **Database → Webhooks**: สร้าง webhook บน `profiles`, `socials`, `ctas` (Insert/Update/Delete) → HTTP POST ไปที่ URL ของ function พร้อม header `x-webhook-secret: <random>`

## Local development

```bash
cp .env.example .env.local   # ใส่ publishable key
npm install
npm run dev
```

ทดสอบโดยไม่ต้องมีข้อมูลใน Supabase: `VCARD_FIXTURES=1 npm run build` จะ build จากข้อมูลตัวอย่าง (`/demo/`)

> ใน Claude Code cloud environment `vcard` ระบบจะใส่ key ให้เองที่ network proxy ให้ตั้ง `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=proxy-injected` และ `NODE_USE_ENV_PROXY=1` ตอน build
