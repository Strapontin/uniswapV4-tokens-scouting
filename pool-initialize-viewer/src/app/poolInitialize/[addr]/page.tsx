import Link from "next/link";
import { notFound } from "next/navigation";
import { getPoolLog, getPoolLogs } from "@/lib/logs";

export async function generateStaticParams() {
  const logs = await getPoolLogs();
  return logs.map((log) => ({ addr: log.address }));
}

export default async function PoolInitializeDetail({ params }: PageProps<"/poolInitialize/[addr]">) {
  const { addr } = await params;
  const log = await getPoolLog(addr);

  if (!log) notFound();

  return (
    <main className="shell detail-shell">
      <Link className="back-link" href="/poolInitialize">← All token addresses</Link>
      <div className="eyebrow">Pool initialization log</div>
      <h1 className="detail-title">{log.name ?? "Unknown token"}{log.symbol ? ` (${log.symbol})` : ""}</h1>
      <p className="detail-address">{log.address}</p>
      <p className="file-name">{log.fileName}</p>
      <pre className="json-view"><code>{JSON.stringify(log.data, null, 2)}</code></pre>
    </main>
  );
}
