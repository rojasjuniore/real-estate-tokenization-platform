import { expect } from "chai";
import hre from "hardhat";
import { PaymentProcessor, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("PaymentProcessor", function () {
  let paymentProcessor: PaymentProcessor;
  let usdt: MockERC20;
  let usdc: MockERC20;

  let owner: HardhatEthersSigner;
  let admin: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  const USDT_DECIMALS = 6;
  const USDC_DECIMALS = 6;

  beforeEach(async function () {
    [owner, admin, user, recipient, treasury] = await ethers.getSigners();

    // Deploy MockERC20 tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdt = await MockERC20Factory.deploy("Tether USD", "USDT", USDT_DECIMALS);
    usdc = await MockERC20Factory.deploy("USD Coin", "USDC", USDC_DECIMALS);

    // Deploy PaymentProcessor
    const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
    paymentProcessor = await PaymentProcessorFactory.deploy(treasury.address);

    // Setup roles
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await paymentProcessor.grantRole(ADMIN_ROLE, admin.address);

    // Add payment tokens
    await paymentProcessor.connect(admin).addPaymentToken(
      await usdt.getAddress(),
      USDT_DECIMALS
    );
    await paymentProcessor.connect(admin).addPaymentToken(
      await usdc.getAddress(),
      USDC_DECIMALS
    );

    // Mint tokens to user
    await usdt.mint(user.address, ethers.parseUnits("100000", USDT_DECIMALS));
    await usdc.mint(user.address, ethers.parseUnits("100000", USDC_DECIMALS));
  });

  describe("Deployment", function () {
    it("should set the correct treasury address", async function () {
      expect(await paymentProcessor.treasury()).to.equal(treasury.address);
    });

    it("should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await paymentProcessor.DEFAULT_ADMIN_ROLE();
      expect(await paymentProcessor.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should revert if treasury is zero address", async function () {
      const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
      await expect(
        PaymentProcessorFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(paymentProcessor, "InvalidAddress");
    });
  });

  describe("Payment Token Management", function () {
    it("should add payment token with correct decimals", async function () {
      const tokenInfo = await paymentProcessor.getTokenInfo(await usdt.getAddress());
      expect(tokenInfo.active).to.be.true;
      expect(tokenInfo.decimals).to.equal(USDT_DECIMALS);
    });

    it("should check if token is accepted", async function () {
      expect(await paymentProcessor.isTokenAccepted(await usdt.getAddress())).to.be.true;
      expect(await paymentProcessor.isTokenAccepted(await usdc.getAddress())).to.be.true;
    });

    it("should accept native token (address(0))", async function () {
      await paymentProcessor.connect(admin).addPaymentToken(ethers.ZeroAddress, 18);
      expect(await paymentProcessor.isTokenAccepted(ethers.ZeroAddress)).to.be.true;
    });

    it("should remove payment token", async function () {
      await paymentProcessor.connect(admin).removePaymentToken(await usdt.getAddress());
      expect(await paymentProcessor.isTokenAccepted(await usdt.getAddress())).to.be.false;
    });

    it("should emit PaymentTokenAdded event", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await expect(paymentProcessor.connect(admin).addPaymentToken(await newToken.getAddress(), 18))
        .to.emit(paymentProcessor, "PaymentTokenAdded")
        .withArgs(await newToken.getAddress(), 18);
    });

    it("should emit PaymentTokenRemoved event", async function () {
      await expect(paymentProcessor.connect(admin).removePaymentToken(await usdt.getAddress()))
        .to.emit(paymentProcessor, "PaymentTokenRemoved")
        .withArgs(await usdt.getAddress());
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await expect(
        paymentProcessor.connect(user).addPaymentToken(await newToken.getAddress(), 18)
      ).to.be.reverted;
    });

    it("should get token decimals", async function () {
      expect(await paymentProcessor.getTokenDecimals(await usdt.getAddress())).to.equal(USDT_DECIMALS);
    });

    it("should revert getTokenDecimals for non-accepted token", async function () {
      const invalidToken = await (await ethers.getContractFactory("MockERC20")).deploy("Bad", "BAD", 18);
      await expect(
        paymentProcessor.getTokenDecimals(await invalidToken.getAddress())
      ).to.be.revertedWithCustomError(paymentProcessor, "TokenNotAccepted");
    });
  });

  describe("Process Payment (ERC20)", function () {
    const PAYMENT_AMOUNT = ethers.parseUnits("1000", USDT_DECIMALS);

    beforeEach(async function () {
      // Authorize the payment processor to be called by admin (simulating marketplace)
      const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
      await paymentProcessor.grantRole(OPERATOR_ROLE, admin.address);

      // User approves payment processor
      await usdt.connect(user).approve(await paymentProcessor.getAddress(), ethers.MaxUint256);

      // Approve KYC for user
      await paymentProcessor.connect(admin).approveKYC(user.address);
    });

    it("should process payment from user to recipient", async function () {
      const recipientBalanceBefore = await usdt.balanceOf(recipient.address);

      await paymentProcessor.connect(admin).processPayment(
        user.address,
        recipient.address,
        await usdt.getAddress(),
        PAYMENT_AMOUNT
      );

      const recipientBalanceAfter = await usdt.balanceOf(recipient.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(PAYMENT_AMOUNT);
    });

    it("should emit PaymentProcessed event", async function () {
      await expect(
        paymentProcessor.connect(admin).processPayment(
          user.address,
          recipient.address,
          await usdt.getAddress(),
          PAYMENT_AMOUNT
        )
      )
        .to.emit(paymentProcessor, "PaymentProcessed")
        .withArgs(user.address, recipient.address, await usdt.getAddress(), PAYMENT_AMOUNT);
    });

    it("should revert if token not accepted", async function () {
      const invalidToken = await (await ethers.getContractFactory("MockERC20")).deploy("Bad", "BAD", 18);
      await expect(
        paymentProcessor.connect(admin).processPayment(
          user.address,
          recipient.address,
          await invalidToken.getAddress(),
          PAYMENT_AMOUNT
        )
      ).to.be.revertedWithCustomError(paymentProcessor, "TokenNotAccepted");
    });

    it("should revert if caller is not operator", async function () {
      await expect(
        paymentProcessor.connect(user).processPayment(
          user.address,
          recipient.address,
          await usdt.getAddress(),
          PAYMENT_AMOUNT
        )
      ).to.be.reverted;
    });

    it("should revert if amount is zero", async function () {
      await expect(
        paymentProcessor.connect(admin).processPayment(
          user.address,
          recipient.address,
          await usdt.getAddress(),
          0
        )
      ).to.be.revertedWithCustomError(paymentProcessor, "InvalidAmount");
    });
  });

  describe("Process Payment With Commission", function () {
    const PAYMENT_AMOUNT = ethers.parseUnits("1000", USDT_DECIMALS);
    const COMMISSION_PERCENT = 250; // 2.5%

    beforeEach(async function () {
      const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
      await paymentProcessor.grantRole(OPERATOR_ROLE, admin.address);
      await usdt.connect(user).approve(await paymentProcessor.getAddress(), ethers.MaxUint256);
      // Approve KYC for user
      await paymentProcessor.connect(admin).approveKYC(user.address);
    });

    it("should process payment with commission", async function () {
      const expectedCommission = (PAYMENT_AMOUNT * BigInt(COMMISSION_PERCENT)) / BigInt(10000);
      const expectedSellerAmount = PAYMENT_AMOUNT - expectedCommission;

      const recipientBalanceBefore = await usdt.balanceOf(recipient.address);
      const treasuryBalanceBefore = await usdt.balanceOf(treasury.address);

      await paymentProcessor.connect(admin).processPaymentWithCommission(
        user.address,
        recipient.address,
        await usdt.getAddress(),
        PAYMENT_AMOUNT,
        COMMISSION_PERCENT
      );

      const recipientBalanceAfter = await usdt.balanceOf(recipient.address);
      const treasuryBalanceAfter = await usdt.balanceOf(treasury.address);

      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedSellerAmount);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedCommission);
    });

    it("should return correct amounts", async function () {
      const result = await paymentProcessor.connect(admin).processPaymentWithCommission.staticCall(
        user.address,
        recipient.address,
        await usdt.getAddress(),
        PAYMENT_AMOUNT,
        COMMISSION_PERCENT
      );

      const expectedCommission = (PAYMENT_AMOUNT * BigInt(COMMISSION_PERCENT)) / BigInt(10000);
      const expectedSellerAmount = PAYMENT_AMOUNT - expectedCommission;

      expect(result.sellerAmount).to.equal(expectedSellerAmount);
      expect(result.commissionAmount).to.equal(expectedCommission);
    });

    it("should emit PaymentProcessed and CommissionProcessed events", async function () {
      const expectedCommission = (PAYMENT_AMOUNT * BigInt(COMMISSION_PERCENT)) / BigInt(10000);
      const expectedSellerAmount = PAYMENT_AMOUNT - expectedCommission;

      await expect(
        paymentProcessor.connect(admin).processPaymentWithCommission(
          user.address,
          recipient.address,
          await usdt.getAddress(),
          PAYMENT_AMOUNT,
          COMMISSION_PERCENT
        )
      )
        .to.emit(paymentProcessor, "PaymentProcessed")
        .withArgs(user.address, recipient.address, await usdt.getAddress(), expectedSellerAmount)
        .and.to.emit(paymentProcessor, "CommissionProcessed")
        .withArgs(treasury.address, await usdt.getAddress(), expectedCommission);
    });

    it("should handle zero commission", async function () {
      const recipientBalanceBefore = await usdt.balanceOf(recipient.address);
      const treasuryBalanceBefore = await usdt.balanceOf(treasury.address);

      await paymentProcessor.connect(admin).processPaymentWithCommission(
        user.address,
        recipient.address,
        await usdt.getAddress(),
        PAYMENT_AMOUNT,
        0
      );

      const recipientBalanceAfter = await usdt.balanceOf(recipient.address);
      const treasuryBalanceAfter = await usdt.balanceOf(treasury.address);

      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(PAYMENT_AMOUNT);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(0);
    });

    it("should revert if commission exceeds max", async function () {
      await expect(
        paymentProcessor.connect(admin).processPaymentWithCommission(
          user.address,
          recipient.address,
          await usdt.getAddress(),
          PAYMENT_AMOUNT,
          1001 // > 10%
        )
      ).to.be.revertedWithCustomError(paymentProcessor, "CommissionTooHigh");
    });
  });

  describe("Process Native Payment", function () {
    const PAYMENT_AMOUNT = ethers.parseEther("1");

    beforeEach(async function () {
      const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
      await paymentProcessor.grantRole(OPERATOR_ROLE, admin.address);
      await paymentProcessor.connect(admin).addPaymentToken(ethers.ZeroAddress, 18);
      // Approve KYC for user
      await paymentProcessor.connect(admin).approveKYC(user.address);
    });

    it("should process native token payment", async function () {
      const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

      await paymentProcessor.connect(admin).processNativePayment(
        user.address,
        recipient.address,
        PAYMENT_AMOUNT,
        { value: PAYMENT_AMOUNT }
      );

      const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(PAYMENT_AMOUNT);
    });

    it("should process native payment with commission", async function () {
      const COMMISSION_PERCENT = 250;
      const expectedCommission = (PAYMENT_AMOUNT * BigInt(COMMISSION_PERCENT)) / BigInt(10000);
      const expectedRecipientAmount = PAYMENT_AMOUNT - expectedCommission;

      const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await paymentProcessor.connect(admin).processNativePaymentWithCommission(
        user.address,
        recipient.address,
        COMMISSION_PERCENT,
        { value: PAYMENT_AMOUNT }
      );

      const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedRecipientAmount);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedCommission);
    });

    it("should revert if native token not accepted", async function () {
      await paymentProcessor.connect(admin).removePaymentToken(ethers.ZeroAddress);

      await expect(
        paymentProcessor.connect(admin).processNativePayment(
          user.address,
          recipient.address,
          PAYMENT_AMOUNT,
          { value: PAYMENT_AMOUNT }
        )
      ).to.be.revertedWithCustomError(paymentProcessor, "TokenNotAccepted");
    });

    it("should revert if insufficient value sent", async function () {
      await expect(
        paymentProcessor.connect(admin).processNativePayment(
          user.address,
          recipient.address,
          PAYMENT_AMOUNT,
          { value: PAYMENT_AMOUNT - BigInt(1) }
        )
      ).to.be.revertedWithCustomError(paymentProcessor, "InsufficientPayment");
    });

    it("should refund excess value", async function () {
      const excess = ethers.parseEther("0.5");
      const adminBalanceBefore = await ethers.provider.getBalance(admin.address);

      const tx = await paymentProcessor.connect(admin).processNativePayment(
        user.address,
        recipient.address,
        PAYMENT_AMOUNT,
        { value: PAYMENT_AMOUNT + excess }
      );
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const adminBalanceAfter = await ethers.provider.getBalance(admin.address);
      const expectedBalance = adminBalanceBefore - PAYMENT_AMOUNT - gasUsed;

      expect(adminBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
  });

  describe("Treasury Management", function () {
    it("should update treasury address", async function () {
      await paymentProcessor.connect(admin).setTreasury(user.address);
      expect(await paymentProcessor.treasury()).to.equal(user.address);
    });

    it("should emit TreasuryUpdated event", async function () {
      await expect(paymentProcessor.connect(admin).setTreasury(user.address))
        .to.emit(paymentProcessor, "TreasuryUpdated")
        .withArgs(treasury.address, user.address);
    });

    it("should revert if new treasury is zero address", async function () {
      await expect(
        paymentProcessor.connect(admin).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(paymentProcessor, "InvalidAddress");
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      await expect(
        paymentProcessor.connect(user).setTreasury(user.address)
      ).to.be.reverted;
    });
  });

  describe("Utility Functions", function () {
    it("should calculate commission correctly", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const percent = 250; // 2.5%
      const expected = ethers.parseUnits("25", 6);

      expect(await paymentProcessor.calculateCommission(amount, percent)).to.equal(expected);
    });

    it("should normalize amount between different decimals", async function () {
      // 1000 USDT (6 decimals) to 18 decimals
      const amount6 = ethers.parseUnits("1000", 6);
      const normalized = await paymentProcessor.normalizeAmount(amount6, 6, 18);
      expect(normalized).to.equal(ethers.parseUnits("1000", 18));
    });

    it("should denormalize amount between different decimals", async function () {
      // 1000 (18 decimals) to 6 decimals
      const amount18 = ethers.parseUnits("1000", 18);
      const denormalized = await paymentProcessor.denormalizeAmount(amount18, 18, 6);
      expect(denormalized).to.equal(ethers.parseUnits("1000", 6));
    });
  });

  describe("Supported Tokens View", function () {
    it("should return list of supported tokens", async function () {
      const tokens = await paymentProcessor.getSupportedTokens();
      expect(tokens.length).to.equal(2);
      expect(tokens).to.include(await usdt.getAddress());
      expect(tokens).to.include(await usdc.getAddress());
    });

    it("should update list when token is added", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New", "NEW", 18);
      await paymentProcessor.connect(admin).addPaymentToken(await newToken.getAddress(), 18);

      const tokens = await paymentProcessor.getSupportedTokens();
      expect(tokens.length).to.equal(3);
    });
  });

  describe("KYC Verification", function () {
    describe("KYC Approval", function () {
      it("should approve KYC for a wallet", async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);
        expect(await paymentProcessor.isKYCApproved(user.address)).to.be.true;
      });

      it("should emit KYCApproved event", async function () {
        const tx = await paymentProcessor.connect(admin).approveKYC(user.address);
        const block = await ethers.provider.getBlock(tx.blockNumber!);

        await expect(tx)
          .to.emit(paymentProcessor, "KYCApproved")
          .withArgs(user.address, admin.address, block!.timestamp);
      });

      it("should store correct KYC info", async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);
        const kycInfo = await paymentProcessor.getKYCInfo(user.address);

        expect(kycInfo.approved).to.be.true;
        expect(kycInfo.approvedBy).to.equal(admin.address);
        expect(kycInfo.approvedAt).to.be.gt(0);
        expect(kycInfo.revokedAt).to.equal(0);
      });

      it("should revert if wallet is zero address", async function () {
        await expect(
          paymentProcessor.connect(admin).approveKYC(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(paymentProcessor, "InvalidAddress");
      });

      it("should revert if KYC already approved", async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);
        await expect(
          paymentProcessor.connect(admin).approveKYC(user.address)
        ).to.be.revertedWithCustomError(paymentProcessor, "KYCAlreadyApproved");
      });

      it("should revert if caller does not have ADMIN_ROLE", async function () {
        await expect(
          paymentProcessor.connect(user).approveKYC(recipient.address)
        ).to.be.reverted;
      });
    });

    describe("KYC Revocation", function () {
      beforeEach(async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);
      });

      it("should revoke KYC for a wallet", async function () {
        await paymentProcessor.connect(admin).revokeKYC(user.address);
        expect(await paymentProcessor.isKYCApproved(user.address)).to.be.false;
      });

      it("should emit KYCRevoked event", async function () {
        const tx = await paymentProcessor.connect(admin).revokeKYC(user.address);
        const block = await ethers.provider.getBlock(tx.blockNumber!);

        await expect(tx)
          .to.emit(paymentProcessor, "KYCRevoked")
          .withArgs(user.address, admin.address, block!.timestamp);
      });

      it("should update revokedAt timestamp", async function () {
        await paymentProcessor.connect(admin).revokeKYC(user.address);
        const kycInfo = await paymentProcessor.getKYCInfo(user.address);

        expect(kycInfo.approved).to.be.false;
        expect(kycInfo.revokedAt).to.be.gt(0);
      });

      it("should revert if wallet is zero address", async function () {
        await expect(
          paymentProcessor.connect(admin).revokeKYC(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(paymentProcessor, "InvalidAddress");
      });

      it("should revert if KYC not found", async function () {
        await expect(
          paymentProcessor.connect(admin).revokeKYC(recipient.address)
        ).to.be.revertedWithCustomError(paymentProcessor, "KYCNotFound");
      });
    });

    describe("Batch KYC Approval", function () {
      it("should approve KYC for multiple wallets", async function () {
        await paymentProcessor.connect(admin).approveKYCBatch([user.address, recipient.address]);

        expect(await paymentProcessor.isKYCApproved(user.address)).to.be.true;
        expect(await paymentProcessor.isKYCApproved(recipient.address)).to.be.true;
      });

      it("should skip zero addresses in batch", async function () {
        await paymentProcessor.connect(admin).approveKYCBatch([user.address, ethers.ZeroAddress]);
        expect(await paymentProcessor.isKYCApproved(user.address)).to.be.true;
      });

      it("should skip already approved wallets in batch", async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);
        await paymentProcessor.connect(admin).approveKYCBatch([user.address, recipient.address]);
        expect(await paymentProcessor.isKYCApproved(recipient.address)).to.be.true;
      });
    });

    describe("Payment with KYC requirement", function () {
      const PAYMENT_AMOUNT = ethers.parseUnits("1000", USDT_DECIMALS);

      beforeEach(async function () {
        const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
        await paymentProcessor.grantRole(OPERATOR_ROLE, admin.address);
        await usdt.connect(user).approve(await paymentProcessor.getAddress(), ethers.MaxUint256);
      });

      it("should allow payment when KYC is approved", async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);

        await paymentProcessor.connect(admin).processPayment(
          user.address,
          recipient.address,
          await usdt.getAddress(),
          PAYMENT_AMOUNT
        );

        expect(await usdt.balanceOf(recipient.address)).to.equal(PAYMENT_AMOUNT);
      });

      it("should revert payment when KYC is not approved", async function () {
        await expect(
          paymentProcessor.connect(admin).processPayment(
            user.address,
            recipient.address,
            await usdt.getAddress(),
            PAYMENT_AMOUNT
          )
        ).to.be.revertedWithCustomError(paymentProcessor, "KYCNotApproved");
      });

      it("should revert payment when KYC has been revoked", async function () {
        await paymentProcessor.connect(admin).approveKYC(user.address);
        await paymentProcessor.connect(admin).revokeKYC(user.address);

        await expect(
          paymentProcessor.connect(admin).processPayment(
            user.address,
            recipient.address,
            await usdt.getAddress(),
            PAYMENT_AMOUNT
          )
        ).to.be.revertedWithCustomError(paymentProcessor, "KYCNotApproved");
      });
    });
  });
});
