import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

export const jwtPayload = (t: string) =>
  JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());

export async function markSessionVerified(accessToken: string, userId: string) {
  const sid = jwtPayload(accessToken).session_id;
  if (sid) await prisma.verifiedSession.upsert({
    where: { sessionId: sid }, update: {}, create: { sessionId: sid, userId },
  });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Unauthorized' });
  const sid = jwtPayload(token).session_id;
  const ok = sid && (await prisma.verifiedSession.findUnique({ where: { sessionId: sid } }));
  if (!ok) return res.status(401).json({ error: 'Verification required' });
  res.locals.userId = data.user.id;
  next();
};