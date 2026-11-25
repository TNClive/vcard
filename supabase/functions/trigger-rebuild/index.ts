// Supabase Edge Function: called by a Database Webhook whenever profiles,
// socials or ctas change, and asks GitHub Actions to rebuild + redeploy Pages.
//
// Secrets (supabase secrets set ...):
//   GITHUB_TOKEN    fine-grained PAT, repo TNClive/vcard, "Contents: Read and write"
//   GITHUB_REPO     TNClive/vcard
//   WEBHOOK_SECRET  random string; the Database Webhook must send it as
//                   header  x-webhook-secret: <value>
//
// Bursts of edits are fine: the deploy workflow uses a concurrency group that
// cancels in-flight builds, so only the latest data gets published.

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const repo = Deno.env.get("GITHUB_REPO") ?? "TNClive/vcard";

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "vcard-rebuild",
    },
    body: JSON.stringify({
      event_type: "profile-updated",
      client_payload: { table: payload?.table ?? null, type: payload?.type ?? null },
    }),
  });

  if (!res.ok) {
    return new Response(`github dispatch failed: ${res.status} ${await res.text()}`, { status: 502 });
  }
  return new Response("rebuild queued", { status: 202 });
});
