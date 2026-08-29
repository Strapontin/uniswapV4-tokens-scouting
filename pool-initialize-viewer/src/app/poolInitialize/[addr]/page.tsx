import Link from "next/link";
import { notFound } from "next/navigation";

import { AddressCopyButton } from "@/components/poolInitialize/AddressDisplay";
import { ResultCard } from "@/components/poolInitialize/ResultCard";
import { getPoolLog, getPoolLogs, getTokenMetadataMap, normalizeAddress } from "@/lib/logs";

export async function generateStaticParams() {
  const logs = await getPoolLogs();
  return logs.map((log) => ({ addr: log.address }));
}

export default async function PoolInitializeDetail({ params }: PageProps<"/poolInitialize/[addr]">) {
  const { addr } = await params;
  const log = await getPoolLog(addr);
  const tokenMetadata = await getTokenMetadataMap();

  if (!log) notFound();

  const logData = (log.data as { generated_at?: string; data?: { result?: Array<Record<string, unknown>> } } | undefined) ?? {};
  const generatedAt = logData.generated_at;
  const results = Array.isArray(logData.data?.result) ? logData.data.result : [];

  const tokenTitle = (() => {
    const normalized = normalizeAddress(log.address);
    const tokenMeta = tokenMetadata[normalized.toLowerCase()];
    const name = tokenMeta?.name ?? "Unknown token";
    const symbol = tokenMeta?.symbol ?? "UNK";
    return { name, symbol };
  })();

  const formatTokenDisplay = (rawAddress: string) => {
    const normalized = normalizeAddress(rawAddress);
    const tokenMeta = tokenMetadata[normalized.toLowerCase()];
    const name = tokenMeta?.name ?? "Unknown token";
    const symbol = tokenMeta?.symbol ?? "UNK";
    return {
      name,
      symbol,
      address: normalized,
    };
  };

  const decodePoolConfig = (rawData: string) => {
    if (!rawData || !rawData.startsWith("0x")) {
      return {
        fee: null,
        tickSpacing: null,
        hooks: null,
        hiddenUint160: null,
        hiddenInt24: null,
      };
    }

    const hex = rawData.slice(2);
    const words = hex.match(/.{1,64}/g) ?? [];

    const readUint24 = (word: string) => {
      const value = word.slice(-6).padStart(6, "0");
      return Number(BigInt(`0x${value}`));
    };

    const readInt24 = (word: string) => {
      const value = word.slice(-6).padStart(6, "0");
      return Number(BigInt.asIntN(24, BigInt(`0x${value}`)));
    };

    const readAddress = (word: string) => {
      const value = word.slice(-40).padStart(40, "0");
      return `0x${value}`;
    };

    const readUint160 = (word: string) => {
      const value = word.slice(-40).padStart(40, "0");
      return `0x${value}`;
    };

    return {
      fee: words[0] ? readUint24(words[0]) : null,
      tickSpacing: words[1] ? readInt24(words[1]) : null,
      hooks: words[2] ? readAddress(words[2]) : null,
      hiddenUint160: words[3] ? readUint160(words[3]) : null,
      hiddenInt24: words[4] ? readInt24(words[4]) : null,
    };
  };

  return (
    <main className="mx-auto w-[min(100%-48px,980px)] pt-[54px] pb-12">
      <Link className="mb-[92px] inline-block text-[14px] text-[#8d9b93] no-underline transition-colors hover:text-[#f0784b]" href="/poolInitialize">
        ← All token addresses
      </Link>

      <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Pool initialization log for token:
      </div>

      <h1 className="mt-4 text-[clamp(31px,5vw,64px)] font-semibold tracking-[-.04em]">
        {tokenTitle.name}
        {tokenTitle.symbol ? ` (${tokenTitle.symbol})` : ""}
      </h1>

      <div className="mt-4">
        <AddressCopyButton address={log.address} className="max-w-full justify-start" />
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
        {log.fileName}
      </p>
      {generatedAt && (
        <p className="mt-2 font-mono text-[13px] text-[#8d9b93]">
          Generated at {new Date(generatedAt).toLocaleString()}
        </p>
      )}

      <section className="mt-9" aria-label="Pool initialization results">
        <h2 className="mb-4 text-[20px] font-semibold">Results</h2>
        <ul className="m-0 list-none p-0 space-y-4">
          {results.map((result, index) => {
            const topics = Array.isArray((result as { topics?: string[] }).topics) ? (result as { topics?: string[] }).topics! : [];
            const poolId = topics[1] ?? "N/A";
            const rawData = String((result as { data?: string }).data ?? "0x");
            const currency0 = formatTokenDisplay(String(topics[2] ?? "0x0000000000000000000000000000000000000000"));
            const currency1 = formatTokenDisplay(String(topics[3] ?? "0x0000000000000000000000000000000000000000"));
            const poolConfig = decodePoolConfig(rawData);

            return (
              <ResultCard
                key={`${poolId}-${currency0.address}-${currency1.address}-${index}`}
                index={index}
                poolId={poolId}
                currency0={currency0}
                currency1={currency1}
                poolConfig={poolConfig}
              />
            );
          })}
        </ul>
      </section>
    </main>
  );
}
