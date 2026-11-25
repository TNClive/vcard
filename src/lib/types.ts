export type Profile = {
  id: string;
  user_id: string;
  slug: string;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  nickname: string;
  title_th: string;
  title_en: string;
  company: string;
  company_en: string;
  tagline: string;
  bio: string;
  bio_en: string;
  mobile: string;
  email_1: string;
  email_2: string;
  website: string;
  location: string;
  avatar_url: string;
  banner_url: string;
  tags: string[];
  published: boolean;
  show_vcard: boolean;
  show_lang_toggle: boolean;
  updated_at: string;
};

export type Social = {
  id: string;
  profile_id: string;
  kind: string;
  label: string;
  handle: string;
  url: string;
  sort_order: number;
  is_active: boolean;
};

export type Cta = {
  id: string;
  profile_id: string;
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
};

export type ProfileBundle = {
  profile: Profile;
  socials: Social[];
  ctas: Cta[];
};

export const SOCIAL_KINDS = [
  "facebook",
  "instagram",
  "line",
  "line_oa",
  "tiktok",
  "youtube",
  "linkedin",
  "x",
  "github",
  "website",
] as const;
