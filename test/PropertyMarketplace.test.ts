import { expect } from "chai";
import hre from "hardhat";
import { PropertyToken, PropertyMarketplace, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("PropertyMarketplace", function () {
  let propertyToken: PropertyToken;
  let marketplace: PropertyMarketplace;
  let usdt: MockERC20;
  let usdc: MockERC20;

  let owner: HardhatEthersSigner;
  let admin: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  const PROPERTY_ID = 1;
  const PROPERTY_SUPPLY = 10000;
  const PROPERTY_URI = "ipfs://QmProperty1";
  const ROYALTY_FEE = 250; // 2.5%
  const MARKETPLACE_FEE = 250; // 2.5%

  const LISTING_AMOUNT = 1000;
  const PRICE_PER_TOKEN = ethers.parseUnits("100", 6); // 100 USDT (6 decimals)

  beforeEach(async function () {
    [owner, admin, seller, buyer, treasury] = await ethers.getSigners();

    // Deploy MockERC20 tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdt = await MockERC20Factory.deploy("Tether USD", "USDT", 6);
    usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);

    // Deploy PropertyToken
    const PropertyTokenFactory = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyTokenFactory.deploy(
      "https://api.buidingtok.com/metadata/",
      treasury.address
    );

    // Deploy PropertyMarketplace
    const MarketplaceFactory = await ethers.getContractFactory("PropertyMarketplace");
    marketplace = await MarketplaceFactory.deploy(
      await propertyToken.getAddress(),
      treasury.address,
      MARKETPLACE_FEE
    );

    // Setup roles
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await marketplace.grantRole(ADMIN_ROLE, admin.address);

    // Add accepted payment tokens
    await marketplace.connect(admin).addPaymentToken(await usdt.getAddress());
    await marketplace.connect(admin).addPaymentToken(await usdc.getAddress());

    // Create property and transfer tokens to seller
    await propertyToken.createProperty(PROPERTY_ID, PROPERTY_SUPPLY, PROPERTY_URI, ROYALTY_FEE);
    await propertyToken.connect(treasury).safeTransferFrom(
      treasury.address,
      seller.address,
      PROPERTY_ID,
      LISTING_AMOUNT,
      "0x"
    );

    // Mint payment tokens to buyer
    await usdt.mint(buyer.address, ethers.parseUnits("1000000", 6));
    await usdc.mint(buyer.address, ethers.parseUnits("1000000", 6));

    // Approve marketplace for property tokens
    await propertyToken.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
  });

  describe("Deployment", function () {
    it("should set the correct property token address", async function () {
      expect(await marketplace.propertyToken()).to.equal(await propertyToken.getAddress());
    });

    it("should set the correct treasury address", async function () {
      expect(await marketplace.treasury()).to.equal(treasury.address);
    });

    it("should set the correct marketplace fee", async function () {
      expect(await marketplace.marketplaceFee()).to.equal(MARKETPLACE_FEE);
    });

    it("should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await marketplace.DEFAULT_ADMIN_ROLE();
      expect(await marketplace.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Payment Token Management", function () {
    it("should add payment token", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New Token", "NEW", 18);
      await marketplace.connect(admin).addPaymentToken(await newToken.getAddress());
      expect(await marketplace.isPaymentTokenAccepted(await newToken.getAddress())).to.be.true;
    });

    it("should remove payment token", async function () {
      await marketplace.connect(admin).removePaymentToken(await usdt.getAddress());
      expect(await marketplace.isPaymentTokenAccepted(await usdt.getAddress())).to.be.false;
    });

    it("should emit PaymentTokenAdded event", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await expect(marketplace.connect(admin).addPaymentToken(await newToken.getAddress()))
        .to.emit(marketplace, "PaymentTokenAdded")
        .withArgs(await newToken.getAddress());
    });

    it("should emit PaymentTokenRemoved event", async function () {
      await expect(marketplace.connect(admin).removePaymentToken(await usdt.getAddress()))
        .to.emit(marketplace, "PaymentTokenRemoved")
        .withArgs(await usdt.getAddress());
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await expect(
        marketplace.connect(buyer).addPaymentToken(await newToken.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Listing Creation", function () {
    it("should create a listing", async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );

      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.propertyId).to.equal(PROPERTY_ID);
      expect(listing.amount).to.equal(LISTING_AMOUNT);
      expect(listing.pricePerToken).to.equal(PRICE_PER_TOKEN);
      expect(listing.paymentToken).to.equal(await usdt.getAddress());
      expect(listing.active).to.be.true;
    });

    it("should transfer tokens to marketplace", async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );

      expect(await propertyToken.balanceOf(await marketplace.getAddress(), PROPERTY_ID))
        .to.equal(LISTING_AMOUNT);
    });

    it("should emit ListingCreated event", async function () {
      await expect(
        marketplace.connect(seller).createListing(
          PROPERTY_ID,
          LISTING_AMOUNT,
          PRICE_PER_TOKEN,
          await usdt.getAddress()
        )
      )
        .to.emit(marketplace, "ListingCreated")
        .withArgs(1, seller.address, PROPERTY_ID, LISTING_AMOUNT, PRICE_PER_TOKEN, await usdt.getAddress());
    });

    it("should revert if payment token not accepted", async function () {
      const invalidToken = await (await ethers.getContractFactory("MockERC20")).deploy("Bad", "BAD", 18);
      await expect(
        marketplace.connect(seller).createListing(
          PROPERTY_ID,
          LISTING_AMOUNT,
          PRICE_PER_TOKEN,
          await invalidToken.getAddress()
        )
      ).to.be.revertedWithCustomError(marketplace, "PaymentTokenNotAccepted");
    });

    it("should revert if amount is zero", async function () {
      await expect(
        marketplace.connect(seller).createListing(
          PROPERTY_ID,
          0,
          PRICE_PER_TOKEN,
          await usdt.getAddress()
        )
      ).to.be.revertedWithCustomError(marketplace, "InvalidAmount");
    });

    it("should revert if price is zero", async function () {
      await expect(
        marketplace.connect(seller).createListing(
          PROPERTY_ID,
          LISTING_AMOUNT,
          0,
          await usdt.getAddress()
        )
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });
  });

  describe("Listing Cancellation", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );
    });

    it("should cancel listing", async function () {
      await marketplace.connect(seller).cancelListing(1);
      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.false;
    });

    it("should return tokens to seller", async function () {
      const balanceBefore = await propertyToken.balanceOf(seller.address, PROPERTY_ID);
      await marketplace.connect(seller).cancelListing(1);
      const balanceAfter = await propertyToken.balanceOf(seller.address, PROPERTY_ID);
      expect(balanceAfter - balanceBefore).to.equal(LISTING_AMOUNT);
    });

    it("should emit ListingCancelled event", async function () {
      await expect(marketplace.connect(seller).cancelListing(1))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(1, seller.address);
    });

    it("should revert if caller is not seller", async function () {
      await expect(
        marketplace.connect(buyer).cancelListing(1)
      ).to.be.revertedWithCustomError(marketplace, "NotListingSeller");
    });

    it("should revert if listing is not active", async function () {
      await marketplace.connect(seller).cancelListing(1);
      await expect(
        marketplace.connect(seller).cancelListing(1)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });
  });

  describe("Update Listing Price", function () {
    const NEW_PRICE = ethers.parseUnits("150", 6); // 150 USDT

    beforeEach(async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );
    });

    it("should update listing price", async function () {
      await marketplace.connect(seller).updateListingPrice(1, NEW_PRICE);
      const listing = await marketplace.getListing(1);
      expect(listing.pricePerToken).to.equal(NEW_PRICE);
    });

    it("should emit ListingPriceUpdated event", async function () {
      await expect(marketplace.connect(seller).updateListingPrice(1, NEW_PRICE))
        .to.emit(marketplace, "ListingPriceUpdated")
        .withArgs(1, PRICE_PER_TOKEN, NEW_PRICE);
    });

    it("should allow buying at new price", async function () {
      await marketplace.connect(seller).updateListingPrice(1, NEW_PRICE);
      await usdt.connect(buyer).approve(await marketplace.getAddress(), ethers.MaxUint256);
      await marketplace.connect(admin).approveKYC(buyer.address);

      const buyAmount = 100;
      const expectedTotal = NEW_PRICE * BigInt(buyAmount);
      const buyerBalanceBefore = await usdt.balanceOf(buyer.address);

      await marketplace.connect(buyer).buy(1, buyAmount);

      const buyerBalanceAfter = await usdt.balanceOf(buyer.address);
      expect(buyerBalanceBefore - buyerBalanceAfter).to.equal(expectedTotal);
    });

    it("should revert if caller is not seller", async function () {
      await expect(
        marketplace.connect(buyer).updateListingPrice(1, NEW_PRICE)
      ).to.be.revertedWithCustomError(marketplace, "NotListingSeller");
    });

    it("should revert if listing is not active", async function () {
      await marketplace.connect(seller).cancelListing(1);
      await expect(
        marketplace.connect(seller).updateListingPrice(1, NEW_PRICE)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should revert if new price is zero", async function () {
      await expect(
        marketplace.connect(seller).updateListingPrice(1, 0)
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });
  });

  describe("Buying", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );
      // Approve marketplace to spend buyer's USDT
      await usdt.connect(buyer).approve(await marketplace.getAddress(), ethers.MaxUint256);
      // Approve buyer's KYC for purchasing
      await marketplace.connect(admin).approveKYC(buyer.address);
    });

    it("should buy full listing", async function () {
      const totalPrice = PRICE_PER_TOKEN * BigInt(LISTING_AMOUNT);

      await marketplace.connect(buyer).buy(1, LISTING_AMOUNT);

      expect(await propertyToken.balanceOf(buyer.address, PROPERTY_ID)).to.equal(LISTING_AMOUNT);

      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.false;
    });

    it("should buy partial listing", async function () {
      const buyAmount = 500;
      await marketplace.connect(buyer).buy(1, buyAmount);

      expect(await propertyToken.balanceOf(buyer.address, PROPERTY_ID)).to.equal(buyAmount);

      const listing = await marketplace.getListing(1);
      expect(listing.amount).to.equal(LISTING_AMOUNT - buyAmount);
      expect(listing.active).to.be.true;
    });

    it("should transfer correct payment to seller", async function () {
      const buyAmount = 100;
      const totalPrice = PRICE_PER_TOKEN * BigInt(buyAmount);
      const marketplaceFeeAmount = (totalPrice * BigInt(MARKETPLACE_FEE)) / BigInt(10000);
      const sellerAmount = totalPrice - marketplaceFeeAmount;

      const sellerBalanceBefore = await usdt.balanceOf(seller.address);
      await marketplace.connect(buyer).buy(1, buyAmount);
      const sellerBalanceAfter = await usdt.balanceOf(seller.address);

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
    });

    it("should transfer marketplace fee to treasury", async function () {
      const buyAmount = 100;
      const totalPrice = PRICE_PER_TOKEN * BigInt(buyAmount);
      const marketplaceFeeAmount = (totalPrice * BigInt(MARKETPLACE_FEE)) / BigInt(10000);

      const treasuryBalanceBefore = await usdt.balanceOf(treasury.address);
      await marketplace.connect(buyer).buy(1, buyAmount);
      const treasuryBalanceAfter = await usdt.balanceOf(treasury.address);

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(marketplaceFeeAmount);
    });

    it("should emit Sale event", async function () {
      const buyAmount = 100;
      const totalPrice = PRICE_PER_TOKEN * BigInt(buyAmount);

      await expect(marketplace.connect(buyer).buy(1, buyAmount))
        .to.emit(marketplace, "Sale")
        .withArgs(1, buyer.address, buyAmount, totalPrice);
    });

    it("should revert if listing is not active", async function () {
      await marketplace.connect(seller).cancelListing(1);
      await expect(
        marketplace.connect(buyer).buy(1, 100)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should revert if amount exceeds listing", async function () {
      await expect(
        marketplace.connect(buyer).buy(1, LISTING_AMOUNT + 1)
      ).to.be.revertedWithCustomError(marketplace, "InsufficientListingAmount");
    });

    it("should revert if buyer has insufficient balance", async function () {
      // Burn buyer's USDT
      await usdt.burn(buyer.address, await usdt.balanceOf(buyer.address));
      await expect(
        marketplace.connect(buyer).buy(1, 100)
      ).to.be.reverted;
    });
  });

  describe("Buying with MATIC", function () {
    beforeEach(async function () {
      // Add native token (address(0)) as payment option
      await marketplace.connect(admin).addPaymentToken(ethers.ZeroAddress);

      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        ethers.parseEther("0.1"), // 0.1 MATIC per token
        ethers.ZeroAddress
      );

      // Approve buyer's KYC for purchasing
      await marketplace.connect(admin).approveKYC(buyer.address);
    });

    it("should buy with native token (MATIC)", async function () {
      const buyAmount = 100;
      const totalPrice = ethers.parseEther("0.1") * BigInt(buyAmount);

      await marketplace.connect(buyer).buy(1, buyAmount, { value: totalPrice });

      expect(await propertyToken.balanceOf(buyer.address, PROPERTY_ID)).to.equal(buyAmount);
    });

    it("should refund excess MATIC", async function () {
      const buyAmount = 100;
      const totalPrice = ethers.parseEther("0.1") * BigInt(buyAmount);
      const excessAmount = ethers.parseEther("1");

      const balanceBefore = await ethers.provider.getBalance(buyer.address);
      const tx = await marketplace.connect(buyer).buy(1, buyAmount, { value: totalPrice + excessAmount });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(buyer.address);

      // Balance should decrease by totalPrice + gas, not totalPrice + excess + gas
      const expectedBalance = balanceBefore - totalPrice - gasUsed;
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("should revert if insufficient MATIC sent", async function () {
      const buyAmount = 100;
      const insufficientAmount = ethers.parseEther("0.05") * BigInt(buyAmount);

      await expect(
        marketplace.connect(buyer).buy(1, buyAmount, { value: insufficientAmount })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientPayment");
    });
  });

  describe("Fee Management", function () {
    it("should update marketplace fee", async function () {
      const newFee = 500; // 5%
      await marketplace.connect(admin).setMarketplaceFee(newFee);
      expect(await marketplace.marketplaceFee()).to.equal(newFee);
    });

    it("should emit MarketplaceFeeUpdated event", async function () {
      const newFee = 500;
      await expect(marketplace.connect(admin).setMarketplaceFee(newFee))
        .to.emit(marketplace, "MarketplaceFeeUpdated")
        .withArgs(MARKETPLACE_FEE, newFee);
    });

    it("should revert if fee exceeds maximum", async function () {
      const maxFee = 1001; // 10.01%
      await expect(
        marketplace.connect(admin).setMarketplaceFee(maxFee)
      ).to.be.revertedWithCustomError(marketplace, "FeeTooHigh");
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      await expect(
        marketplace.connect(buyer).setMarketplaceFee(500)
      ).to.be.reverted;
    });
  });

  describe("Treasury Management", function () {
    it("should update treasury address", async function () {
      await marketplace.connect(admin).setTreasury(buyer.address);
      expect(await marketplace.treasury()).to.equal(buyer.address);
    });

    it("should emit TreasuryUpdated event", async function () {
      await expect(marketplace.connect(admin).setTreasury(buyer.address))
        .to.emit(marketplace, "TreasuryUpdated")
        .withArgs(treasury.address, buyer.address);
    });

    it("should revert if treasury is zero address", async function () {
      await expect(
        marketplace.connect(admin).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "InvalidAddress");
    });
  });

  describe("Pause Functionality", function () {
    it("should pause marketplace", async function () {
      await marketplace.connect(admin).pause();
      expect(await marketplace.paused()).to.be.true;
    });

    it("should unpause marketplace", async function () {
      await marketplace.connect(admin).pause();
      await marketplace.connect(admin).unpause();
      expect(await marketplace.paused()).to.be.false;
    });

    it("should revert createListing when paused", async function () {
      await marketplace.connect(admin).pause();
      await expect(
        marketplace.connect(seller).createListing(
          PROPERTY_ID,
          100,
          PRICE_PER_TOKEN,
          await usdt.getAddress()
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("should revert buy when paused", async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );
      await usdt.connect(buyer).approve(await marketplace.getAddress(), ethers.MaxUint256);
      await marketplace.connect(admin).approveKYC(buyer.address);

      await marketplace.connect(admin).pause();

      await expect(
        marketplace.connect(buyer).buy(1, 100)
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).createListing(
        PROPERTY_ID,
        LISTING_AMOUNT,
        PRICE_PER_TOKEN,
        await usdt.getAddress()
      );
    });

    it("should get listing by id", async function () {
      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(seller.address);
    });

    it("should get active listings count", async function () {
      expect(await marketplace.getActiveListingsCount()).to.equal(1);
    });

    it("should get seller listings", async function () {
      const listings = await marketplace.getSellerListings(seller.address);
      expect(listings.length).to.equal(1);
      expect(listings[0]).to.equal(1);
    });

    it("should get property listings", async function () {
      const listings = await marketplace.getPropertyListings(PROPERTY_ID);
      expect(listings.length).to.equal(1);
      expect(listings[0]).to.equal(1);
    });
  });

  describe("KYC Verification", function () {
    describe("KYC Approval", function () {
      it("should approve KYC for a wallet", async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
        expect(await marketplace.isKYCApproved(buyer.address)).to.be.true;
      });

      it("should emit KYCApproved event", async function () {
        const tx = await marketplace.connect(admin).approveKYC(buyer.address);
        const block = await ethers.provider.getBlock(tx.blockNumber!);

        await expect(tx)
          .to.emit(marketplace, "KYCApproved")
          .withArgs(buyer.address, admin.address, block!.timestamp);
      });

      it("should store correct KYC info", async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
        const kycInfo = await marketplace.getKYCInfo(buyer.address);

        expect(kycInfo.approved).to.be.true;
        expect(kycInfo.approvedBy).to.equal(admin.address);
        expect(kycInfo.approvedAt).to.be.gt(0);
        expect(kycInfo.revokedAt).to.equal(0);
      });

      it("should revert if wallet is zero address", async function () {
        await expect(
          marketplace.connect(admin).approveKYC(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(marketplace, "InvalidAddress");
      });

      it("should revert if KYC already approved", async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
        await expect(
          marketplace.connect(admin).approveKYC(buyer.address)
        ).to.be.revertedWithCustomError(marketplace, "KYCAlreadyApproved");
      });

      it("should revert if caller does not have ADMIN_ROLE", async function () {
        await expect(
          marketplace.connect(buyer).approveKYC(seller.address)
        ).to.be.reverted;
      });
    });

    describe("KYC Revocation", function () {
      beforeEach(async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
      });

      it("should revoke KYC for a wallet", async function () {
        await marketplace.connect(admin).revokeKYC(buyer.address);
        expect(await marketplace.isKYCApproved(buyer.address)).to.be.false;
      });

      it("should emit KYCRevoked event", async function () {
        const tx = await marketplace.connect(admin).revokeKYC(buyer.address);
        const block = await ethers.provider.getBlock(tx.blockNumber!);

        await expect(tx)
          .to.emit(marketplace, "KYCRevoked")
          .withArgs(buyer.address, admin.address, block!.timestamp);
      });

      it("should update revokedAt timestamp", async function () {
        await marketplace.connect(admin).revokeKYC(buyer.address);
        const kycInfo = await marketplace.getKYCInfo(buyer.address);

        expect(kycInfo.approved).to.be.false;
        expect(kycInfo.revokedAt).to.be.gt(0);
      });

      it("should revert if wallet is zero address", async function () {
        await expect(
          marketplace.connect(admin).revokeKYC(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(marketplace, "InvalidAddress");
      });

      it("should revert if KYC not found", async function () {
        await expect(
          marketplace.connect(admin).revokeKYC(seller.address)
        ).to.be.revertedWithCustomError(marketplace, "KYCNotFound");
      });

      it("should revert if caller does not have ADMIN_ROLE", async function () {
        await expect(
          marketplace.connect(buyer).revokeKYC(seller.address)
        ).to.be.reverted;
      });
    });

    describe("Batch KYC Approval", function () {
      it("should approve KYC for multiple wallets", async function () {
        await marketplace.connect(admin).approveKYCBatch([buyer.address, seller.address]);

        expect(await marketplace.isKYCApproved(buyer.address)).to.be.true;
        expect(await marketplace.isKYCApproved(seller.address)).to.be.true;
      });

      it("should emit KYCApproved events for each wallet", async function () {
        const tx = await marketplace.connect(admin).approveKYCBatch([buyer.address, seller.address]);
        const block = await ethers.provider.getBlock(tx.blockNumber!);

        await expect(tx)
          .to.emit(marketplace, "KYCApproved")
          .withArgs(buyer.address, admin.address, block!.timestamp);
        await expect(tx)
          .to.emit(marketplace, "KYCApproved")
          .withArgs(seller.address, admin.address, block!.timestamp);
      });

      it("should skip zero addresses in batch", async function () {
        await marketplace.connect(admin).approveKYCBatch([buyer.address, ethers.ZeroAddress]);
        expect(await marketplace.isKYCApproved(buyer.address)).to.be.true;
      });

      it("should skip already approved wallets in batch", async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
        // Should not revert even though buyer is already approved
        await marketplace.connect(admin).approveKYCBatch([buyer.address, seller.address]);
        expect(await marketplace.isKYCApproved(seller.address)).to.be.true;
      });

      it("should revert if caller does not have ADMIN_ROLE", async function () {
        await expect(
          marketplace.connect(buyer).approveKYCBatch([seller.address])
        ).to.be.reverted;
      });
    });

    describe("Buy with KYC requirement", function () {
      beforeEach(async function () {
        await marketplace.connect(seller).createListing(
          PROPERTY_ID,
          LISTING_AMOUNT,
          PRICE_PER_TOKEN,
          await usdt.getAddress()
        );
        await usdt.connect(buyer).approve(await marketplace.getAddress(), ethers.MaxUint256);
      });

      it("should allow buy when KYC is approved", async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
        await marketplace.connect(buyer).buy(1, 100);

        expect(await propertyToken.balanceOf(buyer.address, PROPERTY_ID)).to.equal(100);
      });

      it("should revert buy when KYC is not approved", async function () {
        await expect(
          marketplace.connect(buyer).buy(1, 100)
        ).to.be.revertedWithCustomError(marketplace, "KYCNotApproved");
      });

      it("should revert buy when KYC has been revoked", async function () {
        await marketplace.connect(admin).approveKYC(buyer.address);
        await marketplace.connect(admin).revokeKYC(buyer.address);

        await expect(
          marketplace.connect(buyer).buy(1, 100)
        ).to.be.revertedWithCustomError(marketplace, "KYCNotApproved");
      });
    });
  });
});

// Helper function to get current block timestamp
async function getTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}
