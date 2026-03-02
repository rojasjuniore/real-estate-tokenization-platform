/**
 * Simplified ABIs for admin contract interactions
 * Only includes functions needed for admin operations
 */

// PropertyToken (ERC-1155) Admin Functions
export const PROPERTY_TOKEN_ABI = [
  // Read functions
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
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }],
    name: "hasRole",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Admin write functions
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "propertyId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "propertyId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// PropertyMarketplace Admin Functions
export const PROPERTY_MARKETPLACE_ABI = [
  // Read functions
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketplaceFee",
    outputs: [{ name: "", type: "uint96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "acceptedPaymentTokens",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "listingCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
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
  // Admin write functions
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newFee", type: "uint96" }],
    name: "setMarketplaceFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newTreasury", type: "address" }],
    name: "setTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "addPaymentToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "removePaymentToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// RoyaltyDistributor Admin Functions
export const ROYALTY_DISTRIBUTOR_ABI = [
  // Read functions
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
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
    inputs: [{ name: "token", type: "address" }],
    name: "acceptedPaymentTokens",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Admin write functions
  {
    inputs: [
      { name: "propertyId", type: "uint256" },
      { name: "totalAmount", type: "uint256" },
      { name: "paymentToken", type: "address" },
    ],
    name: "createDistribution",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "addPaymentToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "removePaymentToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Common role identifiers (keccak256 hashes)
export const ROLES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  MINTER_ROLE: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  PAUSER_ROLE: "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a",
  OPERATOR_ROLE: "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929",
} as const;

// Contract addresses from environment
export const CONTRACT_ADDRESSES = {
  propertyToken: process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS || "",
  marketplace: process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS || "",
  royaltyDistributor: process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS || "",
  paymentProcessor: process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS || "",
} as const;

// Payment tokens on Polygon
export const PAYMENT_TOKENS: Record<string, string> = {
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  USDC: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  MATIC: "0x0000000000000000000000000000000000001010", // Native MATIC wrapper
  DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
};

// Reverse mapping: address to token name
export const TOKEN_ADDRESSES_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(PAYMENT_TOKENS).map(([name, addr]) => [addr.toLowerCase(), name])
);

// Function selectors for manual encoding
export const FUNCTION_SELECTORS = {
  // PropertyToken
  createProperty: "0x14813659", // createProperty(uint256,uint256,string,uint96)
  burn: "0xf5298aca", // burn(address,uint256,uint256)
  pause: "0x8456cb59", // pause()
  unpause: "0x3f4ba83a", // unpause()
  grantRole: "0x2f2ff15d", // grantRole(bytes32,address)
  revokeRole: "0xd547741f", // revokeRole(bytes32,address)
  // Marketplace
  createListing: "0x8ebaae08", // createListing(uint256,uint256,uint256,address)
  buy: "0xd6febde8", // buy(uint256,uint256)
  setMarketplaceFee: "0x22eb6c3e", // setMarketplaceFee(uint96)
  setTreasury: "0xf0f44260", // setTreasury(address)
  addPaymentToken: "0x4b0ee02a", // addPaymentToken(address)
  removePaymentToken: "0x6a8b9c92", // removePaymentToken(address)
  // RoyaltyDistributor
  createDistribution: "0x4a0f5ef2", // createDistribution(uint256,uint256,address)
  claim: "0x379607f5", // claim(uint256)
} as const;
