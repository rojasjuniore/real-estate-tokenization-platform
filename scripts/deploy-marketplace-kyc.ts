import hre from "hardhat";
import { network as hreNetwork } from "hardhat";
const { ethers, run, network } = hre;

// Change network dynamically if needed
const NETWORK = process.env.HARDHAT_NETWORK || "polygon";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("PropertyMarketplace with KYC - Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log("=".repeat(60));

  // Configuration from existing deployment
  const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS;
  const TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  const MARKETPLACE_FEE = 250; // 2.5%

  if (!PROPERTY_TOKEN_ADDRESS) {
    throw new Error("NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS not set in .env");
  }

  // Payment tokens (Polygon Mainnet)
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const USDC_ADDRESS = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  console.log("\nConfiguration:");
  console.log(`  PropertyToken: ${PROPERTY_TOKEN_ADDRESS}`);
  console.log(`  Treasury: ${TREASURY_ADDRESS}`);
  console.log(`  Marketplace Fee: ${MARKETPLACE_FEE / 100}%`);

  console.log("\n[1/1] Deploying PropertyMarketplace with KYC...");
  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplace.deploy(
    PROPERTY_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    MARKETPLACE_FEE
  );
  await propertyMarketplace.waitForDeployment();
  const propertyMarketplaceAddress = await propertyMarketplace.getAddress();
  console.log(`PropertyMarketplace deployed at: ${propertyMarketplaceAddress}`);

  // Configure payment tokens
  console.log("\nConfiguring payment tokens...");

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  if (network.name === "polygon") {
    const tx1 = await propertyMarketplace.addPaymentToken(USDT_ADDRESS);
    await tx1.wait();
    console.log(`Added USDT: ${USDT_ADDRESS}`);
    await delay(5000);

    const tx2 = await propertyMarketplace.addPaymentToken(USDC_ADDRESS);
    await tx2.wait();
    console.log(`Added USDC: ${USDC_ADDRESS}`);
    await delay(5000);
  }

  // Add native token (address(0)) for MATIC payments
  const tx3 = await propertyMarketplace.addPaymentToken(ethers.ZeroAddress);
  await tx3.wait();
  console.log("Added MATIC (native token)");

  // Verify contract on Polygonscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("\nVerifying contract on Polygonscan...");
    try {
      await run("verify:verify", {
        address: propertyMarketplaceAddress,
        constructorArguments: [PROPERTY_TOKEN_ADDRESS, TREASURY_ADDRESS, MARKETPLACE_FEE],
      });
      console.log("PropertyMarketplace verified!");
    } catch (error: any) {
      console.log(`Verification failed: ${error.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`New PropertyMarketplace: ${propertyMarketplaceAddress}`);
  console.log("\nUpdate your .env file:");
  console.log(`NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS=${propertyMarketplaceAddress}`);
  console.log("\nKYC Features available:");
  console.log("  - approveKYC(address wallet)");
  console.log("  - revokeKYC(address wallet)");
  console.log("  - approveKYCBatch(address[] wallets)");
  console.log("  - isKYCApproved(address wallet)");
  console.log("  - getKYCInfo(address wallet)");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
