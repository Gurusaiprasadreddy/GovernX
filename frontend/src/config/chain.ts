// Chain configuration
export const SUPPORTED_CHAIN_ID = parseInt(
  import.meta.env.VITE_CHAIN_ID ?? "11155111"
);

export const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string) ?? "";

export const DEMO_TARGET_ADDRESS =
  (import.meta.env.VITE_DEMO_TARGET_ADDRESS as string) ?? "";

export const EXPLORER_URL =
  (import.meta.env.VITE_EXPLORER_URL as string) ??
  "https://sepolia.etherscan.io";

export const CHAIN_NAME =
  (import.meta.env.VITE_CHAIN_NAME as string) ?? "Sepolia";

export const EXECUTION_THRESHOLD = 10;

export const SEPOLIA_CHAIN_ID = 11155111;

export const CHAIN_CONFIG = {
  id: SEPOLIA_CHAIN_ID,
  name: "Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
};
