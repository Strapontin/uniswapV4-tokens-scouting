import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, erc20Abi, http, type Address } from "viem";
import { unichain } from "viem/chains";

const rpcUrl = process.env.RPC_URL ?? unichain.rpcUrls.default.http[0];

const client = createPublicClient({
  chain: unichain,
  transport: http(rpcUrl),
});

const DEFAULT_CHAIN_ID = "130";
const DATA_DIR = "./pool-initialize-viewer/data";
const OUTPUT_FILE = join(DATA_DIR, "token_metadata.json");

function getChainDataDir(chainId: string = DEFAULT_CHAIN_ID) {
  return join(DATA_DIR, chainId);
}

type TokenMetadata = {
  address: Address;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  fetchedAt: string;
};

type TokenMetadataMap = Record<string, TokenMetadata>;

function normalizeAddress(value: unknown): Address | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;

  const candidate = cleaned.startsWith("0x") ? cleaned : `0x${cleaned}`;
  const normalized = candidate.toLowerCase();

  if (normalized.length === 66) {
    return `0x${normalized.slice(-40)}` as Address;
  }

  if (normalized.length === 42) {
    return normalized as Address;
  }

  return null;
}

function readExistingMetadata(): TokenMetadataMap {
  if (!existsSync(OUTPUT_FILE)) {
    return {};
  }

  try {
    const raw = readFileSync(OUTPUT_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, TokenMetadata> | TokenMetadata[];

    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map((item) => [item.address.toLowerCase(), item]));
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([address, value]) => [address.toLowerCase(), value]),
    );
  } catch {
    return {};
  }
}

function collectAddressesFromData(chainId: string = DEFAULT_CHAIN_ID): Address[] {
  const chainDataDir = getChainDataDir(chainId);

  if (!existsSync(chainDataDir)) {
    console.log(`Data directory not found: ${chainDataDir}`);
    return [];
  }

  const files = readdirSync(chainDataDir).filter((file) => file.endsWith(".json"));
  const addresses = new Set<string>();

  for (const file of files) {
    if (file === "token_metadata.json") continue;

    const filePath = join(chainDataDir, file);
    const raw = readFileSync(filePath, "utf8");

    try {
      const parsed = JSON.parse(raw) as {
        data?: { result?: Array<{ topics?: string[] }> };
        result?: Array<{ topics?: string[] }>;
      };

      const resultList = parsed.data?.result ?? parsed.result ?? [];

      for (const entry of resultList) {
        const topics = entry?.topics ?? [];
        const candidates = [topics[2], topics[3]];

        for (const topic of candidates) {
          const normalized = normalizeAddress(topic);
          if (normalized) {
            addresses.add(normalized);
          }
        }
      }
    } catch {
      console.warn(`Skipping unreadable file: ${file}`);
    }
  }

  return [...addresses].sort() as Address[];
}

async function fetchTokenMetadata(addresses: Address[]) {
  const existing = readExistingMetadata();
  const missing = addresses.filter((address) => !(address.toLowerCase() in existing));

  if (missing.length === 0) {
    return existing;
  }

  const calls = missing.flatMap((address) => [
    { address, abi: erc20Abi, functionName: "name" },
    { address, abi: erc20Abi, functionName: "symbol" },
    { address, abi: erc20Abi, functionName: "decimals" },
  ]);

  const results = await client.multicall({
    contracts: calls,
    allowFailure: true,
  });

  const fetched: TokenMetadataMap = {};

  for (let index = 0; index < missing.length; index += 1) {
    const address = missing[index];
    const baseIndex = index * 3;
    const name = results[baseIndex]?.result as string | undefined;
    const symbol = results[baseIndex + 1]?.result as string | undefined;
    const decimals = results[baseIndex + 2]?.result as number | undefined;

    fetched[address.toLowerCase()] = {
      address,
      name: name ?? null,
      symbol: symbol ?? null,
      decimals: decimals ?? null,
      fetchedAt: new Date().toISOString(),
    };
  }

  const merged = {
    ...existing,
    ...fetched,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2), "utf8");

  return merged;
}

async function main() {
  const addresses = collectAddressesFromData(DEFAULT_CHAIN_ID);
  const existing = readExistingMetadata();
  const missing = addresses.filter((address) => !(address.toLowerCase() in existing));

  console.log(`Source data directory: ${getChainDataDir(DEFAULT_CHAIN_ID)}`);
  console.log(`Token addresses found: ${addresses.length}`);
  console.log(`Metadata entries already cached: ${Object.keys(existing).length}`);
  console.log(`Token addresses missing metadata: ${missing.length}`);

  if (missing.length === 0) {
    console.log(`No new token metadata to fetch. Metadata file: ${OUTPUT_FILE}`);
    return;
  }

  const finalMetadata = await fetchTokenMetadata(addresses);
  console.log(`Saved ${Object.keys(finalMetadata).length} token metadata entries to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Failed to sync token metadata:", error);
  process.exit(1);
});
