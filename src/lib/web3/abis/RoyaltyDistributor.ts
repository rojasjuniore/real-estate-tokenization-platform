export const ROYALTY_DISTRIBUTOR_ABI = [
  // Read functions
  {
    name: 'propertyToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'distributionCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'isPaymentTokenAccepted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getDistribution',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'distributionId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'propertyId', type: 'uint256' },
          { name: 'totalAmount', type: 'uint256' },
          { name: 'paymentToken', type: 'address' },
          { name: 'totalSupplySnapshot', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'hasClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'distributionId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getPropertyDistributions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'propertyId', type: 'uint256' }],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'getUnclaimedDistributions',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'propertyId', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'getClaimableAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'distributionId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  // Write functions
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'distributionId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'addPaymentToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    name: 'removePaymentToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    name: 'createDistribution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // Events
  {
    name: 'DistributionCreated',
    type: 'event',
    inputs: [
      { name: 'distributionId', type: 'uint256', indexed: true },
      { name: 'propertyId', type: 'uint256', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'paymentToken', type: 'address', indexed: false },
    ],
  },
  {
    name: 'RoyaltyClaimed',
    type: 'event',
    inputs: [
      { name: 'distributionId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
