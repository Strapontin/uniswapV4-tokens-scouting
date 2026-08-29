import { promises as fs } from "node:fs";
import path from "node:path";

const logsDirectory = path.join(process.cwd(), "data");
const filePattern = /^pool_initialize_logs_(.+)\.json$/;

export type PoolLog = {
  address: string;
  fileName: string;
  name: string | null;
  symbol: string | null;
  data: unknown;
};

export async function getPoolLogs(): Promise<PoolLog[]> {
  const metadata = JSON.parse(
    await fs.readFile(path.join(logsDirectory, "token_metadata.json"), "utf8"),
  ) as Record<string, { name?: string | null; symbol?: string | null }>;
  const fileNames = (await fs.readdir(logsDirectory))
    .filter((fileName) => filePattern.test(fileName))
    .sort((first, second) => first.localeCompare(second));

  return Promise.all(
    fileNames.map(async (fileName) => {
      const match = fileName.match(filePattern);
      const data = JSON.parse(await fs.readFile(path.join(logsDirectory, fileName), "utf8"));
      const address = match?.[1] ?? fileName;
      const metadataKey = address.toLowerCase().startsWith("0x")
        ? address.toLowerCase()
        : `0x${address.toLowerCase()}`;
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

export async function getPoolLog(address: string) {
  const logs = await getPoolLogs();
  return logs.find((log) => log.address.toLowerCase() === address.toLowerCase());
}
