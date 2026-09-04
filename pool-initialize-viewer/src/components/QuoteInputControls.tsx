"use client";

import { useState } from "react";
import { formatUnits } from "viem";

type QuoteToken = {
  address: string;
  name: string;
  symbol: string;
};

type QuoteInputControlsProps = {
  tokens: QuoteToken[];
  selectedTokenIndex: number;
  onSelectToken: (index: number) => void;
  amountIn: string;
  onAmountChange: (value: string) => void;
  decimalSymbol?: string;
  tokenDecimals: number;
  onRunQuote: () => void;
  loading: boolean;
  runLabel?: string;
  loadingLabel?: string;
  disabled?: boolean;
};

export function QuoteInputControls({
  tokens,
  selectedTokenIndex,
  onSelectToken,
  amountIn,
  onAmountChange,
  decimalSymbol = "",
  tokenDecimals,
  onRunQuote,
  loading,
  runLabel = "Run quote",
  loadingLabel = "Quoting...",
  disabled = false,
}: QuoteInputControlsProps) {
  const [conversionError, setConversionError] = useState<string | null>(null);
  const decimalValue = (() => {
    try {
      return formatUnits(BigInt(amountIn || "0"), tokenDecimals);
    } catch {
      return "0";
    }
  })();

  const convertAmount = () => {
    try {
      const trimmed = amountIn.trim();
      if (trimmed === "") {
        throw new Error("Amount is required.");
      }

      const negative = trimmed.startsWith("-");
      const absolute = negative ? trimmed.slice(1) : trimmed;
      const [integerPart, fractionalPart = ""] = absolute.split(".");
      if (!/^\d+$/.test(integerPart)) {
        throw new Error("Invalid decimal number.");
      }

      const safeFractionalPart = fractionalPart.replace(/[^0-9]/g, "").slice(0, tokenDecimals);
      const normalized = `${integerPart}${safeFractionalPart.padEnd(tokenDecimals, "0")}`;
      const baseUnits = BigInt(normalized);
      onAmountChange((negative ? -baseUnits : baseUnits).toString());
      setConversionError(null);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : "Failed to convert amount.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">tokenIn</span>

        <div className="w-fit rounded-md border border-[#2a3831] bg-[#0d1412] p-1">
          <div className="flex items-stretch gap-1">
            {tokens.map((token, index) => {
              const isSelected = selectedTokenIndex === index;

              return (
                <button
                  key={`${token.address}-${index}`}
                  type="button"
                  onClick={() => onSelectToken(index)}
                  className={[
                    "min-w-[120px] rounded-sm border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-[#f0784b] bg-[#f0784b]/10 text-[#edf4ef]"
                      : "border-transparent bg-transparent text-[#8d9b93] hover:border-[#2a3831] hover:text-[#edf4ef]",
                  ].join(" ")}
                >
                  <div className="text-[12px] font-semibold leading-tight">{token.name}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-[#8d9b93]">
                    {token.symbol}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#8d9b93]">amountIn (base units)</span>
        <input
          value={amountIn}
          onChange={(event) => onAmountChange(event.target.value)}
          className="w-full rounded-md border border-[#2a3831] bg-[#0d1412] px-3 py-2 font-mono text-[12px] text-[#edf4ef] outline-none transition focus:border-[#f0784b]"
          placeholder="1000000000000000000"
        />
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-[#8d9b93]">
          Decimal value: <span className="text-[#edf4ef]">{decimalValue}</span> {decimalSymbol}
        </span>
      </label>

      <button
        type="button"
        onClick={convertAmount}
        className="inline-flex h-[42px] items-center justify-center rounded-md border border-[#2a3831] bg-[#0d1412] px-3 py-2 font-mono text-[11px] uppercase tracking-[.08em] text-[#edf4ef] transition hover:border-[#f0784b] hover:text-[#f0784b]"
      >
        Convert
      </button>

      <button
        type="button"
        onClick={onRunQuote}
        disabled={loading || disabled}
        className="inline-flex h-[42px] items-center justify-center rounded-md border border-[#f0784b] bg-[#f0784b]/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[.08em] text-[#edf4ef] transition hover:bg-[#f0784b] hover:text-[#0a120f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? loadingLabel : runLabel}
      </button>

      {conversionError && <p className="basis-full text-[12px] text-[#f0784b]">{conversionError}</p>}
    </>
  );
}
