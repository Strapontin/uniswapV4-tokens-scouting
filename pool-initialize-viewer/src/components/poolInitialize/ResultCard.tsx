import { AddressCopyButton, TokenNameLink } from "@/components/poolInitialize/AddressDisplay";

type ResultCardProps = {
  index: number;
  poolId: string;
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
};

export function ResultCard({ index, poolId, currency0, currency1, poolConfig }: ResultCardProps) {
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
          {poolId}
        </h3>
      </div>

      <div className="grid gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3">
          <h3 className="m-0 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
            currency0
          </h3>
          <TokenNameLink address={currency0.address} name={currency0.name} symbol={currency0.symbol} />
          <AddressCopyButton address={currency0.address} className="w-fit max-w-full" />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3">
          <h3 className="m-0 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
            currency1
          </h3>
          <TokenNameLink address={currency1.address} name={currency1.name} symbol={currency1.symbol} />
          <AddressCopyButton address={currency1.address} className="w-fit max-w-full" />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3">
        <h3 className="mb-3 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
          Pool configuration
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">fee</span>
            <strong className="text-[16px] text-[#edf4ef]">{poolConfig.fee ?? "N/A"}</strong>
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
    </li>
  );
}
