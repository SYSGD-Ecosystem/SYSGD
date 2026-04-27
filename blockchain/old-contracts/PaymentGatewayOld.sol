// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentGateway
 * @dev Gateway para procesar pagos de créditos y planes con USDT
 */
contract PaymentGateway is Ownable, ReentrancyGuard {
    
    // Token USDT (será TestUSDT en testnet, USDT real en mainnet)
    IERC20 public immutable usdtToken;
    
    // Billetera que recibe los pagos
    address public treasuryWallet;
    
    // Precios de productos (en USDT con 6 decimales)
    struct Product {
        string productId;
        uint256 price;
        bool active;
        string description;
    }
    
    // Mapping de productId => Product
    mapping(string => Product) public products;
    
    // Lista de productos activos
    string[] public productList;
    
    // Registro de pagos
    struct Payment {
        address user;
        string productId;
        uint256 amount;
        uint256 timestamp;
        string orderId;
    }
    
    // Mapping de orderId => Payment
    mapping(string => Payment) public payments;
    
    // Lista de todos los orderIds
    string[] public orderList;
    
    // Eventos
    event ProductCreated(string indexed productId, uint256 price, string description);
    event ProductUpdated(string indexed productId, uint256 newPrice, bool active);
    event PaymentProcessed(
        address indexed user, 
        string indexed orderId,
        string productId,
        uint256 amount,
        uint256 timestamp
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    constructor(address _usdtToken, address _treasuryWallet) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        
        usdtToken = IERC20(_usdtToken);
        treasuryWallet = _treasuryWallet;
        
        // Crear productos por defecto
        _createDefaultProducts();
    }
    
    /**
     * @dev Crea productos por defecto (créditos y planes)
     */
    function _createDefaultProducts() private {
        // Paquetes de créditos
        _addProduct("credits_10", 5 * 10**6, "10 AI Credits");
        _addProduct("credits_50", 20 * 10**6, "50 AI Credits");
        _addProduct("credits_100", 35 * 10**6, "100 AI Credits");
        _addProduct("credits_500", 150 * 10**6, "500 AI Credits");
        
        // Planes mensuales
        _addProduct("plan_pro_monthly", 10 * 10**6, "Pro Plan - Monthly");
        _addProduct("plan_vip_monthly", 25 * 10**6, "VIP Plan - Monthly");
        
        // Planes anuales (con descuento)
        _addProduct("plan_pro_yearly", 100 * 10**6, "Pro Plan - Yearly (2 months free)");
        _addProduct("plan_vip_yearly", 250 * 10**6, "VIP Plan - Yearly (2 months free)");
    }
    
    /**
     * @dev Agrega un nuevo producto
     */
    function _addProduct(string memory _productId, uint256 _price, string memory _description) private {
        products[_productId] = Product({
            productId: _productId,
            price: _price,
            active: true,
            description: _description
        });
        productList.push(_productId);
    }
    
    /**
     * @dev Permite al owner crear o actualizar productos
     */
    function setProduct(
        string memory _productId,
        uint256 _price,
        bool _active,
        string memory _description
    ) external onlyOwner {
        Product storage product = products[_productId];
        
        bool isNew = bytes(product.productId).length == 0;
        
        product.productId = _productId;
        product.price = _price;
        product.active = _active;
        product.description = _description;
        
        if (isNew) {
            productList.push(_productId);
            emit ProductCreated(_productId, _price, _description);
        } else {
            emit ProductUpdated(_productId, _price, _active);
        }
    }
    
    /**
     * @dev Procesa un pago
     * @param _productId ID del producto a comprar
     * @param _orderId ID único de la orden (generado por el backend)
     */
    function processPayment(
        string memory _productId,
        string memory _orderId
    ) external nonReentrant {
        // Verificar que el producto existe y está activo
        Product memory product = products[_productId];
        require(bytes(product.productId).length > 0, "Product does not exist");
        require(product.active, "Product is not active");
        
        // Verificar que la orden no existe
        require(payments[_orderId].timestamp == 0, "Order already processed");
        
        // Transferir USDT del usuario al treasury
        require(
            usdtToken.transferFrom(msg.sender, treasuryWallet, product.price),
            "USDT transfer failed"
        );
        
        // Registrar el pago
        payments[_orderId] = Payment({
            user: msg.sender,
            productId: _productId,
            amount: product.price,
            timestamp: block.timestamp,
            orderId: _orderId
        });
        
        orderList.push(_orderId);
        
        emit PaymentProcessed(
            msg.sender,
            _orderId,
            _productId,
            product.price,
            block.timestamp
        );
    }
    
    /**
     * @dev Actualiza la billetera del treasury
     */
    function setTreasuryWallet(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasuryWallet;
        treasuryWallet = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @dev Obtiene información de un producto
     */
    function getProduct(string memory _productId) 
        external 
        view 
        returns (
            string memory productId,
            uint256 price,
            bool active,
            string memory description
        ) 
    {
        Product memory product = products[_productId];
        return (
            product.productId,
            product.price,
            product.active,
            product.description
        );
    }
    
    /**
     * @dev Obtiene todos los productos
     */
    function getAllProducts() external view returns (string[] memory) {
        return productList;
    }
    
    /**
     * @dev Obtiene información de un pago
     */
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
        Payment memory payment = payments[_orderId];
        return (
            payment.user,
            payment.productId,
            payment.amount,
            payment.timestamp
        );
    }
    
    /**
     * @dev Verifica si una orden ya fue procesada
     */
    function isOrderProcessed(string memory _orderId) external view returns (bool) {
        return payments[_orderId].timestamp != 0;
    }
    
    /**
     * @dev Obtiene el número total de órdenes
     */
    function getTotalOrders() external view returns (uint256) {
        return orderList.length;
    }
    
    /**
     * @dev Obtiene los pagos de un usuario
     */
    function getUserPayments(address _user, uint256 _limit) 
        external 
        view 
        returns (string[] memory) 
    {
        uint256 count = 0;
        
        // Contar cuántos pagos tiene el usuario
        for (uint256 i = 0; i < orderList.length; i++) {
            if (payments[orderList[i]].user == _user) {
                count++;
            }
        }
        
        // Limitar resultados
        uint256 resultSize = count > _limit ? _limit : count;
        string[] memory userOrders = new string[](resultSize);
        
        uint256 index = 0;
        // Obtener las últimas órdenes del usuario
        for (uint256 i = orderList.length; i > 0 && index < resultSize; i--) {
            if (payments[orderList[i - 1]].user == _user) {
                userOrders[index] = orderList[i - 1];
                index++;
            }
        }
        
        return userOrders;
    }
}