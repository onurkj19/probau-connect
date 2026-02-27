import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./admin/[...route].js";

export default async function adminProxy(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
