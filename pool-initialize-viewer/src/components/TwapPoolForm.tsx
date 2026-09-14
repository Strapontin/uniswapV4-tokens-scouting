"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const chains = ["Unichain"];

export function TwapPoolForm() {
  const router = useRouter();
  const [poolId, setPoolId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function findPool() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/twap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ poolId }),
      });
      const result = (await response.json()) as {
        poolId?: string;
        error?: string;
      };
      if (!response.ok || !result.poolId)
        throw new Error(result.error ?? "Unable to find this pool.");
      router.push(`/twap/${result.poolId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to find this pool.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="mt-12 border-t border-[#edf4ef] pt-6"
      aria-label="Find a TWAP pool"
    >
      <div className="grid max-w-[720px] grid-cols-[1fr_3fr] gap-4">
        <label className="flex min-w-0 flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
            chain
          </span>
          <select
            className="h-12 min-w-0 rounded-md border border-[#2a3831] bg-[#0d1412] px-3 font-mono text-[13px] text-[#edf4ef] outline-none focus:border-[#f0784b]"
            defaultValue={chains[0]}
          >
            {chains.map((chain) => (
              <option key={chain}>{chain}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
            poolId
          </span>
          <input
            value={poolId}
            onChange={(event) => setPoolId(event.target.value)}
            className="h-12 w-full min-w-0 rounded-md border border-[#2a3831] bg-[#0d1412] px-3 font-mono text-[13px] text-[#edf4ef] outline-none focus:border-[#f0784b]"
            placeholder="poolId"
            spellCheck={false}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={findPool}
        disabled={loading || !poolId.trim()}
        className="mt-5 rounded-md border border-[#f0784b] bg-[#f0784b] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#0a120f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Finding..." : "Find TWAP"}
      </button>
      {error && <p className="mt-3 text-[12px] text-[#f0784b]">{error}</p>}
    </section>
  );
}
