/**
 * Server-side authentication helper.
 *
 * Extracts and verifies the user from the request.
 * Replace the implementation with your actual auth system (Supabase JWT, etc.).
 */

import type { VercelRequest } from "@vercel/node";
import { getUserById, type UserSubscription } from "./db";

export async function authenticateRequest(
  req: VercelRequest,
): Promise<UserSubscription | null> {
  // TODO: Replace with real auth token verification, e.g.:
  //
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (!token) return null;
  // const { data: { user } } = await supabase.auth.getUser(token);
  // if (!user) return null;
  // return getUserById(user.id);

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const userId = authHeader.replace("Bearer ", "");
  if (!userId) return null;

  return getUserById(userId);
}
