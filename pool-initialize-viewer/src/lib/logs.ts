import { promises as fs } from "node:fs";
import path from "node:path";

const defaultChainId = "130";
const dataDirectory = path.join(process.cwd(), "data");
const filePattern = /^pool_initialize_logs_(.+)\.json$/;

function getLogsDirectory(chainId: string = defaultChainId) {
  const chainDirectory = path.join(dataDirectory, chainId);
  return chainDirectory;
}

export type PoolLog = {
  address: string;
  fileName: string;
  name: string | null;
  symbol: string | null;
  data: unknown;
};

export type TokenMetadataRecord = {
  name?: string | null;
  symbol?: string | null;
  address?: string;
};

export function normalizeAddress(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  const hex = lower.startsWith("0x") ? lower.slice(2) : lower;

  if (!/^[0-9a-f]+$/.test(hex)) {
    return trimmed;
  }

  const compact = hex.length > 40 ? hex.slice(-40) : hex;
  return `0x${compact}`;
}

export async function getTokenMetadataMap(): Promise<Record<string, TokenMetadataRecord>> {
  const metadata = JSON.parse(
    await fs.readFile(path.join(dataDirectory, "token_metadata.json"), "utf8"),
  ) as Record<string, TokenMetadataRecord>;

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [normalizeAddress(key).toLowerCase(), value]),
  );
}

export async function getPoolLogs(chainId: string = defaultChainId): Promise<PoolLog[]> {
  const metadata = await getTokenMetadataMap();
  const preferredDirectory = getLogsDirectory(chainId);
  const fallbackDirectory = dataDirectory;
  const logsDirectory = await fs
    .stat(preferredDirectory)
    .then(() => preferredDirectory)
    .catch(() => fallbackDirectory);

  const fileNames = (await fs.readdir(logsDirectory))
    .filter((fileName) => filePattern.test(fileName))
    .sort((first, second) => first.localeCompare(second));

  return Promise.all(
    fileNames.map(async (fileName) => {
      const match = fileName.match(filePattern);
      const data = JSON.parse(await fs.readFile(path.join(logsDirectory, fileName), "utf8"));
      const address = normalizeAddress(match?.[1] ?? fileName);
      const metadataKey = address.toLowerCase();
      const tokenMetadata = metadata[metadataKey];

      return {
        address,
        fileName,
        name: tokenMetadata?.name ?? null,
        symbol: tokenMetadata?.symbol ?? null,
        data,
      };
    }),
  );
}

export async function getPoolLog(address: string, chainId: string = defaultChainId) {
  const normalizedAddress = normalizeAddress(address);
  const logs = await getPoolLogs(chainId);
  return logs.find((log) => normalizeAddress(log.address).toLowerCase() === normalizedAddress.toLowerCase());
}
