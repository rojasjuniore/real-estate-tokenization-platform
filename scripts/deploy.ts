import hre from "hardhat";
const { ethers, run, network } = hre;
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    PropertyToken: string;
    PropertyMarketplace: string;
    RoyaltyDistributor: string;
  };
  config: {
    treasury: string;
    marketplaceFee: number;
    acceptedTokens: string[];
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("BuidingTok Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/MATIC`);
  console.log("=".repeat(60));

  // Configuration
  const TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  const MARKETPLACE_FEE = 250; // 2.5%
  const BASE_URI = "https://api.buidingtok.com/metadata/";

  // Payment tokens (Polygon Mainnet)
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const USDC_ADDRESS = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  console.log("\n[1/3] Deploying PropertyToken...");
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(BASE_URI, TREASURY_ADDRESS);
  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log(`PropertyToken deployed at: ${propertyTokenAddress}`);

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

  // Configure payment tokens
  console.log("\nConfiguring payment tokens...");

  // For mainnet, add USDT and USDC
  if (network.name === "polygon") {
    await propertyMarketplace.addPaymentToken(USDT_ADDRESS);
    console.log(`Added USDT: ${USDT_ADDRESS}`);

    await propertyMarketplace.addPaymentToken(USDC_ADDRESS);
    console.log(`Added USDC: ${USDC_ADDRESS}`);

    await royaltyDistributor.addPaymentToken(USDT_ADDRESS);
    await royaltyDistributor.addPaymentToken(USDC_ADDRESS);
  }

  // Add native token (address(0)) for MATIC payments
  await propertyMarketplace.addPaymentToken(ethers.ZeroAddress);
  console.log("Added MATIC (native token)");

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
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
      acceptedTokens: network.name === "polygon"
        ? [USDT_ADDRESS, USDC_ADDRESS, ethers.ZeroAddress]
        : [ethers.ZeroAddress],
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Verify contracts on Etherscan (if not localhost)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("\nVerifying contracts on Polygonscan...");

    try {
      await run("verify:verify", {
        address: propertyTokenAddress,
        constructorArguments: [BASE_URI, TREASURY_ADDRESS],
      });
      console.log("PropertyToken verified!");
    } catch (error: any) {
      console.log(`PropertyToken verification failed: ${error.message}`);
    }

    try {
      await run("verify:verify", {
        address: propertyMarketplaceAddress,
        constructorArguments: [propertyTokenAddress, TREASURY_ADDRESS, MARKETPLACE_FEE],
      });
      console.log("PropertyMarketplace verified!");
    } catch (error: any) {
      console.log(`PropertyMarketplace verification failed: ${error.message}`);
    }

    try {
      await run("verify:verify", {
        address: royaltyDistributorAddress,
        constructorArguments: [propertyTokenAddress],
      });
      console.log("RoyaltyDistributor verified!");
    } catch (error: any) {
      console.log(`RoyaltyDistributor verification failed: ${error.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  console.log(`Marketplace Fee: ${MARKETPLACE_FEE / 100}%`);
  console.log("\nContract Addresses:");
  console.log(`  PropertyToken:       ${propertyTokenAddress}`);
  console.log(`  PropertyMarketplace: ${propertyMarketplaceAddress}`);
  console.log(`  RoyaltyDistributor:  ${royaltyDistributorAddress}`);
  console.log("\nUpdate your .env file with these addresses:");
  console.log(`  NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS="${propertyTokenAddress}"`);
  console.log(`  NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS="${propertyMarketplaceAddress}"`);
  console.log(`  NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS="${royaltyDistributorAddress}"`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
