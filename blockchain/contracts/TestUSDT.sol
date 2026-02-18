// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDT
 * @dev Token ERC20 para testing que simula USDT
 * Características similares a USDT real:
 * - 6 decimales (igual que USDT)
 * - Función mint para testing
 * - Función faucet para que usuarios obtengan tokens de prueba
 */
contract TestUSDT is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    
    // Límite del faucet: 1000 USDT por solicitud
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**DECIMALS;
    
    // Cooldown del faucet: 24 horas
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    // Registro de última solicitud del faucet por dirección
    mapping(address => uint256) public lastFaucetRequest;
    
    event FaucetRequested(address indexed user, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("Test USDT", "TUSDT") Ownable(msg.sender) {
        // Mint inicial de 1 millón de TUSDT al deployer para testing
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }
    
    /**
     * @dev Retorna el número de decimales del token (6, igual que USDT)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Faucet para que usuarios obtengan tokens de prueba
     * Límite: 1000 TUSDT cada 24 horas por dirección
     */
    function requestTokens() external {
        require(
            block.timestamp >= lastFaucetRequest[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown active. Wait 24 hours."
        );
        
        lastFaucetRequest[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetRequested(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @dev Permite al owner hacer mint de tokens para testing
     * Solo para uso en testnet
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Verifica cuánto tiempo falta para poder usar el faucet nuevamente
     */
    function timeUntilNextFaucet(address user) external view returns (uint256) {
        uint256 lastRequest = lastFaucetRequest[user];
        if (lastRequest == 0) {
            return 0; // Nunca ha solicitado
        }
        
        uint256 nextAvailable = lastRequest + FAUCET_COOLDOWN;
        if (block.timestamp >= nextAvailable) {
            return 0; // Ya puede solicitar
        }
        
        return nextAvailable - block.timestamp;
    }
}