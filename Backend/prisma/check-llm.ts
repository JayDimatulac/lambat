import "dotenv/config";

type Chat = { choices?: { message?: { content?: string } }[]; error?: unknown };

// runs one step and prints how many seconds it took, even when it fails
async function timed<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  const t0 = Date.now();
  try {
    const out = await run();
    console.log(`${label}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return out;
  } catch (e) {
    console.log(`${label}: FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s -`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function main() {
  const key = process.env.LLM_API_KEY;
  const base = process.env.LLM_BASE_URL?.replace(/\/+$/, "");
  const model = process.env.LLM_MODEL?.trim();
  console.log("LLM_API_KEY set:", Boolean(key));
  console.log("LLM_BASE_URL:", base);
  console.log("LLM_MODEL:", model);
  if (!key || !base || !model) {
    console.log("Fill in the three LLM_ values in .env first.");
    return;
  }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };

  const list = await timed("GET /models", () => fetch(`${base}/models`, { headers, signal: AbortSignal.timeout(30_000) }));
  if (list?.ok) {
    const data = (await list.json()) as { data?: { id: string }[] };
    const ids = (data.data ?? []).map((m) => m.id);
    console.log(`Model "${model}" is listed:`, ids.some((id) => id === model || id === `models/${model}`));
    console.log("Models you can use:", ids.slice(0, 40).join(", "));
  } else if (list) {
    console.log("GET /models status:", list.status);
  }

  // one tiny question, with and without "low" thinking, to see which one is slow
  for (const effort of [undefined, "low"] as const) {
    const label = `Chat (${effort ? `reasoning_effort ${effort}` : "default thinking"})`;
    const r = await timed(label, () =>
      fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          max_tokens: 400,
          ...(effort ? { reasoning_effort: effort } : {}),
          messages: [{ role: "user", content: "Reply with the single word: ok" }],
        }),
        signal: AbortSignal.timeout(30_000),
      })
    );
    if (!r) continue;
    const body = (await r.json().catch(() => null)) as Chat | null;
    console.log("  status:", r.status, "| reply:", body?.choices?.[0]?.message?.content ?? JSON.stringify(body?.error ?? body));
  }
}

main().catch((e) => console.error("Check failed:", e instanceof Error ? e.message : e));