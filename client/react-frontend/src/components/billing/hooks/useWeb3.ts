// src/hooks/useWeb3.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ABIs simplificados
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const PAYMENT_GATEWAY_ABI = [
  'function processPayment(string memory _productId, string memory _orderId) external',
  'event PaymentProcessed(address indexed user, string indexed orderId, string productId, uint256 amount, uint256 timestamp)',
];


export interface UseWeb3Return {
  // Estado
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  balance: string;
  usdtBalance: string;
  
  // Métodos
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  
  // Transacciones
  approveUSDT: (amount: string) => Promise<string>;
  processPayment: (productId: string, orderId: string) => Promise<string>;
  checkAllowance: () => Promise<string>;
}

export const useWeb3 = (
  usdtAddress?: string,
  paymentGatewayAddress?: string
): UseWeb3Return => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Detectar cambios en MetaMask
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Verificar si ya está conectado
      checkIfConnected();

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Actualizar balances cuando cambie la dirección
  useEffect(() => {
    if (address && provider) {
      updateBalances();
    }
  }, [address, provider, usdtAddress]);

  const checkIfConnected = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connect();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0]);
    }
  };

  const handleChainChanged = (chainIdHex: string) => {
    setChainId(parseInt(chainIdHex, 16));
    window.location.reload(); // Recargar para evitar inconsistencias
  };

  const connect = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask no está instalado');
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      await updateBalances();
    } catch (error: any) {
      console.error('Error connecting:', error);
      throw new Error(error.message || 'Error al conectar wallet');
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setBalance('0');
    setUsdtBalance('0');
    setProvider(null);
    setSigner(null);
  };

  const switchNetwork = async (targetChainId: number) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Si la red no existe, agregarla
      if (error.code === 4902) {
        await addNetwork(targetChainId);
      } else {
        throw error;
      }
    }
  };

  const addNetwork = async (targetChainId: number) => {
    const networks: Record<number, any> = {
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        rpcUrls: ['https://rpc.sepolia.org'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
      97: {
        chainId: '0x61',
        chainName: 'BSC Testnet',
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        blockExplorerUrls: ['https://testnet.bscscan.com'],
      },
    };

    const networkData = networks[targetChainId];
    if (!networkData) {
      throw new Error('Red no soportada');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkData],
    });
  };

  const updateBalances = async () => {
    if (!address || !provider) return;

    try {
      // Balance nativo (ETH/BNB)
      const ethBalance = await provider.getBalance(address);
      console.log('ETH Balance:', ethBalance.toString());
      setBalance(ethers.formatEther(ethBalance));

      // Balance USDT
      if (usdtAddress) {
        const usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, provider);
        const usdtBal = await usdtContract.balanceOf(address);
        console.log('USDT Balance:', usdtBal.toString());
        setUsdtBalance(ethers.formatUnits(usdtBal, 6)); // USDT tiene 6 decimales
      }
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  const approveUSDT = async (amount: string): Promise<string> => {
    if (!signer || !usdtAddress || !paymentGatewayAddress) {
      throw new Error('Wallet no conectado o direcciones no configuradas');
    }

    try {
      const usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 6); // USDT tiene 6 decimales
      
      const tx = await usdtContract.approve(paymentGatewayAddress, amountWei);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error approving USDT:', error);
      throw new Error(error.message || 'Error al aprobar USDT');
    }
  };

  const checkAllowance = async (): Promise<string> => {
    if (!provider || !address || !usdtAddress || !paymentGatewayAddress) {
      return '0';
    }

    try {
      const usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, provider);
      const allowance = await usdtContract.allowance(address, paymentGatewayAddress);
      return ethers.formatUnits(allowance, 6);
    } catch (error) {
      console.error('Error checking allowance:', error);
      return '0';
    }
  };

  const processPayment = async (productId: string, orderId: string): Promise<string> => {
    if (!signer || !paymentGatewayAddress) {
      throw new Error('Wallet no conectado o dirección de gateway no configurada');
    }

    try {
      const gatewayContract = new ethers.Contract(
        paymentGatewayAddress,
        PAYMENT_GATEWAY_ABI,
        signer
      );
      
      const tx = await gatewayContract.processPayment(productId, orderId);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      throw new Error(error.message || 'Error al procesar pago');
    }
  };

  return {
    address,
    isConnected,
    chainId,
    balance,
    usdtBalance,
    connect,
    disconnect,
    switchNetwork,
    approveUSDT,
    processPayment,
    checkAllowance,
  };
};

// Tipos para window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}