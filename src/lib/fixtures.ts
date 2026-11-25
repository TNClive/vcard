import type { ProfileBundle } from "./types";

// Demo data for local builds without Supabase (VCARD_FIXTURES=1). Never used in CI.
export const FIXTURES: ProfileBundle[] = [
  {
    profile: {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "00000000-0000-0000-0000-0000000000aa",
      slug: "demo",
      first_name_th: "สมชาย",
      last_name_th: "ใจดี",
      first_name_en: "Somchai",
      last_name_en: "Jaidee",
      nickname: "Chai",
      title_th: "นักออกแบบผลิตภัณฑ์",
      title_en: "Product Designer",
      company: "บริษัท ตัวอย่าง จำกัด",
      company_en: "Example Co., Ltd.",
      tagline: "UX · UI · Design Systems",
      bio: "นักออกแบบผลิตภัณฑ์ดิจิทัล ทำงานด้าน UX และ Design System มากว่า 8 ปี",
      bio_en: "Digital product designer focused on UX and design systems for 8+ years.",
      mobile: "0800000000",
      email_1: "demo@example.com",
      email_2: "",
      website: "https://example.com",
      location: "Bangkok · Thailand",
      avatar_url: "",
      banner_url: "",
      tags: ["UX", "UI", "Figma", "Design Systems"],
      published: true,
      show_vcard: true,
      show_lang_toggle: true,
      updated_at: "2026-11-25T00:00:00Z",
    },
    socials: [
      { id: "s1", profile_id: "00000000-0000-0000-0000-000000000001", kind: "linkedin", label: "LinkedIn", handle: "somchai", url: "https://www.linkedin.com/", sort_order: 1, is_active: true },
      { id: "s2", profile_id: "00000000-0000-0000-0000-000000000001", kind: "line", label: "LINE", handle: "somchai", url: "https://line.me/", sort_order: 2, is_active: true },
      { id: "s3", profile_id: "00000000-0000-0000-0000-000000000001", kind: "website", label: "Website", handle: "example.com", url: "https://example.com", sort_order: 3, is_active: true },
    ],
    ctas: [
      { id: "c1", profile_id: "00000000-0000-0000-0000-000000000001", label: "นัดคุยงาน", url: "https://example.com/contact", sort_order: 1, is_active: true },
    ],
  },
];
