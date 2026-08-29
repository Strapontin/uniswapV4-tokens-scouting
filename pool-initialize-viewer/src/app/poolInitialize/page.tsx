import { getPoolLogs } from "@/lib/logs";
import { PoolListItem } from "@/components/poolInitialize/PoolListItem";

export default async function PoolInitializePage() {
  const logs = await getPoolLogs();

  return (
    <main className="mx-auto w-[min(100%-48px,980px)] py-[92px]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Uniswap v4 / event archive
      </div>

      <div className="mt-6 mb-16 flex items-end justify-between gap-6">
        <div>
          <h1 className="m-0 max-w-[680px] text-[clamp(48px,8vw,92px)] font-semibold leading-[.92] tracking-[-.065em]">
            Pool Initialize
          </h1>
          <p className="mt-6 text-[17px] text-[#8d9b93]">
            Select a token address to inspect its indexed initialization events.
          </p>
        </div>

        <div className="min-w-[110px] border-l border-[#2a3831] pl-5">
          <strong className="block text-[48px] font-medium leading-[.9]">{logs.length}</strong>
          <span className="mt-2 block font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
            token {logs.length === 1 ? "address" : "addresses"}
          </span>
        </div>
      </div>

      <section className="border-t border-[#edf4ef]" aria-label="Pool initialization token addresses">
        {logs.map((log, index) => (
          <PoolListItem key={log.fileName} log={log} index={index} />
        ))}

        {logs.length === 0 && (
          <p className="py-7 text-[#8d9b93]">No pool initialization logs found in the data directory.</p>
        )}
      </section>
    </main>
  );
}
