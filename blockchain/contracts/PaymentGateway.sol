// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PaymentGateway is Ownable, ReentrancyGuard {

    IERC20 public immutable usdtToken;
    address public treasuryWallet;

    // Monto mínimo aceptado: 1 USDT (6 decimales)
    uint256 public constant MIN_AMOUNT = 1 * 10**6;

    struct Payment {
        address user;
        string productId;
        uint256 amount;
        uint256 timestamp;
        string orderId;
    }

    mapping(string => Payment) public payments;

    event PaymentProcessed(
        address indexed user,
        string indexed orderId,
        string productId,
        uint256 amount,
        uint256 timestamp
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    constructor(address _usdtToken, address _treasuryWallet) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT token");
        require(_treasuryWallet != address(0), "Invalid treasury");
        usdtToken = IERC20(_usdtToken);
        treasuryWallet = _treasuryWallet;
    }

    function processPayment(
        string memory _productId,
        string memory _orderId,
        uint256 _amount
    ) external nonReentrant {
        require(bytes(_productId).length > 0, "Invalid productId");
        require(bytes(_orderId).length > 0, "Invalid orderId");
        require(_amount >= MIN_AMOUNT, "Amount below minimum");
        require(payments[_orderId].timestamp == 0, "Order already processed");

        require(
            usdtToken.transferFrom(msg.sender, treasuryWallet, _amount),
            "USDT transfer failed"
        );

        payments[_orderId] = Payment({
            user: msg.sender,
            productId: _productId,
            amount: _amount,
            timestamp: block.timestamp,
            orderId: _orderId
        });

        emit PaymentProcessed(msg.sender, _orderId, _productId, _amount, block.timestamp);
    }

    function isOrderProcessed(string memory _orderId) external view returns (bool) {
        return payments[_orderId].timestamp != 0;
    }

    function getPayment(string memory _orderId)
        external
        view
        returns (
            address user,
            string memory productId,
            uint256 amount,
            uint256 timestamp
        )
    {
        Payment memory p = payments[_orderId];
        return (p.user, p.productId, p.amount, p.timestamp);
    }

    function setTreasuryWallet(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        address old = treasuryWallet;
        treasuryWallet = _newTreasury;
        emit TreasuryUpdated(old, _newTreasury);
    }
}