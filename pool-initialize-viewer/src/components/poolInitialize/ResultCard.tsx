import { AddressCopyButton } from "@/components/poolInitialize/AddressDisplay";
import Link from "next/link";

type ResultCardProps = {
  index: number;
  poolId: string;
  transactionHash: string | null;
  tokenInAddress?: string;
  currency0: {
    name: string;
    symbol: string;
    address: string;
  };
  currency1: {
    name: string;
    symbol: string;
    address: string;
  };
  poolConfig: {
    fee: number | null;
    tickSpacing: number | null;
    hooks: string | null;
    hiddenUint160: string | null;
    hiddenInt24: number | null;
  };
  quoteOutput?: bigint | null;
  quoteTokenAddress?: string | null;
  quoteTokenSymbol?: string | null;
  quoteTokenDecimals?: number;
};

export function ResultCard({
  index,
  poolId,
  transactionHash,
  poolConfig,
  quoteOutput,
  quoteTokenAddress,
  quoteTokenSymbol,
  quoteTokenDecimals = 18,
}: ResultCardProps) {
  const feePercentage = poolConfig.fee === null ? "N/A" : `${(poolConfig.fee / 1_000_000) * 100}%`;
  const quoteOutputFormatted = quoteOutput === null || quoteOutput === undefined ? "—" : `${Number(quoteOutput) / 10 ** quoteTokenDecimals}`;

  return (
    <li className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[12px] uppercase tracking-[.08em] text-[#f0784b]">
          #{index + 1}
        </span>
        <h3 className="m-0 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
          Pool ID
        </h3>
        <h3 className="m-0 font-mono text-[clamp(18px,2vw,22px)] text-[#edf4ef]">
          {transactionHash ? (
            <Link
              href={`https://uniscan.xyz/tx/${transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#edf4ef] no-underline transition-colors hover:text-[#f0784b]"
            >
              {poolId}
            </Link>
          ) : (
            poolId
          )}
        </h3>
      </div>

      <div className="mt-3 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3">
        <h3 className="mb-3 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
          Pool configuration
        </h3>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.3fr]">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">fee</span>
            <strong className="text-[16px] text-[#edf4ef]">{feePercentage}</strong>
            <span className="text-[12px] text-[#8d9b93]">{poolConfig.fee ?? "N/A"}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">tickSpacing</span>
            <strong className="text-[16px] text-[#edf4ef]">{poolConfig.tickSpacing ?? "N/A"}</strong>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">hooks</span>
            {poolConfig.hooks ? <AddressCopyButton address={poolConfig.hooks} className="w-fit max-w-full" /> : <span className="text-[16px] text-[#edf4ef]">N/A</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">Best quote output</span>
            <strong className="text-[16px] text-[#edf4ef]">
              {quoteOutputFormatted}{quoteTokenSymbol ? ` ${quoteTokenSymbol}` : ""}
            </strong>
            <span className="text-[12px] text-[#8d9b93]">
              {quoteOutput === null || quoteOutput === undefined ? "—" : quoteOutput.toString()}{quoteTokenSymbol ? ` ${quoteTokenSymbol}` : ""}
            </span>
          </div>

          {quoteTokenAddress && (
            <div className="ml-auto max-w-[220px]">
              <AddressCopyButton address={quoteTokenAddress} className="w-fit max-w-full" />
            </div>
          )}
        </div>
      </div>

    </li>
  );
}
