import type { VercelRequest } from "@vercel/node";
import { supabaseAdmin } from "./supabase.js";
import { getUserById, type UserSubscription } from "./db.js";

/**
 * Extracts the Supabase JWT from the Authorization header,
 * verifies it, and returns the user's profile with subscription data.
 */
export async function authenticateRequest(
  req: VercelRequest,
): Promise<UserSubscription | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  // Verify the JWT with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  // Get the full profile with subscription data
  const profile = await getUserById(user.id);
  if (!profile) return null;

  // Banned/deleted accounts cannot use protected API actions
  if (profile.isBanned || profile.deletedAt) return null;

  return profile;
}
