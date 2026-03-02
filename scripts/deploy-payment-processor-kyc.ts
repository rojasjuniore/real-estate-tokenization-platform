import hre from "hardhat";
const { ethers, run, network } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("PaymentProcessor with KYC - Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log("=".repeat(60));

  // Configuration
  const TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS || deployer.address;

  // Payment tokens (Polygon Mainnet)
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const USDC_ADDRESS = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  console.log("\nConfiguration:");
  console.log(`  Treasury: ${TREASURY_ADDRESS}`);

  console.log("\n[1/1] Deploying PaymentProcessor with KYC...");
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(TREASURY_ADDRESS);
  await paymentProcessor.waitForDeployment();
  const paymentProcessorAddress = await paymentProcessor.getAddress();
  console.log(`PaymentProcessor deployed at: ${paymentProcessorAddress}`);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Configure payment tokens
  console.log("\nConfiguring payment tokens...");

  if (network.name === "polygon") {
    console.log("Adding USDT...");
    const tx1 = await paymentProcessor.addPaymentToken(USDT_ADDRESS, 6);
    await tx1.wait();
    console.log(`Added USDT: ${USDT_ADDRESS}`);
    await delay(5000);

    console.log("Adding USDC...");
    const tx2 = await paymentProcessor.addPaymentToken(USDC_ADDRESS, 6);
    await tx2.wait();
    console.log(`Added USDC: ${USDC_ADDRESS}`);
    await delay(5000);
  }

  // Add native token (address(0)) for MATIC payments
  console.log("Adding MATIC...");
  const tx3 = await paymentProcessor.addPaymentToken(ethers.ZeroAddress, 18);
  await tx3.wait();
  console.log("Added MATIC (native token)");

  // Verify contract on Polygonscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await delay(30000);

    console.log("\nVerifying contract on Polygonscan...");
    try {
      await run("verify:verify", {
        address: paymentProcessorAddress,
        constructorArguments: [TREASURY_ADDRESS],
      });
      console.log("PaymentProcessor verified!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified on Polygonscan");
      } else {
        console.log(`Verification failed: ${error.message}`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`New PaymentProcessor: ${paymentProcessorAddress}`);
  console.log("\nUpdate your .env file:");
  console.log(`NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=${paymentProcessorAddress}`);
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
