"use client";

import { useState } from "react";
import { createPublicClient, erc20Abi, http, type Address } from "viem";
import { unichain } from "viem/chains";

import tokenMetadata from "../../../data/token_metadata.json";
import { QuoteInputControls } from "@/components/QuoteInputControls";
import { ResultCard } from "@/components/poolInitialize/ResultCard";
import { normalizeAddress } from "@/lib/address";
import type { PoolEntry } from "@/lib/poolInitialize";
import { QUOTER_ABI, QUOTER_ADDRESS, RPC_URL } from "@/lib/uniswap";

const publicClient = createPublicClient({
  chain: unichain,
  transport: http(RPC_URL),
});

type QuoteEntry = {
  poolId: string;
  output: bigint;
  outputToken: string;
  outputDecimals: number;
};

type PoolQuoteControlsProps = {
  pools: PoolEntry[];
  defaultTokenIn: string;
};

async function getTokenDecimals(addresses: string[]) {
  const uniqueAddresses = Array.from(
    new Set(addresses.map((address) => normalizeAddress(address).toLowerCase())),
  );

  if (uniqueAddresses.length === 0) {
    return {} as Record<string, number>;
  }

  const results = await publicClient.multicall({
    contracts: uniqueAddresses.map((address) => ({
      address: address as Address,
      abi: erc20Abi,
      functionName: "decimals",
    })),
    allowFailure: true,
  });

  return Object.fromEntries(
    uniqueAddresses.map((address, index) => [
      address,
      Number(results[index]?.result ?? 18),
    ]),
  );
}

function getMetadataDecimals(address: string): number {
  const normalizedAddress = normalizeAddress(address).toLowerCase();
  const entry = (tokenMetadata as Record<string, { decimals?: number }>)[normalizedAddress];

  return Number(entry?.decimals ?? 18);
}

export function PoolQuoteControls({ pools, defaultTokenIn }: PoolQuoteControlsProps) {
  const tokenOptions = Array.from(
    new Map(
      pools.flatMap(({ currency0, currency1 }) => [currency0, currency1]).map((currency) => [
        normalizeAddress(currency.address).toLowerCase(),
        {
          address: normalizeAddress(currency.address),
          name: currency.name,
          symbol: currency.symbol,
        },
      ]),
    ).values(),
  ).sort((left, right) => {
    const leftIsDefault = normalizeAddress(left.address).toLowerCase() === normalizeAddress(defaultTokenIn).toLowerCase();
    const rightIsDefault = normalizeAddress(right.address).toLowerCase() === normalizeAddress(defaultTokenIn).toLowerCase();

    if (leftIsDefault !== rightIsDefault) {
      return leftIsDefault ? -1 : 1;
    }

    return left.name.localeCompare(right.name) || left.address.localeCompare(right.address);
  });

  const selectableTokens = tokenOptions.slice(0, 2);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(() => {
    const defaultIndex = selectableTokens.findIndex(
      ({ address }) => normalizeAddress(address).toLowerCase() === normalizeAddress(defaultTokenIn).toLowerCase(),
    );

    return defaultIndex >= 0 ? defaultIndex : 0;
  });

  const [amountIn, setAmountIn] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankedPools, setRankedPools] = useState<PoolEntry[]>(pools);
  const [quoteMap, setQuoteMap] = useState<Record<string, QuoteEntry>>({});
  const tokenIn = selectableTokens[selectedTokenIndex]?.address ?? defaultTokenIn;
  const selectedToken = selectableTokens[selectedTokenIndex];

  const handleRunQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const normalizedTokenIn = normalizeAddress(tokenIn);
      if (!normalizedTokenIn) {
        setError("No input token available.");
        return;
      }

      const exactAmount = BigInt(amountIn);
      const outputTokenAddresses = Array.from(
        new Set(
          pools
            .flatMap(({ currency0, currency1 }) => [currency0.address, currency1.address])
            .filter((address) => normalizeAddress(address).toLowerCase() !== normalizedTokenIn.toLowerCase()),
        ),
      );

      const decimalsMap = await getTokenDecimals(outputTokenAddresses);

      const quoteContracts = pools.map((pool) => {
        const currency0 = normalizeAddress(pool.currency0.address);
        const currency1 = normalizeAddress(pool.currency1.address);
        const isZeroForOne = currency0.toLowerCase() === normalizedTokenIn.toLowerCase();

        return {
          address: QUOTER_ADDRESS,
          abi: QUOTER_ABI,
          functionName: "quoteExactInputSingle",
          args: [
            {
              poolKey: {
                currency0,
                currency1,
                fee: Number(pool.poolConfig.fee ?? 0),
                tickSpacing: Number(pool.poolConfig.tickSpacing ?? 0),
                hooks: (pool.poolConfig.hooks ?? "0x0000000000000000000000000000000000000000") as Address,
              },
              zeroForOne: isZeroForOne,
              exactAmount,
              hookData: "0x" as const,
            },
          ],
        };
      });

      const multicallResults = await publicClient.multicall({
        contracts: quoteContracts,
        allowFailure: true,
      });

      const nextQuoteMap: Record<string, QuoteEntry> = {};
      const nextRankedPools = [...pools]
        .map((pool, index) => {
          const currency0 = normalizeAddress(pool.currency0.address);
          const currency1 = normalizeAddress(pool.currency1.address);
          const isZeroForOne = currency0.toLowerCase() === normalizedTokenIn.toLowerCase();
          const outputToken = isZeroForOne ? currency1 : currency0;
          const output = (multicallResults[index]?.status === "success" ? (multicallResults[index].result as bigint | undefined) : undefined) ?? BigInt(0);

          nextQuoteMap[pool.poolId] = {
            poolId: pool.poolId,
            output,
            outputToken,
            outputDecimals: Number(decimalsMap[normalizeAddress(outputToken).toLowerCase()] ?? 18),
          };

          return { ...pool, quoteOutput: output, quoteToken: outputToken };
        })
        .sort((left, right) => {
          const leftOutput = nextQuoteMap[left.poolId]?.output ?? BigInt(0);
          const rightOutput = nextQuoteMap[right.poolId]?.output ?? BigInt(0);
          return rightOutput > leftOutput ? 1 : rightOutput < leftOutput ? -1 : 0;
        });

      setQuoteMap(nextQuoteMap);
      setRankedPools(nextRankedPools);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Failed to run pool quotes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-9" aria-label="Pool initialization results">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-semibold">Results</h2>
      </div>

      <div className="mb-6 rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <QuoteInputControls
            tokens={selectableTokens}
            selectedTokenIndex={selectedTokenIndex}
            onSelectToken={setSelectedTokenIndex}
            amountIn={amountIn}
            onAmountChange={setAmountIn}
            tokenDecimals={getMetadataDecimals(normalizeAddress(tokenIn))}
            decimalSymbol={selectedToken?.symbol}
            onRunQuote={handleRunQuotes}
            loading={loading}
            runLabel="Run quotes"
          />


        </div>

        {error && <p className="mt-3 text-[12px] text-[#f0784b]">{error}</p>}
      </div>

      <ul className="m-0 list-none p-0 space-y-4">
        {rankedPools.map(({ poolId, transactionHash, currency0, currency1, poolConfig }, index) => {
          const quote = quoteMap[poolId];
          const outputTokenAddress = quote?.outputToken ?? null;
          const outputTokenSymbol = outputTokenAddress
            ? normalizeAddress(outputTokenAddress).toLowerCase() === normalizeAddress(currency0.address).toLowerCase()
              ? currency0.symbol
              : currency1.symbol
            : null;
          const outputDecimals = quote?.outputDecimals ?? 18;

          return (
            <ResultCard
              key={`${poolId}-${currency0.address}-${currency1.address}-${index}`}
              index={index}
              poolId={poolId}
              transactionHash={transactionHash}
              tokenInAddress={tokenIn}
              currency0={currency0}
              currency1={currency1}
              poolConfig={poolConfig}
              quoteOutput={quote?.output ?? null}
              quoteTokenAddress={outputTokenAddress}
              quoteTokenSymbol={outputTokenSymbol}
              quoteTokenDecimals={outputDecimals}
            />
          );
        })}

        {rankedPools.length === 0 && (
          <li className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-5 text-[#8d9b93]">
            No valid pool initialization events found for this pair.
          </li>
        )}
      </ul>
    </section>
  );
}
