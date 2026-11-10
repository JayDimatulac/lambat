import { openDB } from 'idb';

export type QueuedCatch = {
  ref: string; speciesId: string; speciesCode: string;
  kilos: number; iceKg: number; place: string; caughtAt: string; // ISO string
  status: "pending" | "synced"; createdAt: number;
};

const dbp = openDB('lambat', 1, {
  upgrade(db) { db.createObjectStore('catches', { keyPath: 'ref' }); },
});

export async function queueCatch(c: Omit<QueuedCatch, 'status' | 'createdAt'>) {
  await (await dbp).put('catches', { ...c, status: 'pending', createdAt: Date.now() });
}
export async function listPending(): Promise<QueuedCatch[]> {
  return (await (await dbp).getAll('catches')).filter((c) => c.status === 'pending');
}

export async function syncPending(accessToken: string) {
  const pending = await listPending();
  if (!pending.length) return 0;
  const res = await fetch('/api/catches/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
body: JSON.stringify(
  pending.map(({ ref, speciesId, kilos, iceKg, place, caughtAt }) =>
    ({ ref, speciesId, kilos, iceKg, place, caughtAt }))
),
  });
  if (!res.ok) return 0;
  const { synced } = await res.json();
  const db = await dbp;
  for (const ref of synced) {
    const row = await db.get('catches', ref);
    if (row) await db.put('catches', { ...row, status: 'synced' });
  }
  return synced.length;
}

// call once after login:
// window.addEventListener('online', () => syncPending(session.access_token));