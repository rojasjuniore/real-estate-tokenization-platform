import hre from "hardhat";

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();

  console.log("========================================");
  console.log("  BuidingTok Testnet Full Deployment");
  console.log("========================================");
  console.log("\nDeploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    console.error("\nERROR: Account has no MATIC for gas!");
    console.log("Get testnet MATIC from: https://faucet.polygon.technology/");
    process.exit(1);
  }

  // Get contract addresses from environment
  let propertyTokenAddress = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS_AMOY;
  let usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS_AMOY;
  let marketplaceAddress = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS_AMOY;

  // 1. Deploy Mock USDC if not exists
  if (!usdcAddress) {
    console.log("\n--- Step 1: Deploying Mock USDC ---");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockERC20.deploy("Test USDC", "tUSDC", 6);
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log("Mock USDC deployed:", usdcAddress);

    // Mint initial supply to deployer
    const initialSupply = ethers.parseUnits("10000000", 6); // 10M USDC
    await mockUsdc.mint(deployer.address, initialSupply);
    console.log("Minted 10,000,000 tUSDC to deployer");
  } else {
    console.log("\n--- Step 1: Using existing USDC ---");
    console.log("USDC address:", usdcAddress);
  }

  // 2. Deploy PropertyToken if not exists
  if (!propertyTokenAddress) {
    console.log("\n--- Step 2: Deploying PropertyToken ---");
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy(
      "ipfs://buidingtok/",
      deployer.address // treasury
    );
    await propertyToken.waitForDeployment();
    propertyTokenAddress = await propertyToken.getAddress();
    console.log("PropertyToken deployed:", propertyTokenAddress);

    // Create 3 test properties
    console.log("\nCreating test properties...");
    const supply = 10000n; // 10,000 fractions per property
    const royalty = 250; // 2.5% royalty

    for (let i = 1; i <= 3; i++) {
      const tx = await propertyToken.createProperty(
        i,
        supply,
        `ipfs://buidingtok/property/${i}`,
        royalty
      );
      await tx.wait();
      console.log(`Created property ${i} with ${supply} tokens`);
    }
  } else {
    console.log("\n--- Step 2: Using existing PropertyToken ---");
    console.log("PropertyToken address:", propertyTokenAddress);
  }

  // 3. Deploy Marketplace if not exists
  if (!marketplaceAddress) {
    console.log("\n--- Step 3: Deploying PropertyMarketplace ---");
    const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
    const marketplace = await PropertyMarketplace.deploy(
      propertyTokenAddress,
      deployer.address, // treasury
      250 // 2.5% fee
    );
    await marketplace.waitForDeployment();
    marketplaceAddress = await marketplace.getAddress();
    console.log("PropertyMarketplace deployed:", marketplaceAddress);

    // Add USDC as accepted payment token
    await marketplace.addPaymentToken(usdcAddress);
    console.log("Added tUSDC as payment token");
  } else {
    console.log("\n--- Step 3: Using existing Marketplace ---");
    console.log("Marketplace address:", marketplaceAddress);
  }

  // 4. Deploy TestFaucet
  console.log("\n--- Step 4: Deploying TestFaucet ---");
  const TestFaucet = await ethers.getContractFactory("TestFaucet");
  const faucet = await TestFaucet.deploy(usdcAddress, propertyTokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("TestFaucet deployed:", faucetAddress);

  // 5. Fund the faucet
  console.log("\n--- Step 5: Funding TestFaucet ---");

  // Fund with USDC
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(usdcAddress);
  const usdcFundAmount = ethers.parseUnits("100000", 6); // 100K USDC
  await usdc.transfer(faucetAddress, usdcFundAmount);
  console.log("Transferred 100,000 tUSDC to faucet");

  // Fund with PropertyTokens
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = PropertyToken.attach(propertyTokenAddress);

  for (let i = 1; i <= 3; i++) {
    // Transfer 1000 tokens of each property to faucet
    const tokenAmount = 1000n;
    await propertyToken.safeTransferFrom(
      deployer.address,
      faucetAddress,
      i,
      tokenAmount,
      "0x"
    );
    console.log(`Transferred ${tokenAmount} tokens of property ${i} to faucet`);

    // Add property to faucet's available list
    await faucet.addProperty(i);
    console.log(`Added property ${i} to faucet claimable list`);
  }

  // Summary
  console.log("\n========================================");
  console.log("  DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("Mock USDC:          ", usdcAddress);
  console.log("PropertyToken:      ", propertyTokenAddress);
  console.log("PropertyMarketplace:", marketplaceAddress);
  console.log("TestFaucet:         ", faucetAddress);

  console.log("\n\nAdd these to your .env file:");
  console.log("----------------------------");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS_AMOY=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS_AMOY=${propertyTokenAddress}`);
  console.log(`NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS_AMOY=${marketplaceAddress}`);
  console.log(`NEXT_PUBLIC_FAUCET_ADDRESS_AMOY=${faucetAddress}`);

  console.log("\n\nFaucet Configuration:");
  console.log("---------------------");
  console.log("- USDC claim amount: 1,000 tUSDC per claim");
  console.log("- Property token claim: 10 tokens per claim");
  console.log("- Cooldown period: 24 hours");
  console.log("- Available properties: 1, 2, 3");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
