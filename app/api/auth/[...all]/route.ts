import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

export async function GET(req: any) {
  await ensureDatabaseSeeded();
  return handlers.GET(req);
}

export async function POST(req: any) {
  await ensureDatabaseSeeded();
  return handlers.POST(req);
}
