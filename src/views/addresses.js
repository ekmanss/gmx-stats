export const BSC = 56;
export const BSCTest = 97;

export const addresses = {
  [BSCTest]: {
    Vault: "0xc73A8DcAc88498FD4b4B1b2AaA37b0a2614Ff67B",
    Router: "0xD46B23D042E976F8666F554E928e0Dc7478a8E1f",
    USDX: "0x85E76cbf4893c1fbcB34dCF1239A91CE2A4CF5a7",
    Stabilize: "0x82C4841728fBd5e08A77A95cA3192BcE1F645Ee9",
  },
  // used for mainnet
  [BSC]: {},
};

export function getAddress(chainId, key) {
  if (!(chainId in addresses)) {
    throw new Error(`Unknown chain ${chainId}`);
  }

  if (!(key in addresses[chainId])) {
    throw new Error(`Unknown address key ${key}`);
  }
  return addresses[chainId][key];
}
