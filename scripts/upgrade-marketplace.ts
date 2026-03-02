import hre from "hardhat";
const { ethers, run, network } = hre;
import * as fs from "fs";
import * as path from "path";

/**
 * Upgrade script: Deploys new PropertyMarketplace with buyDirect functionality
 * Keeps existing PropertyToken and RoyaltyDistributor
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("PropertyMarketplace Upgrade Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log("=".repeat(60));

  // Read existing deployment
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`No existing deployment found at ${deploymentFile}`);
  }

  const existingDeployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  console.log("\nExisting deployment:");
  console.log(`  PropertyToken: ${existingDeployment.contracts.PropertyToken}`);
  console.log(`  RoyaltyDistributor: ${existingDeployment.contracts.RoyaltyDistributor}`);
  console.log(`  Old Marketplace: ${existingDeployment.contracts.PropertyMarketplace}`);

  // Configuration
  const TREASURY_ADDRESS = existingDeployment.config.treasury;
  const MARKETPLACE_FEE = existingDeployment.config.marketplaceFee || 250;
  const PROPERTY_TOKEN_ADDRESS = existingDeployment.contracts.PropertyToken;

  // Payment tokens (Polygon Mainnet)
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const USDC_ADDRESS = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  console.log("\nDeploying new PropertyMarketplace with buyDirect support...");
  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplace.deploy(
    PROPERTY_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    MARKETPLACE_FEE
  );
  await propertyMarketplace.waitForDeployment();
  const propertyMarketplaceAddress = await propertyMarketplace.getAddress();
  console.log(`New PropertyMarketplace deployed at: ${propertyMarketplaceAddress}`);

  // Configure payment tokens
  console.log("\nConfiguring payment tokens...");

  if (network.name === "polygon") {
    await propertyMarketplace.addPaymentToken(USDT_ADDRESS);
    console.log(`Added USDT: ${USDT_ADDRESS}`);

    await propertyMarketplace.addPaymentToken(USDC_ADDRESS);
    console.log(`Added USDC: ${USDC_ADDRESS}`);
  }

  // Add native token (address(0)) for MATIC payments
  await propertyMarketplace.addPaymentToken(ethers.ZeroAddress);
  console.log("Added MATIC (native token)");

  // IMPORTANT: Treasury must approve the new marketplace to transfer PropertyTokens
  console.log("\n⚠️  IMPORTANT: Treasury must approve new marketplace!");
  console.log(`   Treasury (${TREASURY_ADDRESS}) needs to call:`);
  console.log(`   PropertyToken.setApprovalForAll(${propertyMarketplaceAddress}, true)`);

  // Update deployment file
  existingDeployment.contracts.PropertyMarketplace = propertyMarketplaceAddress;
  existingDeployment.timestamp = new Date().toISOString();
  existingDeployment.notes = existingDeployment.notes || [];
  existingDeployment.notes.push({
    date: new Date().toISOString(),
    action: "Upgraded PropertyMarketplace with buyDirect functionality"
  });

  fs.writeFileSync(deploymentFile, JSON.stringify(existingDeployment, null, 2));
  console.log(`\nDeployment file updated: ${deploymentFile}`);

  // Verify contract on Polygonscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting 30s for block confirmations before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("Verifying new PropertyMarketplace on Polygonscan...");
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
  console.log("UPGRADE SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  console.log("\nContract Addresses:");
  console.log(`  PropertyToken:       ${PROPERTY_TOKEN_ADDRESS} (unchanged)`);
  console.log(`  PropertyMarketplace: ${propertyMarketplaceAddress} (NEW)`);
  console.log(`  RoyaltyDistributor:  ${existingDeployment.contracts.RoyaltyDistributor} (unchanged)`);
  console.log("\nUpdate your .env file:");
  console.log(`  NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS="${propertyMarketplaceAddress}"`);
  console.log("\n⚠️  POST-DEPLOY ACTIONS:");
  console.log("  1. Update .env with new marketplace address");
  console.log("  2. Treasury must approve marketplace: PropertyToken.setApprovalForAll()");
  console.log("  3. For each property, admin must call: marketplace.setPropertyPrice()");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
