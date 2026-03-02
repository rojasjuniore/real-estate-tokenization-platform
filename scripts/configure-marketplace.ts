import hre from "hardhat";
const { ethers, run, network } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Configure PropertyMarketplace Payment Tokens");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const MARKETPLACE_ADDRESS = "0x296250D12D207dDfCA2d89EE1526AEBdCA2d39D7";
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const USDC_ADDRESS = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const marketplace = PropertyMarketplace.attach(MARKETPLACE_ADDRESS);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  console.log("\nChecking current payment token status...");

  const usdtAccepted = await marketplace.isPaymentTokenAccepted(USDT_ADDRESS);
  console.log(`USDT accepted: ${usdtAccepted}`);

  if (!usdtAccepted) {
    console.log("Adding USDT...");
    const tx1 = await marketplace.addPaymentToken(USDT_ADDRESS);
    await tx1.wait();
    console.log(`Added USDT: ${USDT_ADDRESS}`);
    await delay(5000);
  }

  const usdcAccepted = await marketplace.isPaymentTokenAccepted(USDC_ADDRESS);
  console.log(`USDC accepted: ${usdcAccepted}`);

  if (!usdcAccepted) {
    console.log("Adding USDC...");
    const tx2 = await marketplace.addPaymentToken(USDC_ADDRESS);
    await tx2.wait();
    console.log(`Added USDC: ${USDC_ADDRESS}`);
    await delay(5000);
  }

  const maticAccepted = await marketplace.isPaymentTokenAccepted(ethers.ZeroAddress);
  console.log(`MATIC accepted: ${maticAccepted}`);

  if (!maticAccepted) {
    console.log("Adding MATIC...");
    const tx3 = await marketplace.addPaymentToken(ethers.ZeroAddress);
    await tx3.wait();
    console.log("Added MATIC (native token)");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Configuration complete!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
