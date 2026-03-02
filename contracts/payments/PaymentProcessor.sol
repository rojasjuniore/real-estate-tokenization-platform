// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentProcessor
 * @dev Centralized payment processing with support for multiple tokens and commission handling
 */
contract PaymentProcessor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 public constant MAX_COMMISSION = 1000; // 10%

    struct TokenInfo {
        uint8 decimals;
        bool active;
    }

    // KYC Verification System
    struct KYCInfo {
        bool approved;
        uint256 approvedAt;
        uint256 revokedAt;
        address approvedBy;
    }

    address public treasury;
    mapping(address => TokenInfo) private _tokenInfo;
    address[] private _supportedTokens;
    mapping(address => KYCInfo) private _kycInfo;

    event PaymentTokenAdded(address indexed token, uint8 decimals);
    event PaymentTokenRemoved(address indexed token);
    event PaymentProcessed(
        address indexed from,
        address indexed to,
        address indexed token,
        uint256 amount
    );
    event CommissionProcessed(
        address indexed treasury,
        address indexed token,
        uint256 amount
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // KYC Events
    event KYCApproved(address indexed wallet, address indexed approvedBy, uint256 timestamp);
    event KYCRevoked(address indexed wallet, address indexed revokedBy, uint256 timestamp);

    error InvalidAddress();
    error TokenNotAccepted();
    error InvalidAmount();
    error CommissionTooHigh();
    error InsufficientPayment();
    error TransferFailed();
    error KYCNotApproved();
    error KYCAlreadyApproved();
    error KYCNotFound();

    /**
     * @dev Modifier to check if payer has approved KYC
     */
    modifier onlyKYCApproved(address payer) {
        if (!_kycInfo[payer].approved) revert KYCNotApproved();
        _;
    }

    constructor(address treasury_) {
        if (treasury_ == address(0)) revert InvalidAddress();

        treasury = treasury_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Adds a payment token to the accepted list
     * @param token Token address (use address(0) for native token)
     * @param decimals Token decimals
     */
    function addPaymentToken(address token, uint8 decimals) external onlyRole(ADMIN_ROLE) {
        if (!_tokenInfo[token].active) {
            _supportedTokens.push(token);
        }
        _tokenInfo[token] = TokenInfo({
            decimals: decimals,
            active: true
        });
        emit PaymentTokenAdded(token, decimals);
    }

    /**
     * @dev Removes a payment token from the accepted list
     */
    function removePaymentToken(address token) external onlyRole(ADMIN_ROLE) {
        _tokenInfo[token].active = false;
        emit PaymentTokenRemoved(token);
    }

    /**
     * @dev Checks if a token is accepted
     */
    function isTokenAccepted(address token) external view returns (bool) {
        return _tokenInfo[token].active;
    }

    /**
     * @dev Gets token info
     */
    function getTokenInfo(address token) external view returns (TokenInfo memory) {
        return _tokenInfo[token];
    }

    /**
     * @dev Gets token decimals
     */
    function getTokenDecimals(address token) external view returns (uint8) {
        if (!_tokenInfo[token].active) revert TokenNotAccepted();
        return _tokenInfo[token].decimals;
    }

    /**
     * @dev Returns list of supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            if (_tokenInfo[_supportedTokens[i]].active) {
                activeCount++;
            }
        }

        address[] memory activeTokens = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            if (_tokenInfo[_supportedTokens[i]].active) {
                activeTokens[index] = _supportedTokens[i];
                index++;
            }
        }
        return activeTokens;
    }

    // ========== KYC MANAGEMENT ==========

    /**
     * @dev Approves KYC for a wallet address
     * @param wallet The wallet address to approve
     */
    function approveKYC(address wallet) external onlyRole(ADMIN_ROLE) {
        if (wallet == address(0)) revert InvalidAddress();
        if (_kycInfo[wallet].approved) revert KYCAlreadyApproved();

        _kycInfo[wallet] = KYCInfo({
            approved: true,
            approvedAt: block.timestamp,
            revokedAt: 0,
            approvedBy: msg.sender
        });

        emit KYCApproved(wallet, msg.sender, block.timestamp);
    }

    /**
     * @dev Revokes KYC for a wallet address
     * @param wallet The wallet address to revoke
     */
    function revokeKYC(address wallet) external onlyRole(ADMIN_ROLE) {
        if (wallet == address(0)) revert InvalidAddress();
        if (!_kycInfo[wallet].approved) revert KYCNotFound();

        _kycInfo[wallet].approved = false;
        _kycInfo[wallet].revokedAt = block.timestamp;

        emit KYCRevoked(wallet, msg.sender, block.timestamp);
    }

    /**
     * @dev Batch approve KYC for multiple wallets
     * @param wallets Array of wallet addresses to approve
     */
    function approveKYCBatch(address[] calldata wallets) external onlyRole(ADMIN_ROLE) {
        uint256 length = wallets.length;
        for (uint256 i = 0; i < length; ) {
            address wallet = wallets[i];
            if (wallet != address(0) && !_kycInfo[wallet].approved) {
                _kycInfo[wallet] = KYCInfo({
                    approved: true,
                    approvedAt: block.timestamp,
                    revokedAt: 0,
                    approvedBy: msg.sender
                });
                emit KYCApproved(wallet, msg.sender, block.timestamp);
            }
            unchecked { ++i; }
        }
    }

    /**
     * @dev Checks if a wallet has approved KYC
     * @param wallet The wallet address to check
     * @return bool True if KYC is approved
     */
    function isKYCApproved(address wallet) external view returns (bool) {
        return _kycInfo[wallet].approved;
    }

    /**
     * @dev Returns full KYC info for a wallet
     * @param wallet The wallet address to query
     * @return KYCInfo struct with approval details
     */
    function getKYCInfo(address wallet) external view returns (KYCInfo memory) {
        return _kycInfo[wallet];
    }

    // ========== PAYMENT PROCESSING ==========

    /**
     * @dev Process a simple payment from one address to another. Requires payer to have approved KYC.
     */
    function processPayment(
        address from,
        address to,
        address token,
        uint256 amount
    ) external onlyRole(OPERATOR_ROLE) nonReentrant onlyKYCApproved(from) returns (bool) {
        if (!_tokenInfo[token].active) revert TokenNotAccepted();
        if (amount == 0) revert InvalidAmount();

        IERC20(token).safeTransferFrom(from, to, amount);

        emit PaymentProcessed(from, to, token, amount);
        return true;
    }

    /**
     * @dev Process payment with commission split. Requires payer to have approved KYC.
     */
    function processPaymentWithCommission(
        address from,
        address to,
        address token,
        uint256 amount,
        uint256 commissionPercent
    ) external onlyRole(OPERATOR_ROLE) nonReentrant onlyKYCApproved(from) returns (uint256 sellerAmount, uint256 commissionAmount) {
        if (!_tokenInfo[token].active) revert TokenNotAccepted();
        if (amount == 0) revert InvalidAmount();
        if (commissionPercent > MAX_COMMISSION) revert CommissionTooHigh();

        commissionAmount = (amount * commissionPercent) / 10000;
        sellerAmount = amount - commissionAmount;

        IERC20(token).safeTransferFrom(from, to, sellerAmount);
        emit PaymentProcessed(from, to, token, sellerAmount);

        if (commissionAmount > 0) {
            IERC20(token).safeTransferFrom(from, treasury, commissionAmount);
            emit CommissionProcessed(treasury, token, commissionAmount);
        }

        return (sellerAmount, commissionAmount);
    }

    /**
     * @dev Process native token (MATIC) payment. Requires payer to have approved KYC.
     * @param payer The address of the actual payer (for KYC verification)
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function processNativePayment(
        address payer,
        address to,
        uint256 amount
    ) external payable onlyRole(OPERATOR_ROLE) nonReentrant onlyKYCApproved(payer) returns (bool) {
        if (!_tokenInfo[address(0)].active) revert TokenNotAccepted();
        if (msg.value < amount) revert InsufficientPayment();

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();

        // Refund excess
        uint256 excess = msg.value - amount;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit PaymentProcessed(payer, to, address(0), amount);
        return true;
    }

    /**
     * @dev Process native token payment with commission. Requires payer to have approved KYC.
     * @param payer The address of the actual payer (for KYC verification)
     * @param to The recipient address
     * @param commissionPercent Commission percentage in basis points
     */
    function processNativePaymentWithCommission(
        address payer,
        address to,
        uint256 commissionPercent
    ) external payable onlyRole(OPERATOR_ROLE) nonReentrant onlyKYCApproved(payer) returns (uint256 recipientAmount, uint256 commissionAmount) {
        if (!_tokenInfo[address(0)].active) revert TokenNotAccepted();
        if (msg.value == 0) revert InvalidAmount();
        if (commissionPercent > MAX_COMMISSION) revert CommissionTooHigh();

        uint256 amount = msg.value;
        commissionAmount = (amount * commissionPercent) / 10000;
        recipientAmount = amount - commissionAmount;

        (bool recipientSuccess, ) = payable(to).call{value: recipientAmount}("");
        if (!recipientSuccess) revert TransferFailed();

        emit PaymentProcessed(payer, to, address(0), recipientAmount);

        if (commissionAmount > 0) {
            (bool treasurySuccess, ) = payable(treasury).call{value: commissionAmount}("");
            if (!treasurySuccess) revert TransferFailed();
            emit CommissionProcessed(treasury, address(0), commissionAmount);
        }

        return (recipientAmount, commissionAmount);
    }

    /**
     * @dev Update treasury address
     */
    function setTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        if (newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Calculate commission amount
     */
    function calculateCommission(uint256 amount, uint256 percent) external pure returns (uint256) {
        return (amount * percent) / 10000;
    }

    /**
     * @dev Normalize amount from one decimal to another (for calculations)
     */
    function normalizeAmount(
        uint256 amount,
        uint8 fromDecimals,
        uint8 toDecimals
    ) external pure returns (uint256) {
        if (fromDecimals < toDecimals) {
            return amount * (10 ** (toDecimals - fromDecimals));
        } else if (fromDecimals > toDecimals) {
            return amount / (10 ** (fromDecimals - toDecimals));
        }
        return amount;
    }

    /**
     * @dev Denormalize amount from one decimal to another
     */
    function denormalizeAmount(
        uint256 amount,
        uint8 fromDecimals,
        uint8 toDecimals
    ) external pure returns (uint256) {
        if (fromDecimals > toDecimals) {
            return amount / (10 ** (fromDecimals - toDecimals));
        } else if (fromDecimals < toDecimals) {
            return amount * (10 ** (toDecimals - fromDecimals));
        }
        return amount;
    }

    /**
     * @dev Receive function to accept native token
     */
    receive() external payable {}
}
