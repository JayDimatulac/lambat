// one JSON-answering call to the same provider llm.ts uses
export async function chatJson(system: string, user: string): Promise<string | null> {
  const key = process.env.LLM_API_KEY;
  const base = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  if (!key || !base || !model) return null;

  const url = `${base.replace(/\/+$/, "")}/chat/completions`;
  const body = JSON.stringify({
    model,
    temperature: 0.2,
    max_tokens: 4000,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const BUSY = [429, 500, 502, 503, 504];
  const deadline = Date.now() + 20_000;

  try {
    let res: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 4_000) break;
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body,
        signal: AbortSignal.timeout(left),
      });
      if (res.ok || !BUSY.includes(res.status)) break;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!res || !res.ok) {
      console.error("LLM gave no answer, status", res?.status);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("LLM call failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export function extractJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}