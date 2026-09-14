import Link from "next/link";

import { TwapPoolForm } from "@/components/TwapPoolForm";
import { getSavedTwapPools } from "@/lib/twap";

export default async function TwapPage() {
  const pools = await getSavedTwapPools();
  return (
    <main className="mx-auto w-[min(100%-48px,980px)] py-[54px]">
      <Link
        className="text-[14px] text-[#8d9b93] no-underline hover:text-[#f0784b]"
        href="/"
      >
        ← Back home
      </Link>
      <div className="mt-16 font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Uniswap v4 / TWAP
      </div>
      <h1 className="mt-6 text-[clamp(48px,8vw,92px)] font-semibold leading-[.92] tracking-[-.065em]">
        Find a pool
      </h1>
      <p className="mt-6 max-w-[620px] text-[17px] text-[#8d9b93]">
        Look up a Unichain pool by its poolId and keep its metadata ready for
        TWAP work.
      </p>
      <TwapPoolForm />
      <section
        className="mt-16 border-t border-[#edf4ef] pt-6"
        aria-label="Saved TWAP pools"
      >
        <h2 className="text-[20px] font-semibold">Saved pools</h2>
        <div className="mt-4 space-y-3">
          {pools.map((pool) => (
            <Link
              key={pool.poolId}
              href={`/twap/${pool.poolId}`}
              className="block rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 no-underline hover:border-[#f0784b]"
            >
              <strong className="block text-[18px]">
                {pool.pair.currency0.symbol} / {pool.pair.currency1.symbol}
              </strong>
              <span className="mt-2 block overflow-wrap-anywhere font-mono text-[12px] text-[#8d9b93]">
                {pool.poolId}
              </span>
            </Link>
          ))}
          {pools.length === 0 && (
            <p className="text-[#8d9b93]">No saved pools yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
