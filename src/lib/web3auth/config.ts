// Web3Auth v10 Configuration

// Web3Auth configuration
export const WEB3AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";

// Chain configuration - Polygon Mainnet only
export const CHAIN_CONFIG = {
  chainId: "0x89", // 137 in hex
  rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-rpc.com",
  displayName: "Polygon Mainnet",
  blockExplorerUrl: "https://polygonscan.com",
  ticker: "POL",
  tickerName: "Polygon",
};

// USDT Contract Address on Polygon Mainnet
export const USDT_CONTRACT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

// Contract Addresses from env
export const ROYALTY_DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS || "";
export const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS || "";
export const PROPERTY_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS || "";

// ERC20 ABI for balanceOf and decimals
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

// RoyaltyDistributor ABI (only functions we need)
export const ROYALTY_DISTRIBUTOR_ABI = [
  {
    inputs: [{ name: "distributionId", type: "uint256" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "distributionId", type: "uint256" }, { name: "user", type: "address" }],
    name: "getClaimableAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }, { name: "propertyId", type: "uint256" }],
    name: "getUnclaimedDistributions",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "distributionId", type: "uint256" }],
    name: "getDistribution",
    outputs: [
      {
        components: [
          { name: "propertyId", type: "uint256" },
          { name: "totalAmount", type: "uint256" },
          { name: "paymentToken", type: "address" },
          { name: "totalSupplySnapshot", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "distributionCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PropertyToken ABI (ERC-1155)
export const PROPERTY_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PropertyMarketplace ABI (only functions we need)
export const PROPERTY_MARKETPLACE_ABI = [
  {
    inputs: [{ name: "listingId", type: "uint256" }, { name: "amount", type: "uint256" }],
    name: "buy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "listingId", type: "uint256" }],
    name: "getListing",
    outputs: [
      {
        components: [
          { name: "seller", type: "address" },
          { name: "propertyId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "paymentToken", type: "address" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "propertyId", type: "uint256" }],
    name: "getPropertyListings",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "propertyId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "pricePerToken", type: "uint256" },
      { name: "paymentToken", type: "address" },
    ],
    name: "createListing",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
