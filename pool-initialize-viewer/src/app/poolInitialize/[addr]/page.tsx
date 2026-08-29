import Link from "next/link";
import { notFound } from "next/navigation";

import { AddressCopyButton, AddressDisplay } from "@/components/poolInitialize/AddressDisplay";
import { getPoolLog, getPoolLogs, getTokenMetadataMap, normalizeAddress } from "@/lib/logs";
import { buildGroupedTradeTokens, getPoolEntriesForLog, getTokenDisplay } from "@/lib/poolInitialize";

export async function generateStaticParams() {
  const logs = await getPoolLogs();
  return logs.map((log) => ({ addr: log.address }));
}

export default async function PoolInitializeDetail({ params }: PageProps<"/poolInitialize/[addr]">) {
  const { addr } = await params;
  const log = await getPoolLog(addr);

  if (!log) notFound();

  const tokenMetadata = await getTokenMetadataMap();
  const tokenTitle = getTokenDisplay(log.address, tokenMetadata);
  const logData = (log.data as { generated_at?: string } | undefined) ?? {};
  const generatedAt = logData.generated_at;
  const groupedTokens = buildGroupedTradeTokens(log.address, getPoolEntriesForLog(log, tokenMetadata));

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

      <section className="mt-9" aria-label="Tradeable token results">
        <h2 className="mb-4 text-[20px] font-semibold">Tradeable tokens</h2>
        <ul className="m-0 list-none p-0 space-y-4">
          {groupedTokens.map(({ token, poolCount }, index) => (
            <li key={token.address} className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] uppercase tracking-[.08em] text-[#f0784b]">
                    #{index + 1}
                  </div>

                  <div className="mt-2 text-[clamp(22px,3vw,32px)] font-semibold text-[#edf4ef]">
                    {token.name} ({token.symbol})
                  </div>

                  <AddressDisplay address={token.address} className="mt-2 max-w-full md:max-w-[420px]" />
                </div>

                <div className="flex items-center gap-4 md:justify-end">
                  <div className="rounded-xl border border-[#2a3831] bg-[#0d1412] px-4 py-3 text-center">
                    <div className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">Pools</div>
                    <div className="mt-2 text-[28px] font-semibold text-[#edf4ef]">{poolCount}</div>
                  </div>

                  <Link
                    href={`/poolInitialize/${normalizeAddress(log.address)}/${normalizeAddress(token.address)}`}
                    className="inline-flex items-center justify-center rounded-md border border-[#f0784b] bg-[#f0784b]/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[.08em] text-[#edf4ef] no-underline transition-colors hover:bg-[#f0784b] hover:text-[#0a120f]"
                  >
                    View pools
                  </Link>
                </div>
              </div>
            </li>
          ))}

          {groupedTokens.length === 0 && (
            <li className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-5 text-[#8d9b93]">
              No tradeable tokens found for this token after filtering out tickSpacing &gt; 200.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
