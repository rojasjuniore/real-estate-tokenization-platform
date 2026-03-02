const hre = require("hardhat");

/**
 * Configure the new PropertyMarketplace with payment tokens
 */
async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Configure PropertyMarketplace Payment Tokens");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("=".repeat(60));

  // New marketplace address
  const MARKETPLACE_ADDRESS = "0x693fD2bD21E8089951ABe97aa3b319faCD940a1f";

  // Payment tokens
  const USDC_ADDRESS = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const marketplace = PropertyMarketplace.attach(MARKETPLACE_ADDRESS);

  // Check if USDT is already added
  console.log("\nChecking if USDT is accepted...");
  const usdtAccepted = await marketplace.isPaymentTokenAccepted("0xc2132D05D31c914a87C6611C10748AEb04B58e8F");
  console.log(`USDT accepted: ${usdtAccepted}`);

  // Add USDC
  console.log("\nAdding USDC...");
  const tx1 = await marketplace.addPaymentToken(USDC_ADDRESS);
  await tx1.wait();
  console.log(`Added USDC: ${USDC_ADDRESS}`);

  // Add MATIC (native token)
  console.log("\nAdding MATIC (native token)...");
  const tx2 = await marketplace.addPaymentToken(ethers.ZeroAddress);
  await tx2.wait();
  console.log("Added MATIC (native token)");

  console.log("\n✓ Payment tokens configured successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
