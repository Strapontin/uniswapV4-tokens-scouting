"use client";

import Link from "next/link";
import { useState } from "react";
import { isAddress } from "viem";

import { CurveQuoteControls } from "@/components/curve/CurveQuoteControls";
import { normalizeAddress } from "@/lib/address";

export default function CurvePage() {
  const [poolAddress, setPoolAddress] = useState("");
  const normalizedPoolAddress = normalizeAddress(poolAddress);
  const validPoolAddress = isAddress(normalizedPoolAddress) ? normalizedPoolAddress : null;

  return (
    <main className="mx-auto w-[min(100%-48px,980px)] py-[92px]">
      <Link className="text-[14px] text-[#8d9b93] no-underline transition-colors hover:text-[#f0784b]" href="/">
        ← Back home
      </Link>

      <div className="mt-16 font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Curve / exchange simulation
      </div>

      <h1 className="mt-6 max-w-[680px] text-[clamp(48px,8vw,92px)] font-semibold leading-[.92] tracking-[-.065em]">
        Curve Quotes
      </h1>
      <p className="mt-6 max-w-[620px] text-[17px] text-[#8d9b93]">
        Enter a Curve pool and simulate its exchange function against the live chain state.
      </p>

      <section className="mt-12 border-t border-[#edf4ef] pt-6" aria-label="Curve pool input">
        <label className="flex max-w-[720px] flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">pool address</span>
          <input
            value={poolAddress}
            onChange={(event) => setPoolAddress(event.target.value)}
            className="w-full rounded-md border border-[#2a3831] bg-[#0d1412] px-3 py-3 font-mono text-[13px] text-[#edf4ef] outline-none transition focus:border-[#f0784b]"
            placeholder="0x..."
            spellCheck={false}
          />
        </label>

        {poolAddress.trim() && !validPoolAddress && (
          <p className="mt-3 text-[12px] text-[#f0784b]">Enter a valid pool address.</p>
        )}
      </section>

      {validPoolAddress && (
        <CurveQuoteControls poolAddress={validPoolAddress} />
      )}
    </main>
  );
}
