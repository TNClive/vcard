import { FIXTURES } from "./fixtures";
import { getBuildSupabase } from "./supabase";
import type { Cta, Profile, ProfileBundle, Social } from "./types";

// Build-time data access. Errors are thrown on purpose: a failed fetch must fail
// the build, never publish a site with every profile missing.

const useFixtures = process.env.VCARD_FIXTURES === "1";

let cache: Promise<ProfileBundle[]> | null = null;

async function loadAll(): Promise<ProfileBundle[]> {
  if (useFixtures) return FIXTURES;

  const sb = getBuildSupabase();
  const [p, s, c] = await Promise.all([
    sb.from("profiles").select("*").eq("published", true).order("slug"),
    sb.from("socials").select("*").eq("is_active", true).order("sort_order"),
    sb.from("ctas").select("*").eq("is_active", true).order("sort_order"),
  ]);
  for (const r of [p, s, c]) {
    if (r.error) throw new Error(`Supabase query failed: ${r.error.message}`);
  }

  const socials = (s.data ?? []) as Social[];
  const ctas = (c.data ?? []) as Cta[];
  return ((p.data ?? []) as Profile[]).map((profile) => ({
    profile,
    socials: socials.filter((x) => x.profile_id === profile.id),
    ctas: ctas.filter((x) => x.profile_id === profile.id),
  }));
}

/** All published profiles, fetched once per build. */
export function getAllProfiles(): Promise<ProfileBundle[]> {
  cache ??= loadAll();
  return cache;
}

export async function getProfile(slug: string): Promise<ProfileBundle | null> {
  return (await getAllProfiles()).find((b) => b.profile.slug === slug) ?? null;
}

/**
 * Params for generateStaticParams. Static export needs at least one entry, so an
 * empty database yields a placeholder that renders the 404 page.
 */
export const PLACEHOLDER_SLUG = "__none__";
export async function getSlugParams(): Promise<{ slug: string }[]> {
  const all = await getAllProfiles();
  return all.length ? all.map((b) => ({ slug: b.profile.slug })) : [{ slug: PLACEHOLDER_SLUG }];
}
