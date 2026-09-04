import Link from "next/link";
import { notFound } from "next/navigation";

import { AddressCopyButton, AddressDisplay } from "@/components/poolInitialize/AddressDisplay";
import { PoolQuoteControls } from "@/components/poolInitialize/PoolQuoteControls";
import { getPoolLog, getPoolLogs, getTokenMetadataMap, normalizeAddress } from "@/lib/logs";
import { buildGroupedTradeTokens, getPoolEntriesForLog, getTokenDisplay } from "@/lib/poolInitialize";

export async function generateStaticParams() {
  const logs = await getPoolLogs();
  const params: Array<{ addr: string; token: string }> = [];

  for (const log of logs) {
    const groupedTokens = buildGroupedTradeTokens(log.address, getPoolEntriesForLog(log, await getTokenMetadataMap()));
    params.push(...groupedTokens.map(({ token }) => ({ addr: normalizeAddress(log.address), token: normalizeAddress(token.address) })));
  }

  return params;
}

export default async function PoolInitializeTokenDetail({
  params,
}: PageProps<"/poolInitialize/[addr]/[token]">) {
  const { addr, token } = await params;
  const log = await getPoolLog(addr);

  if (!log) notFound();

  const tokenMetadata = await getTokenMetadataMap();
  const baseToken = getTokenDisplay(log.address, tokenMetadata);
  const selectedToken = getTokenDisplay(token, tokenMetadata);
  const normalizedBaseAddress = normalizeAddress(log.address).toLowerCase();
  const normalizedSelectedAddress = normalizeAddress(selectedToken.address).toLowerCase();

  const validPools = getPoolEntriesForLog(log, tokenMetadata).filter(({ currency0, currency1 }) => {
    const first = normalizeAddress(currency0.address).toLowerCase();
    const second = normalizeAddress(currency1.address).toLowerCase();

    return (
      (first === normalizedSelectedAddress && second === normalizedBaseAddress) ||
      (first === normalizedBaseAddress && second === normalizedSelectedAddress)
    );
  });

  return (
    <main className="mx-auto w-[min(100%-48px,980px)] pt-[54px] pb-12">
      <Link className="mb-[92px] inline-block text-[14px] text-[#8d9b93] no-underline transition-colors hover:text-[#f0784b]" href={`/poolInitialize/${normalizeAddress(log.address)}`}>
        ← Back to {baseToken.name} ({baseToken.symbol})
      </Link>

      <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Pool initialization log for token:
      </div>

      <h1 className="mt-4 text-[clamp(31px,5vw,64px)] font-semibold tracking-[-.04em]">
        {baseToken.name} ({baseToken.symbol})
      </h1>

      <div className="mt-4">
        <AddressCopyButton address={log.address} className="max-w-full justify-start" />
      </div>

      <div className="mt-8 rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">Trading against</div>
            <div className="mt-2 text-[28px] font-semibold text-[#edf4ef]">
              {selectedToken.name} ({selectedToken.symbol})
            </div>
            <AddressDisplay address={selectedToken.address} className="mt-2 max-w-full md:max-w-[420px]" />
          </div>

          <div className="rounded-xl border border-[#2a3831] bg-[#0d1412] px-4 py-3 text-right">
            <div className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">Valid pools</div>
            <div className="mt-2 text-[32px] font-semibold text-[#edf4ef]">{validPools.length}</div>
          </div>
        </div>
      </div>

      <PoolQuoteControls pools={validPools} defaultTokenIn={normalizeAddress(log.address)} />
    </main>
  );
}
