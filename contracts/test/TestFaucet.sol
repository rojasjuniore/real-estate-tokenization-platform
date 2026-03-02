// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TestFaucet
 * @dev Faucet contract for QA testing on Polygon Amoy testnet
 * Allows users to claim test USDC and PropertyTokens for testing the marketplace
 */
contract TestFaucet is Ownable, ReentrancyGuard {
    IERC20 public testUsdc;
    IERC1155 public propertyToken;

    // Claim limits
    uint256 public usdcClaimAmount = 1000 * 1e6; // 1000 USDC (6 decimals)
    uint256 public propertyTokenClaimAmount = 10; // 10 property tokens
    uint256 public cooldownPeriod = 24 hours;

    // Track claims per user
    mapping(address => uint256) public lastUsdcClaim;
    mapping(address => mapping(uint256 => uint256)) public lastPropertyClaim;

    // Available property token IDs for claiming
    uint256[] public availablePropertyIds;
    mapping(uint256 => bool) public isPropertyAvailable;

    event UsdcClaimed(address indexed user, uint256 amount);
    event PropertyTokenClaimed(address indexed user, uint256 propertyId, uint256 amount);
    event ClaimAmountsUpdated(uint256 usdcAmount, uint256 propertyAmount);
    event CooldownUpdated(uint256 newCooldown);
    event PropertyAdded(uint256 propertyId);
    event PropertyRemoved(uint256 propertyId);

    error CooldownNotPassed(uint256 timeRemaining);
    error InsufficientFaucetBalance();
    error PropertyNotAvailable(uint256 propertyId);
    error InvalidAmount();

    constructor(
        address _testUsdc,
        address _propertyToken
    ) Ownable(msg.sender) {
        testUsdc = IERC20(_testUsdc);
        propertyToken = IERC1155(_propertyToken);
    }

    /**
     * @dev Claim test USDC tokens
     */
    function claimUsdc() external nonReentrant {
        uint256 timeSinceLastClaim = block.timestamp - lastUsdcClaim[msg.sender];
        if (lastUsdcClaim[msg.sender] != 0 && timeSinceLastClaim < cooldownPeriod) {
            revert CooldownNotPassed(cooldownPeriod - timeSinceLastClaim);
        }

        uint256 faucetBalance = testUsdc.balanceOf(address(this));
        if (faucetBalance < usdcClaimAmount) {
            revert InsufficientFaucetBalance();
        }

        lastUsdcClaim[msg.sender] = block.timestamp;
        testUsdc.transfer(msg.sender, usdcClaimAmount);

        emit UsdcClaimed(msg.sender, usdcClaimAmount);
    }

    /**
     * @dev Claim property tokens for a specific property
     * @param propertyId The ID of the property to claim tokens for
     */
    function claimPropertyTokens(uint256 propertyId) external nonReentrant {
        if (!isPropertyAvailable[propertyId]) {
            revert PropertyNotAvailable(propertyId);
        }

        uint256 timeSinceLastClaim = block.timestamp - lastPropertyClaim[msg.sender][propertyId];
        if (lastPropertyClaim[msg.sender][propertyId] != 0 && timeSinceLastClaim < cooldownPeriod) {
            revert CooldownNotPassed(cooldownPeriod - timeSinceLastClaim);
        }

        uint256 faucetBalance = propertyToken.balanceOf(address(this), propertyId);
        if (faucetBalance < propertyTokenClaimAmount) {
            revert InsufficientFaucetBalance();
        }

        lastPropertyClaim[msg.sender][propertyId] = block.timestamp;
        propertyToken.safeTransferFrom(address(this), msg.sender, propertyId, propertyTokenClaimAmount, "");

        emit PropertyTokenClaimed(msg.sender, propertyId, propertyTokenClaimAmount);
    }

    /**
     * @dev Get time until next USDC claim is available
     */
    function getUsdcCooldown(address user) external view returns (uint256) {
        if (lastUsdcClaim[user] == 0) return 0;

        uint256 timePassed = block.timestamp - lastUsdcClaim[user];
        if (timePassed >= cooldownPeriod) return 0;

        return cooldownPeriod - timePassed;
    }

    /**
     * @dev Get time until next property token claim is available
     */
    function getPropertyCooldown(address user, uint256 propertyId) external view returns (uint256) {
        if (lastPropertyClaim[user][propertyId] == 0) return 0;

        uint256 timePassed = block.timestamp - lastPropertyClaim[user][propertyId];
        if (timePassed >= cooldownPeriod) return 0;

        return cooldownPeriod - timePassed;
    }

    /**
     * @dev Get all available property IDs
     */
    function getAvailableProperties() external view returns (uint256[] memory) {
        return availablePropertyIds;
    }

    /**
     * @dev Get faucet balances
     */
    function getFaucetBalances(uint256 propertyId) external view returns (uint256 usdcBalance, uint256 propertyBalance) {
        usdcBalance = testUsdc.balanceOf(address(this));
        propertyBalance = propertyToken.balanceOf(address(this), propertyId);
    }

    // Admin functions

    /**
     * @dev Add a property ID to the claimable list
     */
    function addProperty(uint256 propertyId) external onlyOwner {
        if (!isPropertyAvailable[propertyId]) {
            isPropertyAvailable[propertyId] = true;
            availablePropertyIds.push(propertyId);
            emit PropertyAdded(propertyId);
        }
    }

    /**
     * @dev Remove a property ID from the claimable list
     */
    function removeProperty(uint256 propertyId) external onlyOwner {
        if (isPropertyAvailable[propertyId]) {
            isPropertyAvailable[propertyId] = false;

            // Remove from array
            for (uint256 i = 0; i < availablePropertyIds.length; i++) {
                if (availablePropertyIds[i] == propertyId) {
                    availablePropertyIds[i] = availablePropertyIds[availablePropertyIds.length - 1];
                    availablePropertyIds.pop();
                    break;
                }
            }

            emit PropertyRemoved(propertyId);
        }
    }

    /**
     * @dev Update claim amounts
     */
    function setClaimAmounts(uint256 _usdcAmount, uint256 _propertyAmount) external onlyOwner {
        if (_usdcAmount == 0 || _propertyAmount == 0) revert InvalidAmount();
        usdcClaimAmount = _usdcAmount;
        propertyTokenClaimAmount = _propertyAmount;
        emit ClaimAmountsUpdated(_usdcAmount, _propertyAmount);
    }

    /**
     * @dev Update cooldown period
     */
    function setCooldownPeriod(uint256 _cooldown) external onlyOwner {
        cooldownPeriod = _cooldown;
        emit CooldownUpdated(_cooldown);
    }

    /**
     * @dev Withdraw tokens from faucet (emergency)
     */
    function withdrawUsdc(uint256 amount) external onlyOwner {
        testUsdc.transfer(msg.sender, amount);
    }

    /**
     * @dev Withdraw property tokens from faucet (emergency)
     */
    function withdrawPropertyTokens(uint256 propertyId, uint256 amount) external onlyOwner {
        propertyToken.safeTransferFrom(address(this), msg.sender, propertyId, amount, "");
    }

    /**
     * @dev Required to receive ERC1155 tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Required to receive batch ERC1155 tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
