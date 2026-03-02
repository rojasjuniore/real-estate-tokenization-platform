import hre from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const ethers = hre.ethers;
  const [deployer, seller, buyer] = await ethers.getSigners();

  console.log("Creating test listing with accounts:");
  console.log("- Deployer:", deployer.address);
  console.log("- Seller:", seller.address);
  console.log("- Buyer:", buyer.address);

  // Deploy MockERC20 for USDC
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  console.log("\nMock USDC deployed:", await usdc.getAddress());

  // Deploy PropertyToken
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(
    "ipfs://base-uri/",
    deployer.address // treasury
  );
  await propertyToken.waitForDeployment();
  console.log("PropertyToken deployed:", await propertyToken.getAddress());

  // Deploy PropertyMarketplace with 2.5% fee (250 basis points)
  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const marketplace = await PropertyMarketplace.deploy(
    await propertyToken.getAddress(),
    deployer.address, // treasury
    250 // 2.5% fee
  );
  await marketplace.waitForDeployment();
  console.log("PropertyMarketplace deployed:", await marketplace.getAddress());

  // Setup: Add USDC as accepted payment token
  await marketplace.addPaymentToken(await usdc.getAddress());
  console.log("\nUSDC added as payment token");

  // Create a property (tokenId: 1, supply: 10000 tokens)
  const propertyId = 1n;
  const supply = 10000n;
  await propertyToken.createProperty(
    propertyId,
    supply,
    "ipfs://property-1-metadata",
    250 // 2.5% royalty
  );
  console.log(`Property ${propertyId} created with ${supply} tokens`);

  // Transfer tokens to seller
  const sellerAmount = 1000n;
  await propertyToken.safeTransferFrom(
    deployer.address,
    seller.address,
    propertyId,
    sellerAmount,
    "0x"
  );
  console.log(`Transferred ${sellerAmount} tokens to seller`);

  // Seller approves marketplace
  await propertyToken.connect(seller).setApprovalForAll(
    await marketplace.getAddress(),
    true
  );
  console.log("Seller approved marketplace");

  // Create listing: 100 tokens at $50 each
  const listingAmount = 100n;
  const pricePerToken = parseUnits("50", 6); // $50 in USDC (6 decimals)

  const tx = await marketplace.connect(seller).createListing(
    propertyId,
    listingAmount,
    pricePerToken,
    await usdc.getAddress()
  );
  const receipt = await tx.wait();

  // Get listingId from event
  const listingCreatedEvent = receipt?.logs.find(
    (log: { topics: readonly string[]; data: string }) => {
      try {
        const parsed = marketplace.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "ListingCreated";
      } catch {
        return false;
      }
    }
  );

  const parsedEvent = marketplace.interface.parseLog({
    topics: listingCreatedEvent!.topics as string[],
    data: listingCreatedEvent!.data,
  });
  const listingId = parsedEvent?.args[0];

  console.log(`\nListing created:`);
  console.log(`- Listing ID: ${listingId}`);
  console.log(`- Amount: ${listingAmount} tokens`);
  console.log(`- Price per token: $${Number(pricePerToken) / 1e6}`);
  console.log(`- Total value: $${(Number(pricePerToken) * Number(listingAmount)) / 1e6}`);

  // Mint USDC to buyer
  const buyAmount = 10n; // Buy 10 tokens
  const totalCost = pricePerToken * buyAmount;
  await usdc.mint(buyer.address, totalCost);
  console.log(`\nMinted $${Number(totalCost) / 1e6} USDC to buyer`);

  // Buyer approves marketplace to spend USDC
  await usdc.connect(buyer).approve(await marketplace.getAddress(), totalCost);
  console.log("Buyer approved marketplace to spend USDC");

  // Execute purchase
  console.log("\n--- Executing Purchase ---");
  const sellerBalanceBefore = await usdc.balanceOf(seller.address);
  const treasuryBalanceBefore = await usdc.balanceOf(deployer.address);

  await marketplace.connect(buyer).buy(listingId, buyAmount);

  const sellerBalanceAfter = await usdc.balanceOf(seller.address);
  const treasuryBalanceAfter = await usdc.balanceOf(deployer.address);
  const buyerTokenBalance = await propertyToken.balanceOf(buyer.address, propertyId);

  const sellerReceived = sellerBalanceAfter - sellerBalanceBefore;
  const feeCollected = treasuryBalanceAfter - treasuryBalanceBefore;

  console.log(`\nPurchase Results:`);
  console.log(`- Tokens bought: ${buyAmount}`);
  console.log(`- Total paid: $${Number(totalCost) / 1e6}`);
  console.log(`- Seller received: $${Number(sellerReceived) / 1e6}`);
  console.log(`- Platform fee (2.5%): $${Number(feeCollected) / 1e6}`);
  console.log(`- Buyer token balance: ${buyerTokenBalance}`);

  // Verify listing updated
  const listing = await marketplace.getListing(listingId);
  console.log(`\nListing after purchase:`);
  console.log(`- Remaining amount: ${listing.amount} tokens`);
  console.log(`- Active: ${listing.active}`);

  console.log("\n✅ Test completed successfully!");
  console.log("\nContract Addresses:");
  console.log(`USDC: ${await usdc.getAddress()}`);
  console.log(`PropertyToken: ${await propertyToken.getAddress()}`);
  console.log(`Marketplace: ${await marketplace.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
