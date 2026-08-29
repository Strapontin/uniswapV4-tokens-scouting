"use client";

import { useState } from "react";

type AddressCopyButtonProps = {
  address: string;
  className?: string;
};

export function AddressCopyButton({ address, className = "" }: AddressCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = address;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group relative inline-flex items-center gap-2 rounded-md border border-transparent bg-[#111813]/80 px-2 py-1 font-mono text-[11px] text-[#8d9b93] transition hover:border-[#2a3831] hover:text-[#edf4ef] ${className}`}
      aria-label={`Copy address ${address}`}
    >
      <span className="overflow-wrap-anywhere">{address}</span>
      <span
        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded border border-[#2a3831] bg-[#0c1110] px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[#edf4ef] transition ${copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
      >
        Copied!
      </span>
    </button>
  );
}

type TokenNameLinkProps = {
  address: string;
  name: string;
  symbol: string;
  className?: string;
};

export function TokenNameLink({ address, name, symbol, className = "" }: TokenNameLinkProps) {
  const explorerBase = "https://uniscan.xyz/address/";

  return (
    <a
      href={`${explorerBase}${address}`}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center text-[18px] font-semibold text-[#edf4ef] underline-offset-4 hover:text-[#f0784b] hover:underline ${className}`}
    >
      {name} ({symbol})
    </a>
  );
}

type AddressDisplayProps = {
  address: string;
  className?: string;
  label?: string;
};

export function AddressDisplay({ address, className = "", label }: AddressDisplayProps) {
  return (
    <div className={className}>
      {label && (
        <h3 className="m-0 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
          {label}
        </h3>
      )}
      <AddressCopyButton address={address} className="w-fit max-w-full" />
    </div>
  );
}
