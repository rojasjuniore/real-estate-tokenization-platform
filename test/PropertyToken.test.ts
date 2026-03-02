import { expect } from "chai";
import hre from "hardhat";
import { PropertyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("PropertyToken", function () {
  let propertyToken: PropertyToken;
  let owner: HardhatEthersSigner;
  let admin: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  const PROPERTY_1_ID = 1;
  const PROPERTY_1_SUPPLY = 10000;
  const PROPERTY_1_URI = "ipfs://QmProperty1Metadata";
  const ROYALTY_FEE = 250; // 2.5%

  beforeEach(async function () {
    [owner, admin, minter, user1, user2, treasury] = await ethers.getSigners();

    const PropertyTokenFactory = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyTokenFactory.deploy(
      "https://api.buidingtok.com/metadata/",
      treasury.address
    );
    await propertyToken.waitForDeployment();

    // Grant roles
    await propertyToken.grantRole(ADMIN_ROLE, admin.address);
    await propertyToken.grantRole(MINTER_ROLE, minter.address);
    await propertyToken.grantRole(PAUSER_ROLE, admin.address);
  });

  describe("Deployment", function () {
    it("should set the correct base URI", async function () {
      expect(await propertyToken.uri(0)).to.equal("https://api.buidingtok.com/metadata/0");
    });

    it("should set the correct treasury address", async function () {
      expect(await propertyToken.treasury()).to.equal(treasury.address);
    });

    it("should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await propertyToken.DEFAULT_ADMIN_ROLE();
      expect(await propertyToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should grant ADMIN_ROLE to deployer", async function () {
      expect(await propertyToken.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should grant MINTER_ROLE to deployer", async function () {
      expect(await propertyToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("should grant PAUSER_ROLE to deployer", async function () {
      expect(await propertyToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Property Creation", function () {
    it("should create a new property with correct parameters", async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );

      const property = await propertyToken.getProperty(PROPERTY_1_ID);
      expect(property.totalSupply).to.equal(PROPERTY_1_SUPPLY);
      expect(property.uri).to.equal(PROPERTY_1_URI);
      expect(property.royaltyFee).to.equal(ROYALTY_FEE);
      expect(property.exists).to.be.true;
    });

    it("should mint initial supply to treasury", async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );

      expect(await propertyToken.balanceOf(treasury.address, PROPERTY_1_ID))
        .to.equal(PROPERTY_1_SUPPLY);
    });

    it("should emit PropertyCreated event", async function () {
      await expect(
        propertyToken.connect(minter).createProperty(
          PROPERTY_1_ID,
          PROPERTY_1_SUPPLY,
          PROPERTY_1_URI,
          ROYALTY_FEE
        )
      )
        .to.emit(propertyToken, "PropertyCreated")
        .withArgs(PROPERTY_1_ID, PROPERTY_1_SUPPLY, PROPERTY_1_URI, ROYALTY_FEE);
    });

    it("should revert if property already exists", async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );

      await expect(
        propertyToken.connect(minter).createProperty(
          PROPERTY_1_ID,
          PROPERTY_1_SUPPLY,
          PROPERTY_1_URI,
          ROYALTY_FEE
        )
      ).to.be.revertedWithCustomError(propertyToken, "PropertyAlreadyExists");
    });

    it("should revert if caller does not have MINTER_ROLE", async function () {
      await expect(
        propertyToken.connect(user1).createProperty(
          PROPERTY_1_ID,
          PROPERTY_1_SUPPLY,
          PROPERTY_1_URI,
          ROYALTY_FEE
        )
      ).to.be.reverted;
    });

    it("should revert if royalty fee exceeds maximum", async function () {
      const maxFee = 1001; // 10.01%
      await expect(
        propertyToken.connect(minter).createProperty(
          PROPERTY_1_ID,
          PROPERTY_1_SUPPLY,
          PROPERTY_1_URI,
          maxFee
        )
      ).to.be.revertedWithCustomError(propertyToken, "RoyaltyFeeTooHigh");
    });

    it("should revert if supply is zero", async function () {
      await expect(
        propertyToken.connect(minter).createProperty(
          PROPERTY_1_ID,
          0,
          PROPERTY_1_URI,
          ROYALTY_FEE
        )
      ).to.be.revertedWithCustomError(propertyToken, "InvalidSupply");
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );
      // Transfer some tokens to user1
      await propertyToken.connect(treasury).safeTransferFrom(
        treasury.address,
        user1.address,
        PROPERTY_1_ID,
        1000,
        "0x"
      );
    });

    it("should transfer tokens between users", async function () {
      await propertyToken.connect(user1).safeTransferFrom(
        user1.address,
        user2.address,
        PROPERTY_1_ID,
        500,
        "0x"
      );

      expect(await propertyToken.balanceOf(user1.address, PROPERTY_1_ID)).to.equal(500);
      expect(await propertyToken.balanceOf(user2.address, PROPERTY_1_ID)).to.equal(500);
    });

    it("should emit TransferSingle event", async function () {
      await expect(
        propertyToken.connect(user1).safeTransferFrom(
          user1.address,
          user2.address,
          PROPERTY_1_ID,
          500,
          "0x"
        )
      )
        .to.emit(propertyToken, "TransferSingle")
        .withArgs(user1.address, user1.address, user2.address, PROPERTY_1_ID, 500);
    });

    it("should revert transfer when paused", async function () {
      await propertyToken.connect(admin).pause();

      await expect(
        propertyToken.connect(user1).safeTransferFrom(
          user1.address,
          user2.address,
          PROPERTY_1_ID,
          500,
          "0x"
        )
      ).to.be.revertedWithCustomError(propertyToken, "EnforcedPause");
    });
  });

  describe("Batch Transfers", function () {
    const PROPERTY_2_ID = 2;
    const PROPERTY_2_SUPPLY = 5000;

    beforeEach(async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );
      await propertyToken.connect(minter).createProperty(
        PROPERTY_2_ID,
        PROPERTY_2_SUPPLY,
        "ipfs://QmProperty2",
        ROYALTY_FEE
      );

      await propertyToken.connect(treasury).safeBatchTransferFrom(
        treasury.address,
        user1.address,
        [PROPERTY_1_ID, PROPERTY_2_ID],
        [1000, 500],
        "0x"
      );
    });

    it("should batch transfer tokens", async function () {
      await propertyToken.connect(user1).safeBatchTransferFrom(
        user1.address,
        user2.address,
        [PROPERTY_1_ID, PROPERTY_2_ID],
        [500, 250],
        "0x"
      );

      expect(await propertyToken.balanceOf(user2.address, PROPERTY_1_ID)).to.equal(500);
      expect(await propertyToken.balanceOf(user2.address, PROPERTY_2_ID)).to.equal(250);
    });

    it("should emit TransferBatch event", async function () {
      await expect(
        propertyToken.connect(user1).safeBatchTransferFrom(
          user1.address,
          user2.address,
          [PROPERTY_1_ID, PROPERTY_2_ID],
          [500, 250],
          "0x"
        )
      )
        .to.emit(propertyToken, "TransferBatch");
    });
  });

  describe("Royalty Info (ERC-2981)", function () {
    beforeEach(async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );
    });

    it("should return correct royalty info", async function () {
      const salePrice = ethers.parseEther("100");
      const [receiver, royaltyAmount] = await propertyToken.royaltyInfo(
        PROPERTY_1_ID,
        salePrice
      );

      expect(receiver).to.equal(treasury.address);
      // 2.5% of 100 = 2.5
      expect(royaltyAmount).to.equal(ethers.parseEther("2.5"));
    });

    it("should support ERC-2981 interface", async function () {
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await propertyToken.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Pause Functionality", function () {
    it("should pause contract", async function () {
      await propertyToken.connect(admin).pause();
      expect(await propertyToken.paused()).to.be.true;
    });

    it("should unpause contract", async function () {
      await propertyToken.connect(admin).pause();
      await propertyToken.connect(admin).unpause();
      expect(await propertyToken.paused()).to.be.false;
    });

    it("should revert pause if caller does not have PAUSER_ROLE", async function () {
      await expect(propertyToken.connect(user1).pause()).to.be.reverted;
    });

    it("should emit Paused event", async function () {
      await expect(propertyToken.connect(admin).pause())
        .to.emit(propertyToken, "Paused")
        .withArgs(admin.address);
    });

    it("should emit Unpaused event", async function () {
      await propertyToken.connect(admin).pause();
      await expect(propertyToken.connect(admin).unpause())
        .to.emit(propertyToken, "Unpaused")
        .withArgs(admin.address);
    });
  });

  describe("URI Management", function () {
    beforeEach(async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );
    });

    it("should return property-specific URI", async function () {
      expect(await propertyToken.uri(PROPERTY_1_ID)).to.equal(PROPERTY_1_URI);
    });

    it("should update base URI", async function () {
      await propertyToken.connect(admin).setBaseURI("https://new.api.com/");
      expect(await propertyToken.uri(999)).to.equal("https://new.api.com/999");
    });

    it("should update property URI", async function () {
      const newUri = "ipfs://QmNewPropertyMetadata";
      await propertyToken.connect(admin).setPropertyURI(PROPERTY_1_ID, newUri);
      expect(await propertyToken.uri(PROPERTY_1_ID)).to.equal(newUri);
    });

    it("should emit URI event on property URI change", async function () {
      const newUri = "ipfs://QmNewPropertyMetadata";
      await expect(propertyToken.connect(admin).setPropertyURI(PROPERTY_1_ID, newUri))
        .to.emit(propertyToken, "URI")
        .withArgs(newUri, PROPERTY_1_ID);
    });

    it("should revert setBaseURI if caller does not have ADMIN_ROLE", async function () {
      await expect(
        propertyToken.connect(user1).setBaseURI("https://new.api.com/")
      ).to.be.reverted;
    });
  });

  describe("Treasury Management", function () {
    it("should update treasury address", async function () {
      await propertyToken.connect(admin).setTreasury(user1.address);
      expect(await propertyToken.treasury()).to.equal(user1.address);
    });

    it("should emit TreasuryUpdated event", async function () {
      await expect(propertyToken.connect(admin).setTreasury(user1.address))
        .to.emit(propertyToken, "TreasuryUpdated")
        .withArgs(treasury.address, user1.address);
    });

    it("should revert if treasury is zero address", async function () {
      await expect(
        propertyToken.connect(admin).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(propertyToken, "InvalidAddress");
    });

    it("should revert if caller does not have ADMIN_ROLE", async function () {
      await expect(
        propertyToken.connect(user1).setTreasury(user2.address)
      ).to.be.reverted;
    });
  });

  describe("Burn Functionality", function () {
    beforeEach(async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );
      await propertyToken.connect(treasury).safeTransferFrom(
        treasury.address,
        user1.address,
        PROPERTY_1_ID,
        1000,
        "0x"
      );
    });

    it("should allow user to burn own tokens", async function () {
      await propertyToken.connect(user1).burn(user1.address, PROPERTY_1_ID, 500);
      expect(await propertyToken.balanceOf(user1.address, PROPERTY_1_ID)).to.equal(500);
    });

    it("should allow approved operator to burn tokens", async function () {
      await propertyToken.connect(user1).setApprovalForAll(user2.address, true);
      await propertyToken.connect(user2).burn(user1.address, PROPERTY_1_ID, 500);
      expect(await propertyToken.balanceOf(user1.address, PROPERTY_1_ID)).to.equal(500);
    });

    it("should revert burn if not owner or approved", async function () {
      await expect(
        propertyToken.connect(user2).burn(user1.address, PROPERTY_1_ID, 500)
      ).to.be.revertedWithCustomError(propertyToken, "ERC1155MissingApprovalForAll");
    });
  });

  describe("Interface Support", function () {
    it("should support ERC1155 interface", async function () {
      const ERC1155_INTERFACE_ID = "0xd9b67a26";
      expect(await propertyToken.supportsInterface(ERC1155_INTERFACE_ID)).to.be.true;
    });

    it("should support ERC1155MetadataURI interface", async function () {
      const ERC1155_METADATA_URI_INTERFACE_ID = "0x0e89341c";
      expect(await propertyToken.supportsInterface(ERC1155_METADATA_URI_INTERFACE_ID)).to.be.true;
    });

    it("should support ERC165 interface", async function () {
      const ERC165_INTERFACE_ID = "0x01ffc9a7";
      expect(await propertyToken.supportsInterface(ERC165_INTERFACE_ID)).to.be.true;
    });

    it("should support AccessControl interface", async function () {
      const ACCESS_CONTROL_INTERFACE_ID = "0x7965db0b";
      expect(await propertyToken.supportsInterface(ACCESS_CONTROL_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Total Supply Tracking", function () {
    beforeEach(async function () {
      await propertyToken.connect(minter).createProperty(
        PROPERTY_1_ID,
        PROPERTY_1_SUPPLY,
        PROPERTY_1_URI,
        ROYALTY_FEE
      );
    });

    it("should track total supply correctly", async function () {
      expect(await propertyToken["totalSupply(uint256)"](PROPERTY_1_ID)).to.equal(PROPERTY_1_SUPPLY);
    });

    it("should track circulating supply after burns", async function () {
      await propertyToken.connect(treasury).burn(treasury.address, PROPERTY_1_ID, 1000);
      expect(await propertyToken["totalSupply(uint256)"](PROPERTY_1_ID)).to.equal(PROPERTY_1_SUPPLY - 1000);
    });
  });
});
