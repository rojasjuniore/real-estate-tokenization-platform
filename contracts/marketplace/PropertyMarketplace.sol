// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyMarketplace
 * @dev Marketplace for trading fractional property tokens with ERC20 and native token support
 */
contract PropertyMarketplace is ERC1155Holder, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint96 public constant MAX_FEE = 1000; // 10%

    IERC1155 public immutable propertyToken;

    // KYC Verification System
    struct KYCInfo {
        bool approved;
        uint256 approvedAt;
        uint256 revokedAt;
        address approvedBy;
    }

    mapping(address => KYCInfo) private _kycInfo;
    address public treasury;
    uint96 public marketplaceFee;

    uint256 private _listingIdCounter;
    uint256 private _activeListingsCount;

    struct Listing {
        address seller;
        uint256 propertyId;
        uint256 amount;
        uint256 pricePerToken;
        address paymentToken;
        bool active;
    }

    mapping(uint256 => Listing) private _listings;
    mapping(address => bool) private _acceptedPaymentTokens;
    mapping(address => uint256[]) private _sellerListings;
    mapping(uint256 => uint256[]) private _propertyListings;

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed propertyId,
        uint256 amount,
        uint256 pricePerToken,
        address paymentToken
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ListingPriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);
    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );
    event PaymentTokenAdded(address indexed token);
    event PaymentTokenRemoved(address indexed token);
    event MarketplaceFeeUpdated(uint96 oldFee, uint96 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // KYC Events
    event KYCApproved(address indexed wallet, address indexed approvedBy, uint256 timestamp);
    event KYCRevoked(address indexed wallet, address indexed revokedBy, uint256 timestamp);

    error InvalidAddress();
    error PaymentTokenNotAccepted();
    error InvalidAmount();
    error InvalidPrice();
    error ListingNotActive();
    error NotListingSeller();
    error InsufficientListingAmount();
    error InsufficientPayment();
    error FeeTooHigh();
    error TransferFailed();
    error KYCNotApproved();
    error KYCAlreadyApproved();
    error KYCNotFound();

    /**
     * @dev Modifier to check if buyer has approved KYC
     */
    modifier onlyKYCApproved() {
        if (!_kycInfo[msg.sender].approved) revert KYCNotApproved();
        _;
    }

    constructor(
        address propertyToken_,
        address treasury_,
        uint96 marketplaceFee_
    ) {
        if (propertyToken_ == address(0) || treasury_ == address(0)) {
            revert InvalidAddress();
        }
        if (marketplaceFee_ > MAX_FEE) revert FeeTooHigh();

        propertyToken = IERC1155(propertyToken_);
        treasury = treasury_;
        marketplaceFee = marketplaceFee_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Adds a payment token to the accepted list
     */
    function addPaymentToken(address token) external onlyRole(ADMIN_ROLE) {
        _acceptedPaymentTokens[token] = true;
        emit PaymentTokenAdded(token);
    }

    /**
     * @dev Removes a payment token from the accepted list
     */
    function removePaymentToken(address token) external onlyRole(ADMIN_ROLE) {
        _acceptedPaymentTokens[token] = false;
        emit PaymentTokenRemoved(token);
    }

    /**
     * @dev Checks if a payment token is accepted
     */
    function isPaymentTokenAccepted(address token) external view returns (bool) {
        return _acceptedPaymentTokens[token];
    }

    /**
     * @dev Creates a new listing
     */
    function createListing(
        uint256 propertyId,
        uint256 amount,
        uint256 pricePerToken,
        address paymentToken
    ) external whenNotPaused nonReentrant returns (uint256) {
        if (!_acceptedPaymentTokens[paymentToken]) revert PaymentTokenNotAccepted();
        if (amount == 0) revert InvalidAmount();
        if (pricePerToken == 0) revert InvalidPrice();

        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;

        _listings[listingId] = Listing({
            seller: msg.sender,
            propertyId: propertyId,
            amount: amount,
            pricePerToken: pricePerToken,
            paymentToken: paymentToken,
            active: true
        });

        _activeListingsCount++;
        _sellerListings[msg.sender].push(listingId);
        _propertyListings[propertyId].push(listingId);

        propertyToken.safeTransferFrom(msg.sender, address(this), propertyId, amount, "");

        emit ListingCreated(listingId, msg.sender, propertyId, amount, pricePerToken, paymentToken);

        return listingId;
    }

    /**
     * @dev Cancels a listing and returns tokens to seller
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = _listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotListingSeller();

        listing.active = false;
        _activeListingsCount--;

        propertyToken.safeTransferFrom(
            address(this),
            listing.seller,
            listing.propertyId,
            listing.amount,
            ""
        );

        emit ListingCancelled(listingId, msg.sender);
    }

    /**
     * @dev Updates the price of a listing. Only the seller can update.
     * @param listingId The ID of the listing to update
     * @param newPricePerToken The new price per token
     */
    function updateListingPrice(uint256 listingId, uint256 newPricePerToken) external nonReentrant {
        Listing storage listing = _listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotListingSeller();
        if (newPricePerToken == 0) revert InvalidPrice();

        uint256 oldPrice = listing.pricePerToken;
        listing.pricePerToken = newPricePerToken;

        emit ListingPriceUpdated(listingId, oldPrice, newPricePerToken);
    }

    /**
     * @dev Buys tokens from a listing. Requires buyer to have approved KYC.
     */
    function buy(uint256 listingId, uint256 amount) external payable whenNotPaused nonReentrant onlyKYCApproved {
        Listing storage listing = _listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (amount > listing.amount) revert InsufficientListingAmount();

        uint256 totalPrice = listing.pricePerToken * amount;
        uint256 feeAmount = (totalPrice * marketplaceFee) / 10000;
        uint256 sellerAmount = totalPrice - feeAmount;

        // Handle payment
        if (listing.paymentToken == address(0)) {
            // Native token payment
            if (msg.value < totalPrice) revert InsufficientPayment();

            // Transfer to seller
            (bool sellerSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
            if (!sellerSuccess) revert TransferFailed();

            // Transfer fee to treasury
            if (feeAmount > 0) {
                (bool feeSuccess, ) = payable(treasury).call{value: feeAmount}("");
                if (!feeSuccess) revert TransferFailed();
            }

            // Refund excess
            uint256 excess = msg.value - totalPrice;
            if (excess > 0) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
                if (!refundSuccess) revert TransferFailed();
            }
        } else {
            // ERC20 payment
            IERC20 paymentToken = IERC20(listing.paymentToken);
            paymentToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
            if (feeAmount > 0) {
                paymentToken.safeTransferFrom(msg.sender, treasury, feeAmount);
            }
        }

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
            _activeListingsCount--;
        }

        // Transfer property tokens to buyer
        propertyToken.safeTransferFrom(address(this), msg.sender, listing.propertyId, amount, "");

        emit Sale(listingId, msg.sender, amount, totalPrice);
    }

    // ========== PRIMARY SALES (DIRECT BUY FROM TREASURY) ==========

    // Mapping: propertyId => price per token (in payment token smallest unit)
    mapping(uint256 => uint256) private _propertyPrices;
    // Mapping: propertyId => payment token address
    mapping(uint256 => address) private _propertyPaymentTokens;

    event PropertyPriceSet(uint256 indexed propertyId, uint256 pricePerToken, address paymentToken);
    event DirectSale(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalPrice);

    /**
     * @dev Sets the price for direct purchase of a property from treasury
     * @param propertyId The property token ID
     * @param pricePerToken Price per token in payment token smallest unit
     * @param paymentToken The ERC20 token address for payment
     */
    function setPropertyPrice(
        uint256 propertyId,
        uint256 pricePerToken,
        address paymentToken
    ) external onlyRole(ADMIN_ROLE) {
        if (!_acceptedPaymentTokens[paymentToken]) revert PaymentTokenNotAccepted();
        if (pricePerToken == 0) revert InvalidPrice();

        _propertyPrices[propertyId] = pricePerToken;
        _propertyPaymentTokens[propertyId] = paymentToken;

        emit PropertyPriceSet(propertyId, pricePerToken, paymentToken);
    }

    /**
     * @dev Returns the price info for a property
     */
    function getPropertyPrice(uint256 propertyId) external view returns (uint256 pricePerToken, address paymentToken) {
        return (_propertyPrices[propertyId], _propertyPaymentTokens[propertyId]);
    }

    /**
     * @dev Buy tokens directly from treasury (primary sale)
     * @param propertyId The property token ID to buy
     * @param amount Number of tokens to buy
     */
    function buyDirect(
        uint256 propertyId,
        uint256 amount
    ) external whenNotPaused nonReentrant onlyKYCApproved {
        if (amount == 0) revert InvalidAmount();

        uint256 pricePerToken = _propertyPrices[propertyId];
        address paymentToken = _propertyPaymentTokens[propertyId];

        if (pricePerToken == 0) revert InvalidPrice();

        // Check treasury has enough tokens
        uint256 treasuryBalance = propertyToken.balanceOf(treasury, propertyId);
        if (treasuryBalance < amount) revert InsufficientListingAmount();

        uint256 totalPrice = pricePerToken * amount;
        uint256 feeAmount = (totalPrice * marketplaceFee) / 10000;

        // Transfer payment from buyer to treasury
        IERC20(paymentToken).safeTransferFrom(msg.sender, treasury, totalPrice);

        // Transfer tokens from treasury to buyer
        // Note: Treasury must have approved this contract to transfer tokens
        propertyToken.safeTransferFrom(treasury, msg.sender, propertyId, amount, "");

        emit DirectSale(propertyId, msg.sender, amount, totalPrice);
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

    // ========== FEE MANAGEMENT ==========

    /**
     * @dev Updates the marketplace fee
     */
    function setMarketplaceFee(uint96 newFee) external onlyRole(ADMIN_ROLE) {
        if (newFee > MAX_FEE) revert FeeTooHigh();

        uint96 oldFee = marketplaceFee;
        marketplaceFee = newFee;

        emit MarketplaceFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Updates the treasury address
     */
    function setTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        if (newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Pauses the marketplace
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the marketplace
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Returns a listing by id
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }

    /**
     * @dev Returns the count of active listings
     */
    function getActiveListingsCount() external view returns (uint256) {
        return _activeListingsCount;
    }

    /**
     * @dev Returns all listing ids for a seller
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return _sellerListings[seller];
    }

    /**
     * @dev Returns all listing ids for a property
     */
    function getPropertyListings(uint256 propertyId) external view returns (uint256[] memory) {
        return _propertyListings[propertyId];
    }

    /**
     * @dev Required override for AccessControl and ERC1155Holder
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Holder, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
