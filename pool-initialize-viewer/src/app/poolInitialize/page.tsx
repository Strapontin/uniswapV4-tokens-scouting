import Link from "next/link";
import { getPoolLogs } from "@/lib/logs";

export default async function PoolInitializePage() {
  const logs = await getPoolLogs();

  return (
    <main className="shell">
      <div className="eyebrow">Uniswap v4 / event archive</div>
      <div className="heading-row">
        <div>
          <h1>Pool Initialize</h1>
          <p className="lede">Select a token address to inspect its indexed initialization events.</p>
        </div>
        <div className="count"><strong>{logs.length}</strong><span>token {logs.length === 1 ? "address" : "addresses"}</span></div>
      </div>

      <section className="log-list" aria-label="Pool initialization token addresses">
        {logs.map((log, index) => (
          <Link className="log-row" href={`/poolInitialize/${log.address}`} key={log.fileName}>
            <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="token-label">
              <strong>{log.name ?? "Unknown token"}{log.symbol ? ` (${log.symbol})` : ""}</strong>
              <span className="address">{log.address}</span>
            </span>
            <span className="row-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
        {logs.length === 0 && <p className="empty-state">No pool initialization logs found in the data directory.</p>}
      </section>
    </main>
  );
}
