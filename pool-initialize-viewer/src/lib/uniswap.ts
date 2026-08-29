import type { Address } from "viem";
import { unichain } from "viem/chains";

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;
export const QUOTER_ADDRESS = (process.env.NEXT_PUBLIC_V4_QUOTER ??
  "0x333e3c607b141b18ff6de9f258db6e77fe7491e0") as Address;
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? unichain.rpcUrls.default.http[0];

export const QUOTER_ABI = [
  {
    name: "quoteExactInputSingle",
    type: "function",
    stateMutability: "view",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          {
            name: "poolKey",
            type: "tuple",
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;
