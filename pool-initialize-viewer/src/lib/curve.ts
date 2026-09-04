import { encodeAbiParameters, keccak256, type Address } from "viem";

export const CURVE_POOL_ABI = [
  {
    name: "coins",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "exchange",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "i", type: "int128" },
      { name: "j", type: "int128" },
      { name: "_dx", type: "uint256" },
      { name: "_min_dy", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "ErrorNotEnoughAllowance",
    type: "error",
    inputs: [],
  },
] as const;

export const CURVE_DUMMY_ACCOUNT = "0x000000000000000000000000000000000000dEaD" as Address;

export function getAllowanceStorageKey(owner: Address, spender: Address, allowanceStorageSlot: bigint): `0x${string}` {
  const ownerSlot = keccak256(
    encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [owner, allowanceStorageSlot]),
  );

  return keccak256(
    encodeAbiParameters([{ type: "address" }, { type: "bytes32" }], [spender, ownerSlot]),
  );
}

export function getBalanceStorageKey(owner: Address, balanceStorageSlot: bigint): `0x${string}` {
  return keccak256(
    encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [owner, balanceStorageSlot]),
  );
}