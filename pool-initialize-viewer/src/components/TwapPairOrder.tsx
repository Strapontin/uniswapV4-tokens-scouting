"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type PairOrderContextValue = {
  isReversed: boolean;
  toggleOrder: () => void;
};

const PairOrderContext = createContext<PairOrderContextValue | null>(null);

export function TwapPairOrderProvider({ children }: { children: ReactNode }) {
  const [isReversed, setIsReversed] = useState(false);

  return (
    <PairOrderContext.Provider
      value={{
        isReversed,
        toggleOrder: () => setIsReversed((reversed) => !reversed),
      }}
    >
      {children}
    </PairOrderContext.Provider>
  );
}

export function useTwapPairOrder() {
  const context = useContext(PairOrderContext);
  if (!context) {
    throw new Error("useTwapPairOrder must be used within a pair order provider");
  }
  return context;
}

export function TwapPairTitle({
  token0Symbol,
  token1Symbol,
}: {
  token0Symbol: string;
  token1Symbol: string;
}) {
  const { isReversed, toggleOrder } = useTwapPairOrder();
  const firstSymbol = isReversed ? token1Symbol : token0Symbol;
  const secondSymbol = isReversed ? token0Symbol : token1Symbol;

  return (
    <div className="mt-5 flex items-center gap-4">
      <h1 className="text-[clamp(36px,6vw,72px)] font-semibold tracking-[-.05em]">
        {firstSymbol} / {secondSymbol}
      </h1>
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2a3831] text-[22px] leading-none text-[#8d9b93] transition-colors hover:border-[#f0784b] hover:text-[#f0784b]"
        aria-label={`Reverse pair to ${secondSymbol} / ${firstSymbol}`}
        title={`Reverse pair to ${secondSymbol} / ${firstSymbol}`}
        onClick={toggleOrder}
      >
        <span aria-hidden="true">⇄</span>
      </button>
    </div>
  );
}
