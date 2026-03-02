const hre = require("hardhat");

/**
 * Approve KYC for wallet addresses on the new marketplace
 */
async function main() {
  const { ethers, network } = hre;
  const [admin] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Approve KYC on PropertyMarketplace");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Admin: ${admin.address}`);
  console.log("=".repeat(60));

  const MARKETPLACE_ADDRESS = "0x693fD2bD21E8089951ABe97aa3b319faCD940a1f";

  // Wallets to approve KYC
  const walletsToApprove = [
    "0xef20f47323f0a5ec1e4947476e364765d2164f70",
    "0x488f849af789da8dac5ea7cb56709f0ce7ae68a9",
    "0x928a4f3231056b8081E0BdD1F83A07fC446f6CD0",
    "0x9ae1df3880e41bba74b4c07b19c6afd51ba74f63",
    "0x69e4a81385f54bff8a212e06d8a918f3c9c28a8b",
  ];

  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const marketplace = PropertyMarketplace.attach(MARKETPLACE_ADDRESS);

  console.log("\nApproving KYC for wallets...");

  for (const wallet of walletsToApprove) {
    try {
      const isApproved = await marketplace.isKYCApproved(wallet);
      if (isApproved) {
        console.log(`✓ ${wallet} - already approved`);
        continue;
      }

      const tx = await marketplace.approveKYC(wallet);
      await tx.wait();
      console.log(`✓ ${wallet} - KYC approved`);
    } catch (error) {
      console.error(`✗ ${wallet} - Error: ${error.message}`);
    }
  }

  console.log("\n✓ KYC approval complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
