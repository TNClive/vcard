import Link from "next/link";
import { getAllProfiles } from "@/lib/profiles";

export default async function Home() {
  const profiles = await getAllProfiles();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <p className="eyebrow">vCard.in.th</p>
      <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">
        นามบัตรออนไลน์ <span className="text-flame">ของคุณเอง</span>
      </h1>
      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-3">
        สร้างหน้าโปรไฟล์ส่วนตัวที่ <span className="font-mono">vcard.in.th/ชื่อของคุณ</span> พร้อมปุ่มบันทึกรายชื่อลงมือถือ
        QR Code สำหรับแชร์ และลิงก์ช่องทางติดต่อทั้งหมดในหน้าเดียว แก้ไขข้อมูลได้เองตลอดเวลา
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login/" className="btn-primary">
          เริ่มสร้างการ์ด
        </Link>
        <Link href="/dashboard/" className="btn-ghost">
          แก้ไขการ์ดของฉัน
        </Link>
      </div>

      {profiles.length > 0 && (
        <section className="mt-16">
          <div className="mb-3 border-t-2 border-ink pt-3">
            <p className="eyebrow">ตัวอย่าง</p>
            <h2 className="text-[19px]">การ์ดล่าสุด</h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {profiles.slice(0, 12).map(({ profile: p }) => (
              <li key={p.id}>
                <Link
                  href={`/${p.slug}/`}
                  className="flex items-center justify-between rounded-[2px] border border-line-soft bg-white px-4 py-3 hover:border-ink"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {`${p.first_name_th} ${p.last_name_th}`.trim() || `${p.first_name_en} ${p.last_name_en}`.trim()}
                    </span>
                    <span className="block truncate text-[13px] text-muted">{p.title_th || p.title_en}</span>
                  </span>
                  <span className="font-mono text-[12px] text-flame">/{p.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
