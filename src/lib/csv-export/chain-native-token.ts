const chainNativeTokens: Record<string, string> = {
  ethereum: "ETH",
  polygon: "MATIC",
  arbitrum: "ETH",
  optimism: "ETH",
  base: "ETH",
  avalanche: "AVAX",
  bsc: "BNB",
  fantom: "FTM",
  solana: "SOL",
  gnosis: "xDAI",
  celo: "CELO",
  moonbeam: "GLMR",
  moonriver: "MOVR",
  cronos: "CRO",
  zksync: "ETH",
  linea: "ETH",
  scroll: "ETH",
  blast: "ETH",
  mantle: "MNT",
  manta: "ETH",
  mode: "ETH",
  zora: "ETH",
};

export function getNativeToken(chainKey: string): string {
  return chainNativeTokens[chainKey.toLowerCase()] ?? "ETH";
}
