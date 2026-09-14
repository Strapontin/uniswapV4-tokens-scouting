import { promises as fs } from "node:fs";
import path from "node:path";
import { GraphQLClient, gql } from "graphql-request";
import {
  createPublicClient,
  decodeAbiParameters,
  erc20Abi,
  getAddress,
  http,
  parseAbiParameters,
  parseAbiItem,
  type Address,
} from "viem";
import { unichain } from "viem/chains";

import { getTokenMetadataMap, normalizeAddress } from "@/lib/logs";
import { RPC_URL } from "@/lib/uniswap";

const dataDirectory = path.join(process.cwd(), "data", "130");
const poolManager = "0x1f98400000000000000000000000000000000004" as Address;
const initializeEvent = parseAbiItem(
  "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)",
);
const initializeDataAbi = parseAbiParameters(
  "uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick",
);
const subgraphEndpoint =
  "https://gateway.thegraph.com/api/subgraphs/id/EoCvJ5tyMLMJcTnLQwWpjAtPdn74PcrZgzfcT5bYxNBH";
const poolPriceHistoryQuery = gql`
  query PoolPriceHistory($poolId: String!, $since: Int!) {
    poolHourDatas(
      where: { pool: $poolId, periodStartUnix_gte: $since }
      orderBy: periodStartUnix
      orderDirection: asc
    ) {
      periodStartUnix
      token0Price
      token1Price
      open
      high
      low
      close
    }
  }
`;

export type TwapPool = {
  poolId: string;
  chainId: string;
  pair: {
    currency0: { address: string; name: string; symbol: string };
    currency1: { address: string; name: string; symbol: string };
  };
  fee: number;
  tickSpacing: number;
  hook: string;
  transactionHash: string | null;
  fetchedAt: string;
};

export type TwapPricePoint = {
  time: number;
  token0Value: number;
  token1Value: number;
};

type PoolPriceHistoryResponse = {
  poolHourDatas: Array<{
    periodStartUnix: number;
    token0Price: string;
    token1Price: string;
  }>;
};

function poolFile(poolId: string) {
  return path.join(
    dataDirectory,
    `twap_pool_${poolId.slice(2).toLowerCase()}.json`,
  );
}

export function isPoolId(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

export async function getSavedTwapPools(): Promise<TwapPool[]> {
  let files: string[];
  try {
    files = (await fs.readdir(dataDirectory)).filter((file) =>
      /^twap_pool_[0-9a-f]{64}\.json$/i.test(file),
    );
  } catch {
    return [];
  }

  return Promise.all(
    files
      .sort()
      .map(
        async (file) =>
          JSON.parse(
            await fs.readFile(path.join(dataDirectory, file), "utf8"),
          ) as TwapPool,
      ),
  );
}

export async function getTwapPool(poolId: string): Promise<TwapPool | null> {
  try {
    return JSON.parse(await fs.readFile(poolFile(poolId), "utf8")) as TwapPool;
  } catch {
    return null;
  }
}

export async function getTwapPriceHistory(
  poolId: string,
  hours = 24 * 7,
): Promise<TwapPricePoint[]> {
  const apiKey = process.env.GRAPH_API_KEY;
  if (!apiKey) {
    throw new Error("GRAPH_API_KEY is required to load price history.");
  }

  const client = new GraphQLClient(subgraphEndpoint, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const result = await client.request<PoolPriceHistoryResponse>(
    poolPriceHistoryQuery,
    {
      poolId: poolId.toLowerCase(),
      since: Math.floor(Date.now() / 1000) - hours * 60 * 60,
    },
  );

  return result.poolHourDatas.flatMap((hour) => {
    const token0Value = Number(hour.token0Price);
    const token1Value = Number(hour.token1Price);
    return Number.isFinite(token0Value) && Number.isFinite(token1Value)
      ? [{ time: hour.periodStartUnix, token0Value, token1Value }]
      : [];
  });
}

async function getCachedInitialize(poolId: string) {
  let files: string[];
  try {
    files = (await fs.readdir(dataDirectory)).filter(
      (file) =>
        file.startsWith("pool_initialize_logs_") && file.endsWith(".json"),
    );
  } catch {
    return null;
  }

  for (const file of files) {
    const archive = JSON.parse(
      await fs.readFile(path.join(dataDirectory, file), "utf8"),
    ) as {
      data?: {
        result?: Array<{
          topics?: string[];
          data?: string;
          transactionHash?: string;
        }>;
      };
    };
    const result = archive.data?.result?.find(
      (entry) => entry.topics?.[1]?.toLowerCase() === poolId,
    );
    if (!result?.topics || !result.data) continue;

    const [fee, tickSpacing, hooks] = decodeAbiParameters(
      initializeDataAbi,
      result.data as `0x${string}`,
    );
    return {
      currency0: normalizeAddress(result.topics[2] ?? ""),
      currency1: normalizeAddress(result.topics[3] ?? ""),
      fee,
      tickSpacing,
      hooks,
      transactionHash: result.transactionHash ?? null,
    };
  }

  return null;
}

export async function fetchAndSaveTwapPool(
  rawPoolId: string,
): Promise<TwapPool> {
  const poolId = rawPoolId.trim().toLowerCase() as `0x${string}`;
  const cached = await getTwapPool(poolId);
  if (cached) return cached;

  const client = createPublicClient({
    chain: unichain,
    transport: http(RPC_URL),
  });
  const logs = await client.getLogs({
    address: poolManager,
    event: initializeEvent,
    args: { id: poolId },
  });
  const log = logs[0];
  const cachedInitialize = log ? null : await getCachedInitialize(poolId);
  if (
    (!log && !cachedInitialize) ||
    (!cachedInitialize &&
      (!log?.args.currency0 ||
        !log.args.currency1 ||
        log.args.fee === undefined ||
        log.args.tickSpacing === undefined ||
        !log.args.hooks))
  ) {
    throw new Error(
      "No initialized pool was found for this poolId on Unichain.",
    );
  }

  const tokenMetadata = await getTokenMetadataMap();
  const addresses = [
    getAddress(log?.args.currency0 ?? cachedInitialize!.currency0),
    getAddress(log?.args.currency1 ?? cachedInitialize!.currency1),
  ];
  const tokenResults = await client.multicall({
    contracts: addresses.flatMap((address) => [
      { address, abi: erc20Abi, functionName: "name" },
      { address, abi: erc20Abi, functionName: "symbol" },
    ]),
    allowFailure: true,
  });
  const pair = addresses.map((address, index) => ({
    address: normalizeAddress(address),
    name: String(
      tokenResults[index * 2]?.result ??
        tokenMetadata[address.toLowerCase()]?.name ??
        "Unknown token",
    ),
    symbol: String(
      tokenResults[index * 2 + 1]?.result ??
        tokenMetadata[address.toLowerCase()]?.symbol ??
        "UNK",
    ),
  })) as [TwapPool["pair"]["currency0"], TwapPool["pair"]["currency1"]];

  const pool: TwapPool = {
    poolId,
    chainId: "130",
    pair: { currency0: pair[0], currency1: pair[1] },
    fee: Number(log?.args.fee ?? cachedInitialize!.fee),
    tickSpacing: Number(log?.args.tickSpacing ?? cachedInitialize!.tickSpacing),
    hook: getAddress(log?.args.hooks ?? cachedInitialize!.hooks),
    transactionHash: log?.transactionHash ?? cachedInitialize!.transactionHash,
    fetchedAt: new Date().toISOString(),
  };

  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(poolFile(poolId), JSON.stringify(pool, null, 2), "utf8");
  return pool;
}
