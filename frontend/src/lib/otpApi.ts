// If you already have an API helper with a base URL, use its URL instead of this constant.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

async function post<T>(path: string, body: unknown): Promise<Result<T>> {
  try {
    const res = await fetch(`${BASE}/api/auth/otp${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, error: data?.error ?? 'Something went wrong' }
    return { ok: true, data }
  } catch {
    return { ok: false, status: 0, error: "Can't reach the server. Check your connection." }
  }
}

export const forgotPassword = (mobile: string) => post<{ ok: true }>('/forgot-password', { mobile })
export const verifyResetCode = (mobile: string, code: string) =>
  post<{ resetToken: string }>('/forgot-password/verify', { mobile, code })
export const resetPassword = (resetToken: string, newPassword: string) =>
  post<{ ok: true }>('/reset-password', { resetToken, newPassword })