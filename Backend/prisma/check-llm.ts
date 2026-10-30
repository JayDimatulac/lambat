import "dotenv/config";

async function main() {
  const key = process.env.LLM_API_KEY;
  const base = process.env.LLM_BASE_URL?.replace(/\/+$/, "");
  const model = process.env.LLM_MODEL;
  console.log("LLM_API_KEY set:", Boolean(key));
  console.log("LLM_BASE_URL:", base);
  console.log("LLM_MODEL:", model);
  if (!key || !base || !model) {
    console.log("Fill in the three LLM_ values in .env first.");
    return;
  }

  const list = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } });
  console.log("GET /models status:", list.status);
  if (list.ok) {
    const data = (await list.json()) as { data?: { id: string }[] };
    const ids = (data.data ?? []).map((m) => m.id);
    const found = ids.some((id) => id === model || id === `models/${model}`);
    console.log(`Model "${model}" is listed:`, found);
    if (!found) console.log("Some models you can use:", ids.slice(0, 15).join(", "));
  }

  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: 100, messages: [{ role: "user", content: "Reply with the single word: ok" }] }),
    signal: AbortSignal.timeout(15_000),
  });
  console.log("Chat status:", r.status);
  const body = (await r.json().catch(() => null)) as { choices?: { message?: { content?: string } }[]; error?: unknown } | null;
  console.log("Reply:", body?.choices?.[0]?.message?.content ?? JSON.stringify(body?.error ?? body));
}

main().catch((e) => console.error("Check failed:", e instanceof Error ? e.message : e));