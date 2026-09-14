import { NextResponse } from "next/server";

import { fetchAndSaveTwapPool, isPoolId } from "@/lib/twap";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { poolId?: unknown } | null;
  const poolId = typeof body?.poolId === "string" ? body.poolId.trim() : "";

  if (!isPoolId(poolId)) {
    return NextResponse.json({ error: "Enter a 32-byte poolId." }, { status: 400 });
  }

  try {
    return NextResponse.json(await fetchAndSaveTwapPool(poolId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to find this pool." }, { status: 404 });
  }
}