import { expect } from "chai";
import hre from "hardhat";
import { PropertyToken, RoyaltyDistributor, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("RoyaltyDistributor", function () {
  let propertyToken: PropertyToken;
  let royaltyDistributor: RoyaltyDistributor;
  let usdt: MockERC20;
  let usdc: MockERC20;

  let owner: HardhatEthersSigner;
  let admin: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let holder1: HardhatEthersSigner;
  let holder2: HardhatEthersSigner;
  let holder3: HardhatEthersSigner;

  const PROPERTY_ID = 1;
  const PROPERTY_SUPPLY = 10000;
  const PROPERTY_URI = "ipfs://QmProperty1";
  const ROYALTY_FEE = 250;

  // Distribution amounts
  const DISTRIBUTION_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 USDT

  beforeEach(async function () {
    [owner, admin, treasury, holder1, holder2, holder3] = await ethers.getSigners();

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

    // Deploy RoyaltyDistributor
    const RoyaltyDistributorFactory = await ethers.getContractFactory("RoyaltyDistributor");
    royaltyDistributor = await RoyaltyDistributorFactory.deploy(
      await propertyToken.getAddress()
    );

    // Setup roles
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await royaltyDistributor.grantRole(ADMIN_ROLE, admin.address);

    // Add accepted payment tokens
    await royaltyDistributor.connect(admin).addPaymentToken(await usdt.getAddress());
    await royaltyDistributor.connect(admin).addPaymentToken(await usdc.getAddress());

    // Create property and distribute tokens to holders
    await propertyToken.createProperty(PROPERTY_ID, PROPERTY_SUPPLY, PROPERTY_URI, ROYALTY_FEE);

    // Treasury transfers tokens to holders
    // holder1: 5000 (50%), holder2: 3000 (30%), holder3: 2000 (20%)
    await propertyToken.connect(treasury).safeTransferFrom(
      treasury.address,
      holder1.address,
      PROPERTY_ID,
      5000,
      "0x"
    );
    await propertyToken.connect(treasury).safeTransferFrom(
      treasury.address,
      holder2.address,
      PROPERTY_ID,
      3000,
      "0x"
    );
    await propertyToken.connect(treasury).safeTransferFrom(
      treasury.address,
      holder3.address,
      PROPERTY_ID,
      2000,
      "0x"
    );

    // Mint USDT to admin for distributions
    await usdt.mint(admin.address, ethers.parseUnits("1000000", 6));
    await usdt.connect(admin).approve(await royaltyDistributor.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("should set the correct property token address", async function () {
      expect(await royaltyDistributor.propertyToken()).to.equal(await propertyToken.getAddress());
    });

    it("should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await royaltyDistributor.DEFAULT_ADMIN_ROLE();
      expect(await royaltyDistributor.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Payment Token Management", function () {
    it("should add payment token", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await royaltyDistributor.connect(admin).addPaymentToken(await newToken.getAddress());
      expect(await royaltyDistributor.isPaymentTokenAccepted(await newToken.getAddress())).to.be.true;
    });

    it("should remove payment token", async function () {
      await royaltyDistributor.connect(admin).removePaymentToken(await usdt.getAddress());
      expect(await royaltyDistributor.isPaymentTokenAccepted(await usdt.getAddress())).to.be.false;
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await expect(
        royaltyDistributor.connect(holder1).addPaymentToken(await newToken.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Distribution Creation", function () {
    it("should create a distribution", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      const distribution = await royaltyDistributor.getDistribution(1);
      expect(distribution.propertyId).to.equal(PROPERTY_ID);
      expect(distribution.totalAmount).to.equal(DISTRIBUTION_AMOUNT);
      expect(distribution.paymentToken).to.equal(await usdt.getAddress());
      expect(distribution.totalSupplySnapshot).to.equal(PROPERTY_SUPPLY);
    });

    it("should transfer tokens from admin to contract", async function () {
      const balanceBefore = await usdt.balanceOf(await royaltyDistributor.getAddress());

      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      const balanceAfter = await usdt.balanceOf(await royaltyDistributor.getAddress());
      expect(balanceAfter - balanceBefore).to.equal(DISTRIBUTION_AMOUNT);
    });

    it("should emit DistributionCreated event", async function () {
      await expect(
        royaltyDistributor.connect(admin).createDistribution(
          PROPERTY_ID,
          DISTRIBUTION_AMOUNT,
          await usdt.getAddress()
        )
      )
        .to.emit(royaltyDistributor, "DistributionCreated")
        .withArgs(1, PROPERTY_ID, DISTRIBUTION_AMOUNT, await usdt.getAddress());
    });

    it("should increment distribution counter", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      expect(await royaltyDistributor.distributionCount()).to.equal(2);
    });

    it("should revert if payment token not accepted", async function () {
      const invalidToken = await (await ethers.getContractFactory("MockERC20")).deploy("Bad", "BAD", 18);
      await expect(
        royaltyDistributor.connect(admin).createDistribution(
          PROPERTY_ID,
          DISTRIBUTION_AMOUNT,
          await invalidToken.getAddress()
        )
      ).to.be.revertedWithCustomError(royaltyDistributor, "PaymentTokenNotAccepted");
    });

    it("should revert if amount is zero", async function () {
      await expect(
        royaltyDistributor.connect(admin).createDistribution(
          PROPERTY_ID,
          0,
          await usdt.getAddress()
        )
      ).to.be.revertedWithCustomError(royaltyDistributor, "InvalidAmount");
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      await expect(
        royaltyDistributor.connect(holder1).createDistribution(
          PROPERTY_ID,
          DISTRIBUTION_AMOUNT,
          await usdt.getAddress()
        )
      ).to.be.reverted;
    });
  });

  describe("Claiming Royalties", function () {
    beforeEach(async function () {
      // Create a distribution
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );
    });

    it("should allow holder to claim their share", async function () {
      // holder1 has 50% (5000/10000)
      const expectedAmount = DISTRIBUTION_AMOUNT / BigInt(2); // 5000 USDT

      const balanceBefore = await usdt.balanceOf(holder1.address);
      await royaltyDistributor.connect(holder1).claim(1);
      const balanceAfter = await usdt.balanceOf(holder1.address);

      expect(balanceAfter - balanceBefore).to.equal(expectedAmount);
    });

    it("should calculate correct amounts for different holders", async function () {
      // holder1: 50%, holder2: 30%, holder3: 20%
      const holder1Expected = DISTRIBUTION_AMOUNT * BigInt(5000) / BigInt(10000); // 5000 USDT
      const holder2Expected = DISTRIBUTION_AMOUNT * BigInt(3000) / BigInt(10000); // 3000 USDT
      const holder3Expected = DISTRIBUTION_AMOUNT * BigInt(2000) / BigInt(10000); // 2000 USDT

      await royaltyDistributor.connect(holder1).claim(1);
      await royaltyDistributor.connect(holder2).claim(1);
      await royaltyDistributor.connect(holder3).claim(1);

      expect(await usdt.balanceOf(holder1.address)).to.equal(holder1Expected);
      expect(await usdt.balanceOf(holder2.address)).to.equal(holder2Expected);
      expect(await usdt.balanceOf(holder3.address)).to.equal(holder3Expected);
    });

    it("should emit RoyaltyClaimed event", async function () {
      const expectedAmount = DISTRIBUTION_AMOUNT / BigInt(2);

      await expect(royaltyDistributor.connect(holder1).claim(1))
        .to.emit(royaltyDistributor, "RoyaltyClaimed")
        .withArgs(1, holder1.address, expectedAmount);
    });

    it("should mark distribution as claimed for user", async function () {
      await royaltyDistributor.connect(holder1).claim(1);
      expect(await royaltyDistributor.hasClaimed(1, holder1.address)).to.be.true;
    });

    it("should revert if already claimed", async function () {
      await royaltyDistributor.connect(holder1).claim(1);
      await expect(
        royaltyDistributor.connect(holder1).claim(1)
      ).to.be.revertedWithCustomError(royaltyDistributor, "AlreadyClaimed");
    });

    it("should revert if user has no tokens", async function () {
      await expect(
        royaltyDistributor.connect(admin).claim(1)
      ).to.be.revertedWithCustomError(royaltyDistributor, "NoTokensHeld");
    });

    it("should revert if distribution does not exist", async function () {
      await expect(
        royaltyDistributor.connect(holder1).claim(999)
      ).to.be.revertedWithCustomError(royaltyDistributor, "DistributionNotFound");
    });
  });

  describe("Claimable Amount Calculation", function () {
    beforeEach(async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );
    });

    it("should return correct claimable amount", async function () {
      const claimable = await royaltyDistributor.getClaimableAmount(1, holder1.address);
      const expected = DISTRIBUTION_AMOUNT * BigInt(5000) / BigInt(10000);
      expect(claimable).to.equal(expected);
    });

    it("should return zero if already claimed", async function () {
      await royaltyDistributor.connect(holder1).claim(1);
      const claimable = await royaltyDistributor.getClaimableAmount(1, holder1.address);
      expect(claimable).to.equal(0);
    });

    it("should return zero if user has no tokens", async function () {
      const claimable = await royaltyDistributor.getClaimableAmount(1, admin.address);
      expect(claimable).to.equal(0);
    });
  });

  describe("Multiple Distributions", function () {
    it("should handle multiple distributions for same property", async function () {
      // First distribution: 10,000 USDT
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      // Second distribution: 5,000 USDT
      const secondAmount = ethers.parseUnits("5000", 6);
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        secondAmount,
        await usdt.getAddress()
      );

      // holder1 claims both
      const expected1 = DISTRIBUTION_AMOUNT * BigInt(5000) / BigInt(10000);
      const expected2 = secondAmount * BigInt(5000) / BigInt(10000);

      await royaltyDistributor.connect(holder1).claim(1);
      await royaltyDistributor.connect(holder1).claim(2);

      expect(await usdt.balanceOf(holder1.address)).to.equal(expected1 + expected2);
    });

    it("should track claimed status per distribution", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      await royaltyDistributor.connect(holder1).claim(1);

      expect(await royaltyDistributor.hasClaimed(1, holder1.address)).to.be.true;
      expect(await royaltyDistributor.hasClaimed(2, holder1.address)).to.be.false;
    });
  });

  describe("Multiple Properties", function () {
    const PROPERTY_ID_2 = 2;

    beforeEach(async function () {
      // Create second property
      await propertyToken.createProperty(PROPERTY_ID_2, 5000, "ipfs://QmProperty2", 300);

      // Distribute property 2 tokens: holder1 gets all 5000
      await propertyToken.connect(treasury).safeTransferFrom(
        treasury.address,
        holder1.address,
        PROPERTY_ID_2,
        5000,
        "0x"
      );
    });

    it("should handle distributions for different properties", async function () {
      // Distribution for property 1
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      // Distribution for property 2
      const prop2Amount = ethers.parseUnits("5000", 6);
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID_2,
        prop2Amount,
        await usdt.getAddress()
      );

      // holder1 has 50% of property 1 and 100% of property 2
      const dist1 = await royaltyDistributor.getDistribution(1);
      const dist2 = await royaltyDistributor.getDistribution(2);

      expect(dist1.propertyId).to.equal(PROPERTY_ID);
      expect(dist2.propertyId).to.equal(PROPERTY_ID_2);
    });

    it("should calculate correct amounts per property", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      const prop2Amount = ethers.parseUnits("5000", 6);
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID_2,
        prop2Amount,
        await usdt.getAddress()
      );

      // holder1: 50% of property 1 (5000 USDT) + 100% of property 2 (5000 USDT)
      const claimable1 = await royaltyDistributor.getClaimableAmount(1, holder1.address);
      const claimable2 = await royaltyDistributor.getClaimableAmount(2, holder1.address);

      expect(claimable1).to.equal(ethers.parseUnits("5000", 6)); // 50% of 10000
      expect(claimable2).to.equal(ethers.parseUnits("5000", 6)); // 100% of 5000
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );
    });

    it("should get distribution by id", async function () {
      const distribution = await royaltyDistributor.getDistribution(1);
      expect(distribution.propertyId).to.equal(PROPERTY_ID);
    });

    it("should get distributions for property", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      const distributions = await royaltyDistributor.getPropertyDistributions(PROPERTY_ID);
      expect(distributions.length).to.equal(2);
    });

    it("should get user's unclaimed distributions", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );

      const unclaimed = await royaltyDistributor.getUnclaimedDistributions(holder1.address, PROPERTY_ID);
      expect(unclaimed.length).to.equal(2);

      await royaltyDistributor.connect(holder1).claim(1);

      const unclaimedAfter = await royaltyDistributor.getUnclaimedDistributions(holder1.address, PROPERTY_ID);
      expect(unclaimedAfter.length).to.equal(1);
    });
  });

  describe("Pause Functionality", function () {
    it("should pause contract", async function () {
      await royaltyDistributor.connect(admin).pause();
      expect(await royaltyDistributor.paused()).to.be.true;
    });

    it("should unpause contract", async function () {
      await royaltyDistributor.connect(admin).pause();
      await royaltyDistributor.connect(admin).unpause();
      expect(await royaltyDistributor.paused()).to.be.false;
    });

    it("should revert createDistribution when paused", async function () {
      await royaltyDistributor.connect(admin).pause();
      await expect(
        royaltyDistributor.connect(admin).createDistribution(
          PROPERTY_ID,
          DISTRIBUTION_AMOUNT,
          await usdt.getAddress()
        )
      ).to.be.revertedWithCustomError(royaltyDistributor, "EnforcedPause");
    });

    it("should revert claim when paused", async function () {
      await royaltyDistributor.connect(admin).createDistribution(
        PROPERTY_ID,
        DISTRIBUTION_AMOUNT,
        await usdt.getAddress()
      );
      await royaltyDistributor.connect(admin).pause();

      await expect(
        royaltyDistributor.connect(holder1).claim(1)
      ).to.be.revertedWithCustomError(royaltyDistributor, "EnforcedPause");
    });
  });
});
