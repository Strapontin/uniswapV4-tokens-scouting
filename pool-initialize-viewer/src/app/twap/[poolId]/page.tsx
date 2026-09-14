import Link from "next/link";
import { notFound } from "next/navigation";

import { PoolConfiguration } from "@/components/poolInitialize/PoolConfiguration";
import { TwapChart } from "@/components/TwapChart";
import {
  TwapPairOrderProvider,
  TwapPairTitle,
} from "@/components/TwapPairOrder";
import {
  getTwapPool,
  getTwapPriceHistory,
  isPoolId,
  type TwapPricePoint,
} from "@/lib/twap";

export const dynamic = "force-dynamic";

export default async function TwapDetailPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  if (!isPoolId(poolId)) notFound();
  const pool = await getTwapPool(poolId);
  if (!pool) notFound();
  let priceHistory: TwapPricePoint[] = [];
  let priceHistoryError: string | null = null;
  try {
    priceHistory = await getTwapPriceHistory(pool.poolId);
  } catch (error) {
    priceHistoryError =
      error instanceof Error ? error.message : "Unable to load price history.";
  }
  return (
    <main className="mx-auto w-[min(100%-48px,980px)] py-[54px]">
      <Link
        className="text-[14px] text-[#8d9b93] no-underline hover:text-[#f0784b]"
        href="/twap"
      >
        ← All saved pools
      </Link>
      <div className="mt-16 font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Uniswap v4 / TWAP pool
      </div>
      <TwapPairOrderProvider>
        <TwapPairTitle
          token0Symbol={pool.pair.currency0.symbol}
          token1Symbol={pool.pair.currency1.symbol}
        />
        <p className="mt-4 overflow-wrap-anywhere font-mono text-[13px] text-[#8d9b93]">
          {pool.poolId}
        </p>
        <PoolConfiguration
          fee={pool.fee}
          tickSpacing={pool.tickSpacing}
          hooks={pool.hook}
        />
        <TwapChart data={priceHistory} error={priceHistoryError} />
      </TwapPairOrderProvider>
    </main>
  );
}
