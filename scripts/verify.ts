import hre from "hardhat";
const { run, network } = hre;
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=".repeat(60));
  console.log("Contract Verification Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`No deployment found for network: ${network.name}`);
    console.error(`Expected file: ${deploymentFile}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("\nLoaded deployment:");
  console.log(`  PropertyToken: ${deployment.contracts.PropertyToken}`);
  console.log(`  PropertyMarketplace: ${deployment.contracts.PropertyMarketplace}`);
  console.log(`  RoyaltyDistributor: ${deployment.contracts.RoyaltyDistributor}`);

  const BASE_URI = "https://api.buidingtok.com/metadata/";
  const TREASURY_ADDRESS = deployment.config.treasury;
  const MARKETPLACE_FEE = deployment.config.marketplaceFee;

  console.log("\n[1/3] Verifying PropertyToken...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.PropertyToken,
      constructorArguments: [BASE_URI, TREASURY_ADDRESS],
    });
    console.log("PropertyToken verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("PropertyToken already verified!");
    } else {
      console.log(`PropertyToken verification failed: ${error.message}`);
    }
  }

  console.log("\n[2/3] Verifying PropertyMarketplace...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.PropertyMarketplace,
      constructorArguments: [
        deployment.contracts.PropertyToken,
        TREASURY_ADDRESS,
        MARKETPLACE_FEE,
      ],
    });
    console.log("PropertyMarketplace verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("PropertyMarketplace already verified!");
    } else {
      console.log(`PropertyMarketplace verification failed: ${error.message}`);
    }
  }

  console.log("\n[3/3] Verifying RoyaltyDistributor...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.RoyaltyDistributor,
      constructorArguments: [deployment.contracts.PropertyToken],
    });
    console.log("RoyaltyDistributor verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("RoyaltyDistributor already verified!");
    } else {
      console.log(`RoyaltyDistributor verification failed: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Verification complete!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
