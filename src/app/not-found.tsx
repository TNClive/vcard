import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl">ไม่พบการ์ดนี้</h1>
      <p className="mt-3 text-ink-3">
        ลิงก์อาจพิมพ์ผิด หรือเจ้าของยังไม่ได้เผยแพร่การ์ด (การ์ดที่เพิ่งแก้ไขจะออนไลน์ภายในไม่กี่นาที)
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">
          หน้าแรก
        </Link>
        <Link href="/login/" className="btn-ghost">
          สร้างการ์ดของคุณ
        </Link>
      </div>
    </main>
  );
}
