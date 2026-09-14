import { AddressCopyButton } from "@/components/poolInitialize/AddressDisplay";

type PoolConfigurationProps = {
  fee: number | null;
  tickSpacing: number | null;
  hooks: string | null;
};

export function PoolConfiguration({
  fee,
  tickSpacing,
  hooks,
}: PoolConfigurationProps) {
  const feePercentage = fee === null ? "N/A" : `${(fee / 1_000_000) * 100}%`;

  return (
    <div className="mt-3 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3">
      <h3 className="mb-3 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
        Pool configuration
      </h3>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.3fr]">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
            fee
          </span>
          <strong className="text-[16px] text-[#edf4ef]">
            {feePercentage}
          </strong>
          <span className="text-[12px] text-[#8d9b93]">{fee ?? "N/A"}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
            tickSpacing
          </span>
          <strong className="text-[16px] text-[#edf4ef]">
            {tickSpacing ?? "N/A"}
          </strong>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">
            hooks
          </span>
          {hooks ? (
            <AddressCopyButton address={hooks} className="w-fit max-w-full" />
          ) : (
            <span className="text-[16px] text-[#edf4ef]">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
}
