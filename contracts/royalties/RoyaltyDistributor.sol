// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../tokens/PropertyToken.sol";

/**
 * @title RoyaltyDistributor
 * @notice Distributes rental income/royalties to property token holders proportionally
 * @dev Admin creates distributions, holders claim their share based on token balance
 */
contract RoyaltyDistributor is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ State Variables ============
    PropertyToken public immutable propertyToken;
    uint256 public distributionCount;

    // ============ Structs ============
    struct Distribution {
        uint256 propertyId;
        uint256 totalAmount;
        address paymentToken;
        uint256 totalSupplySnapshot;
        uint256 createdAt;
    }

    // ============ Mappings ============
    /// @notice Distribution ID => Distribution data
    mapping(uint256 => Distribution) private _distributions;

    /// @notice Distribution ID => user address => has claimed
    mapping(uint256 => mapping(address => bool)) private _hasClaimed;

    /// @notice Payment token => accepted status
    mapping(address => bool) private _acceptedPaymentTokens;

    /// @notice Property ID => array of distribution IDs
    mapping(uint256 => uint256[]) private _propertyDistributions;

    // ============ Events ============
    event DistributionCreated(
        uint256 indexed distributionId,
        uint256 indexed propertyId,
        uint256 totalAmount,
        address paymentToken
    );

    event RoyaltyClaimed(
        uint256 indexed distributionId,
        address indexed user,
        uint256 amount
    );

    event PaymentTokenAdded(address indexed token);
    event PaymentTokenRemoved(address indexed token);

    // ============ Errors ============
    error PaymentTokenNotAccepted();
    error InvalidAmount();
    error AlreadyClaimed();
    error NoTokensHeld();
    error DistributionNotFound();
    error InvalidPropertyToken();

    // ============ Constructor ============
    constructor(address _propertyToken) {
        if (_propertyToken == address(0)) revert InvalidPropertyToken();

        propertyToken = PropertyToken(_propertyToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a payment token to accepted list
     * @param token The token address to accept
     */
    function addPaymentToken(address token) external onlyRole(ADMIN_ROLE) {
        _acceptedPaymentTokens[token] = true;
        emit PaymentTokenAdded(token);
    }

    /**
     * @notice Remove a payment token from accepted list
     * @param token The token address to remove
     */
    function removePaymentToken(address token) external onlyRole(ADMIN_ROLE) {
        _acceptedPaymentTokens[token] = false;
        emit PaymentTokenRemoved(token);
    }

    /**
     * @notice Create a new distribution for a property
     * @param propertyId The property token ID
     * @param amount The total amount to distribute
     * @param paymentToken The ERC20 token for payment
     */
    function createDistribution(
        uint256 propertyId,
        uint256 amount,
        address paymentToken
    ) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        if (!_acceptedPaymentTokens[paymentToken]) {
            revert PaymentTokenNotAccepted();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        // Get the total supply snapshot for proportional calculation
        uint256 totalSupply = propertyToken.totalSupply(propertyId);

        // Increment distribution counter
        distributionCount++;
        uint256 distributionId = distributionCount;

        // Store distribution data
        _distributions[distributionId] = Distribution({
            propertyId: propertyId,
            totalAmount: amount,
            paymentToken: paymentToken,
            totalSupplySnapshot: totalSupply,
            createdAt: block.timestamp
        });

        // Track distribution for this property
        _propertyDistributions[propertyId].push(distributionId);

        // Transfer tokens from admin to this contract
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), amount);

        emit DistributionCreated(distributionId, propertyId, amount, paymentToken);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ Claim Functions ============

    /**
     * @notice Claim royalties from a distribution
     * @param distributionId The distribution ID to claim from
     */
    function claim(uint256 distributionId) external whenNotPaused nonReentrant {
        if (distributionId == 0 || distributionId > distributionCount) {
            revert DistributionNotFound();
        }
        if (_hasClaimed[distributionId][msg.sender]) {
            revert AlreadyClaimed();
        }

        Distribution storage dist = _distributions[distributionId];

        // Get user's token balance for this property
        uint256 userBalance = propertyToken.balanceOf(msg.sender, dist.propertyId);
        if (userBalance == 0) {
            revert NoTokensHeld();
        }

        // Calculate user's share
        uint256 userShare = (dist.totalAmount * userBalance) / dist.totalSupplySnapshot;

        // Mark as claimed
        _hasClaimed[distributionId][msg.sender] = true;

        // Transfer tokens to user
        IERC20(dist.paymentToken).safeTransfer(msg.sender, userShare);

        emit RoyaltyClaimed(distributionId, msg.sender, userShare);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a payment token is accepted
     * @param token The token address to check
     */
    function isPaymentTokenAccepted(address token) external view returns (bool) {
        return _acceptedPaymentTokens[token];
    }

    /**
     * @notice Get distribution details by ID
     * @param distributionId The distribution ID
     */
    function getDistribution(uint256 distributionId) external view returns (Distribution memory) {
        return _distributions[distributionId];
    }

    /**
     * @notice Check if a user has claimed from a distribution
     * @param distributionId The distribution ID
     * @param user The user address
     */
    function hasClaimed(uint256 distributionId, address user) external view returns (bool) {
        return _hasClaimed[distributionId][user];
    }

    /**
     * @notice Get all distribution IDs for a property
     * @param propertyId The property ID
     */
    function getPropertyDistributions(uint256 propertyId) external view returns (uint256[] memory) {
        return _propertyDistributions[propertyId];
    }

    /**
     * @notice Get unclaimed distribution IDs for a user and property
     * @param user The user address
     * @param propertyId The property ID
     */
    function getUnclaimedDistributions(
        address user,
        uint256 propertyId
    ) external view returns (uint256[] memory) {
        uint256[] storage propDists = _propertyDistributions[propertyId];
        uint256 count = 0;

        // First pass: count unclaimed
        for (uint256 i = 0; i < propDists.length;) {
            if (!_hasClaimed[propDists[i]][user]) {
                unchecked { count++; }
            }
            unchecked { i++; }
        }

        // Second pass: collect unclaimed IDs
        uint256[] memory unclaimed = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < propDists.length;) {
            if (!_hasClaimed[propDists[i]][user]) {
                unclaimed[index] = propDists[i];
                unchecked { index++; }
            }
            unchecked { i++; }
        }

        return unclaimed;
    }

    /**
     * @notice Calculate claimable amount for a user from a distribution
     * @param distributionId The distribution ID
     * @param user The user address
     */
    function getClaimableAmount(
        uint256 distributionId,
        address user
    ) external view returns (uint256) {
        if (distributionId == 0 || distributionId > distributionCount) {
            return 0;
        }
        if (_hasClaimed[distributionId][user]) {
            return 0;
        }

        Distribution storage dist = _distributions[distributionId];
        uint256 userBalance = propertyToken.balanceOf(user, dist.propertyId);

        if (userBalance == 0 || dist.totalSupplySnapshot == 0) {
            return 0;
        }

        return (dist.totalAmount * userBalance) / dist.totalSupplySnapshot;
    }
}
