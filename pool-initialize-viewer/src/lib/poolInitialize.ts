import { decodeAbiParameters, parseAbiParameters } from "viem";

import { normalizeAddress, type PoolLog, type TokenMetadataRecord } from "@/lib/logs";

export const poolConfigAbi = parseAbiParameters(
  "uint24 fee, int24 tickSpacing, address hooks, uint160 hiddenUint160, int24 hiddenInt24",
);

export type PoolToken = {
  name: string;
  symbol: string;
  address: string;
};

export type PoolConfig = {
  fee: number | null;
  tickSpacing: number | null;
  hooks: string | null;
  hiddenUint160: string | null;
  hiddenInt24: number | null;
};

export type PoolEntry = {
  poolId: string;
  transactionHash: string | null;
  currency0: PoolToken;
  currency1: PoolToken;
  poolConfig: PoolConfig;
};

export function getTokenDisplay(rawAddress: string, tokenMetadata: Record<string, TokenMetadataRecord>): PoolToken {
  const normalized = normalizeAddress(rawAddress);
  const tokenMeta = tokenMetadata[normalized.toLowerCase()];
  const name = tokenMeta?.name ?? "Unknown token";
  const symbol = tokenMeta?.symbol ?? "UNK";

  return {
    name,
    symbol,
    address: normalized,
  };
}

export function decodePoolConfig(rawData: string): PoolConfig {
  if (!rawData || !rawData.startsWith("0x")) {
    return {
      fee: null,
      tickSpacing: null,
      hooks: null,
      hiddenUint160: null,
      hiddenInt24: null,
    };
  }

  try {
    const [fee, tickSpacing, hooks, hiddenUint160, hiddenInt24] = decodeAbiParameters(
      poolConfigAbi,
      rawData as `0x${string}`,
    );

    return {
      fee: fee !== undefined ? Number(fee) : null,
      tickSpacing: tickSpacing !== undefined ? Number(tickSpacing) : null,
      hooks: hooks !== undefined ? hooks : null,
      hiddenUint160: hiddenUint160 !== undefined ? hiddenUint160.toString() : null,
      hiddenInt24: hiddenInt24 !== undefined ? Number(hiddenInt24) : null,
    };
  } catch (error) {
    console.warn("Failed to decode pool config data:", error);
    return {
      fee: null,
      tickSpacing: null,
      hooks: null,
      hiddenUint160: null,
      hiddenInt24: null,
    };
  }
}

export function getOppositeCurrencyAddress(
  baseTokenAddress: string,
  currency0Address: string,
  currency1Address: string,
): string | null {
  const normalizedBase = normalizeAddress(baseTokenAddress).toLowerCase();
  const currency0 = normalizeAddress(currency0Address).toLowerCase();
  const currency1 = normalizeAddress(currency1Address).toLowerCase();

  if (currency0 !== normalizedBase && currency1 !== normalizedBase) {
    return currency0 === currency1 ? currency0 : null;
  }

  if (currency0 === normalizedBase) {
    return currency1;
  }

  if (currency1 === normalizedBase) {
    return currency0;
  }

  return null;
}

export function getPoolEntriesForLog(log: PoolLog, tokenMetadata: Record<string, TokenMetadataRecord>): PoolEntry[] {
  const logData = (log.data as { generated_at?: string; data?: { result?: Array<Record<string, unknown>> } } | undefined) ?? {};
  const results = Array.isArray(logData.data?.result) ? logData.data.result : [];

  return results
    .map((result, index) => {
      const topics = Array.isArray((result as { topics?: string[] }).topics)
        ? (result as { topics?: string[] }).topics!
        : [];
      const poolId = topics[1] ?? `N/A-${index}`;
      const transactionHash = String((result as { transactionHash?: string }).transactionHash ?? "") || null;
      const rawData = String((result as { data?: string }).data ?? "0x");
      const currency0 = getTokenDisplay(String(topics[2] ?? "0x0000000000000000000000000000000000000000"), tokenMetadata);
      const currency1 = getTokenDisplay(String(topics[3] ?? "0x0000000000000000000000000000000000000000"), tokenMetadata);
      const poolConfig = decodePoolConfig(rawData);

      return {
        poolId,
        transactionHash,
        currency0,
        currency1,
        poolConfig,
      };
    })
    .filter(({ poolConfig }) => (poolConfig.tickSpacing ?? Number.NEGATIVE_INFINITY) <= 200);
}

export function buildGroupedTradeTokens(baseTokenAddress: string, poolEntries: PoolEntry[]) {
  const groups = new Map<string, { token: PoolToken; poolCount: number }>();

  for (const poolEntry of poolEntries) {
    const oppositeAddress = getOppositeCurrencyAddress(
      baseTokenAddress,
      poolEntry.currency0.address,
      poolEntry.currency1.address,
    );

    if (!oppositeAddress) {
      continue;
    }

    const tradeToken =
      normalizeAddress(poolEntry.currency0.address).toLowerCase() === normalizeAddress(oppositeAddress).toLowerCase()
        ? poolEntry.currency0
        : poolEntry.currency1;
    const key = normalizeAddress(tradeToken.address).toLowerCase();

    if (!groups.has(key)) {
      groups.set(key, { token: tradeToken, poolCount: 0 });
    }

    groups.get(key)!.poolCount += 1;
  }

  return Array.from(groups.values()).sort(
    (left, right) =>
      right.poolCount - left.poolCount ||
      left.token.name.localeCompare(right.token.name) ||
      left.token.address.localeCompare(right.token.address),
  );
}
