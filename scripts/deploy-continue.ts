import hre from "hardhat";
const { ethers, run, network } = hre;
import * as fs from "fs";
import * as path from "path";

// Already deployed PropertyToken address
const EXISTING_PROPERTY_TOKEN = "0x949F958CB40B3522AD8Ed20531c693e88a71cf71";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("BuidingTok Deployment - CONTINUE");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log("=".repeat(60));

  const propertyTokenAddress = EXISTING_PROPERTY_TOKEN;
  console.log(`\n[1/3] Using existing PropertyToken: ${propertyTokenAddress}`);

  const TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  const MARKETPLACE_FEE = 250; // 2.5%

  console.log("\n[2/3] Deploying PropertyMarketplace...");
  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplace.deploy(
    propertyTokenAddress,
    TREASURY_ADDRESS,
    MARKETPLACE_FEE
  );
  await propertyMarketplace.waitForDeployment();
  const propertyMarketplaceAddress = await propertyMarketplace.getAddress();
  console.log(`PropertyMarketplace deployed at: ${propertyMarketplaceAddress}`);

  console.log("\n[3/3] Deploying RoyaltyDistributor...");
  const RoyaltyDistributor = await ethers.getContractFactory("RoyaltyDistributor");
  const royaltyDistributor = await RoyaltyDistributor.deploy(propertyTokenAddress);
  await royaltyDistributor.waitForDeployment();
  const royaltyDistributorAddress = await royaltyDistributor.getAddress();
  console.log(`RoyaltyDistributor deployed at: ${royaltyDistributorAddress}`);

  // Add native token for MATIC payments
  console.log("\nConfiguring payment tokens...");
  await propertyMarketplace.addPaymentToken(ethers.ZeroAddress);
  console.log("Added MATIC (native token)");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId as number,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PropertyToken: propertyTokenAddress,
      PropertyMarketplace: propertyMarketplaceAddress,
      RoyaltyDistributor: royaltyDistributorAddress,
    },
    config: {
      treasury: TREASURY_ADDRESS,
      marketplaceFee: MARKETPLACE_FEE,
      acceptedTokens: [ethers.ZeroAddress],
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  console.log(`Marketplace Fee: ${MARKETPLACE_FEE / 100}%`);
  console.log("\nContract Addresses:");
  console.log(`  PropertyToken:       ${propertyTokenAddress}`);
  console.log(`  PropertyMarketplace: ${propertyMarketplaceAddress}`);
  console.log(`  RoyaltyDistributor:  ${royaltyDistributorAddress}`);
  console.log("\nUpdate your .env file with these addresses:");
  console.log(`NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
  console.log(`NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS=${propertyMarketplaceAddress}`);
  console.log(`NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS=${royaltyDistributorAddress}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
