import Link from "next/link";

import type { PoolLog } from "@/lib/logs";

type PoolListItemProps = {
  log: PoolLog;
  index: number;
};

export function PoolListItem({ log, index }: PoolListItemProps) {
  return (
    <Link
      href={`/poolInitialize/${log.address}`}
      className="group grid min-h-[88px] grid-cols-[60px_1fr_32px] items-center border-b border-[#2a3831] text-inherit no-underline transition-all duration-200 hover:bg-[#17221d] hover:px-4"
      key={log.fileName}
    >
      <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#f0784b]">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="min-w-0">
        <strong className="block text-[18px] font-semibold text-[#edf4ef]">
          {log.name ?? "Unknown token"}
          {log.symbol ? ` (${log.symbol})` : ""}
        </strong>
        <span className="mt-1.5 block overflow-wrap-anywhere font-mono text-[12px] text-[#8d9b93]">
          {log.address}
        </span>
      </span>

      <span className="text-right text-[22px]" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
