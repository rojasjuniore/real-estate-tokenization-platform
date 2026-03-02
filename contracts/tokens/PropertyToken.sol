// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PropertyToken
 * @dev ERC1155 token for fractional real estate ownership with ERC2981 royalties
 */
contract PropertyToken is ERC1155, ERC1155Supply, ERC2981, AccessControl, Pausable {
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint96 public constant MAX_ROYALTY_FEE = 1000; // 10%

    string private _baseURI;
    address public treasury;

    struct Property {
        uint256 totalSupply;
        string uri;
        uint96 royaltyFee;
        bool exists;
    }

    mapping(uint256 => Property) private _properties;

    event PropertyCreated(
        uint256 indexed tokenId,
        uint256 totalSupply,
        string uri,
        uint96 royaltyFee
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    error PropertyAlreadyExists(uint256 tokenId);
    error PropertyDoesNotExist(uint256 tokenId);
    error RoyaltyFeeTooHigh(uint96 fee, uint96 maxFee);
    error InvalidSupply();
    error InvalidAddress();

    constructor(
        string memory baseURI_,
        address treasury_
    ) ERC1155(baseURI_) {
        if (treasury_ == address(0)) revert InvalidAddress();

        _baseURI = baseURI_;
        treasury = treasury_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Creates a new property token
     * @param tokenId The ID for the new property token
     * @param supply Total supply of fractions
     * @param propertyUri Metadata URI for the property
     * @param royaltyFee Royalty fee in basis points (e.g., 250 = 2.5%)
     */
    function createProperty(
        uint256 tokenId,
        uint256 supply,
        string calldata propertyUri,
        uint96 royaltyFee
    ) external onlyRole(MINTER_ROLE) {
        if (_properties[tokenId].exists) revert PropertyAlreadyExists(tokenId);
        if (supply == 0) revert InvalidSupply();
        if (royaltyFee > MAX_ROYALTY_FEE) revert RoyaltyFeeTooHigh(royaltyFee, MAX_ROYALTY_FEE);

        _properties[tokenId] = Property({
            totalSupply: supply,
            uri: propertyUri,
            royaltyFee: royaltyFee,
            exists: true
        });

        _setTokenRoyalty(tokenId, treasury, royaltyFee);
        _mint(treasury, tokenId, supply, "");

        emit PropertyCreated(tokenId, supply, propertyUri, royaltyFee);
    }

    /**
     * @dev Returns property information
     */
    function getProperty(uint256 tokenId) external view returns (Property memory) {
        return _properties[tokenId];
    }

    /**
     * @dev Burns tokens from an account
     */
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) external {
        if (account != msg.sender && !isApprovedForAll(account, msg.sender)) {
            revert ERC1155MissingApprovalForAll(msg.sender, account);
        }
        _burn(account, id, value);
    }

    /**
     * @dev Burns batch of tokens from an account
     */
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) external {
        if (account != msg.sender && !isApprovedForAll(account, msg.sender)) {
            revert ERC1155MissingApprovalForAll(msg.sender, account);
        }
        _burnBatch(account, ids, values);
    }

    /**
     * @dev Pauses all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Updates the base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyRole(ADMIN_ROLE) {
        _baseURI = newBaseURI;
    }

    /**
     * @dev Updates a property's URI
     */
    function setPropertyURI(uint256 tokenId, string calldata newUri) external onlyRole(ADMIN_ROLE) {
        _properties[tokenId].uri = newUri;
        emit URI(newUri, tokenId);
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
     * @dev Returns the URI for a token
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        if (_properties[tokenId].exists && bytes(_properties[tokenId].uri).length > 0) {
            return _properties[tokenId].uri;
        }
        return string(abi.encodePacked(_baseURI, tokenId.toString()));
    }

    /**
     * @dev Hook that is called before any token transfer
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._update(from, to, ids, values);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
