import { NextResponse } from "next/server";
import { getRequesterRole } from "../../admin/_utils";

export async function GET(request: Request) {
  const { role } = await getRequesterRole(request);

  return NextResponse.json({ role: role || null });
}
