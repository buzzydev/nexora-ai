export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ ok: true, ai: !!process.env.AI_API_KEY, search: !!process.env.TAVILY_API_KEY, model: process.env.AI_MODEL || "gpt-4o-mini" });
}
