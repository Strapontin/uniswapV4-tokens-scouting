import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-[min(100%-48px,980px)] flex-col justify-center py-12">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#f0784b]">
        Uniswap v4 interactions
      </div>

      <h1 className="mt-5 max-w-[680px] text-[clamp(48px,8vw,92px)] font-semibold leading-[.92] tracking-[-.065em]">
        Choose a tool
      </h1>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/curve"
          className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-5 no-underline transition-colors hover:border-[#f0784b]"
        >
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#f0784b]">01</span>
          <strong className="mt-8 block text-[24px] text-[#edf4ef]">Curve quotes</strong>
          <span className="mt-2 block text-[14px] text-[#8d9b93]">Simulate Curve pool exchanges.</span>
        </Link>

        <Link
          href="/poolInitialize"
          className="rounded-[14px] border border-[#2a3831] bg-[rgba(17,24,21,0.9)] p-5 no-underline transition-colors hover:border-[#f0784b]"
        >
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#f0784b]">02</span>
          <strong className="mt-8 block text-[24px] text-[#edf4ef]">Pool Initialize</strong>
          <span className="mt-2 block text-[14px] text-[#8d9b93]">Browse Uniswap v4 pool events.</span>
        </Link>
      </div>
    </main>
  );
}
