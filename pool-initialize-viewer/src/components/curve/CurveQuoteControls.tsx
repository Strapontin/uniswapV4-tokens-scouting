"use client";

import { useEffect, useState } from "react";
import { createPublicClient, formatUnits, http, toHex, type Address } from "viem";
import { unichain } from "viem/chains";

import tokenMetadata from "../../../data/token_metadata.json";
import { QuoteInputControls } from "@/components/QuoteInputControls";
import { getAllowanceStorageKey, getBalanceStorageKey, CURVE_DUMMY_ACCOUNT, CURVE_POOL_ABI } from "@/lib/curve";
import { normalizeAddress } from "@/lib/address";
import { RPC_URL } from "@/lib/uniswap";

const publicClient = createPublicClient({ chain: unichain, transport: http(RPC_URL) });
const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1);
const balanceStorageSlots = [BigInt(0), BigInt(1)];
const allowanceStorageSlots = [BigInt(1), BigInt(2)];

type CurveToken = { address: Address; name: string; symbol: string; decimals: number };

function getTokenMetadata(address: Address): CurveToken {
  const normalizedAddress = normalizeAddress(address).toLowerCase();
  const metadata = (tokenMetadata as Record<string, { name?: string; symbol?: string; decimals?: number }>)[normalizedAddress];

  return {
    address,
    name: metadata?.name ?? "Unknown token",
    symbol: metadata?.symbol ?? "UNK",
    decimals: Number(metadata?.decimals ?? 18),
  };
}

export function CurveQuoteControls({ poolAddress }: { poolAddress: Address }) {
  const [tokens, setTokens] = useState<CurveToken[]>([]);
  const [loadedPoolAddress, setLoadedPoolAddress] = useState<Address | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [amountIn, setAmountIn] = useState("0");
  const [quote, setQuote] = useState<bigint | null>(null);
  const [quotePoolAddress, setQuotePoolAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([0, 1].map((index) => publicClient.readContract({
      address: poolAddress,
      abi: CURVE_POOL_ABI,
      functionName: "coins",
      args: [BigInt(index)],
    })))
      .then((addresses) => {
        if (!cancelled) {
          setTokens(addresses.map(getTokenMetadata));
          setLoadedPoolAddress(poolAddress);
        }
      })
      .catch((readError) => {
        if (!cancelled) setError(readError instanceof Error ? readError.message : "Failed to read Curve pool coins.");
      });

    return () => {
      cancelled = true;
    };
  }, [poolAddress]);

  const availableTokens = loadedPoolAddress === poolAddress ? tokens : [];
  const tokenIn = availableTokens[selectedIndex];
  const tokenOut = availableTokens[1 - selectedIndex];
  const runQuote = async () => {
    try {
      if (!tokenIn || !tokenOut) throw new Error("Curve pool tokens are not available.");
      setLoading(true);
      setError(null);
      setQuote(null);

      const result = await publicClient.simulateContract({
        address: poolAddress,
        abi: CURVE_POOL_ABI,
        functionName: "exchange",
        account: CURVE_DUMMY_ACCOUNT,
        args: [BigInt(selectedIndex), BigInt(1 - selectedIndex), BigInt(amountIn), BigInt(0)],
        stateOverride: [tokenIn, tokenOut].map(({ address }) => ({
          address,
          stateDiff: [
            ...(address === tokenIn.address
              ? balanceStorageSlots.map((slot) => ({
                  slot: getBalanceStorageKey(CURVE_DUMMY_ACCOUNT, slot),
                  value: toHex(maxUint256, { size: 32 }),
                }))
              : []),
            ...allowanceStorageSlots.map((slot) => ({
              slot: getAllowanceStorageKey(CURVE_DUMMY_ACCOUNT, poolAddress, slot),
              value: toHex(maxUint256, { size: 32 }),
            })),
          ],
        })),
      });

      setQuote(result.result);
      setQuotePoolAddress(poolAddress);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Failed to run Curve quote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-12" aria-label="Curve quote controls">
      <div className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <QuoteInputControls
            tokens={availableTokens}
            selectedTokenIndex={selectedIndex}
            onSelectToken={setSelectedIndex}
            amountIn={amountIn}
            onAmountChange={setAmountIn}
            tokenDecimals={tokenIn?.decimals ?? 18}
            decimalSymbol={tokenIn?.symbol}
            onRunQuote={runQuote}
            loading={loading}
            disabled={availableTokens.length !== 2}
          />
        </div>
        {error && <p className="mt-3 text-[12px] text-[#f0784b]">{error}</p>}
      </div>

      {quotePoolAddress === poolAddress && quote !== null && tokenOut && (
        <div className="mt-4 rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 md:p-5">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">exchange output</span>
          <strong className="mt-2 block text-[24px] text-[#edf4ef]">{formatUnits(quote, tokenOut.decimals)} {tokenOut.symbol}</strong>
          <span className="mt-1 block font-mono text-[12px] text-[#8d9b93]">{quote.toString()} {tokenOut.symbol}</span>
        </div>
      )}
    </section>
  );
}