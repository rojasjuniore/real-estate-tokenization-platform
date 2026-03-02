const hre = require("hardhat");

/**
 * Treasury approves the new marketplace to transfer PropertyTokens
 * This is required for buyDirect to work
 */
async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Approve Marketplace for PropertyToken Transfers");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Signer (Treasury): ${deployer.address}`);
  console.log("=".repeat(60));

  // Addresses
  const PROPERTY_TOKEN_ADDRESS = "0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0";
  const MARKETPLACE_ADDRESS = "0x693fD2bD21E8089951ABe97aa3b319faCD940a1f";

  // Get PropertyToken contract
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = PropertyToken.attach(PROPERTY_TOKEN_ADDRESS);

  // Check current approval
  console.log("\nChecking current approval status...");
  const isApproved = await propertyToken.isApprovedForAll(deployer.address, MARKETPLACE_ADDRESS);
  console.log(`Marketplace approved: ${isApproved}`);

  if (isApproved) {
    console.log("\n✓ Marketplace is already approved!");
    return;
  }

  // Approve marketplace
  console.log("\nApproving marketplace...");
  const tx = await propertyToken.setApprovalForAll(MARKETPLACE_ADDRESS, true);
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("Transaction confirmed!");

  // Verify approval
  const isApprovedNow = await propertyToken.isApprovedForAll(deployer.address, MARKETPLACE_ADDRESS);
  console.log(`\n✓ Marketplace approved: ${isApprovedNow}`);

  console.log("\n" + "=".repeat(60));
  console.log("Treasury has approved the marketplace to transfer tokens.");
  console.log("buyDirect() function is now ready to use!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
