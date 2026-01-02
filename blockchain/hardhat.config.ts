import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import { configVariable, defineConfig } from "hardhat/config";
import "dotenv/config"; // Agregar esto

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});





// import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
// import "@nomicfoundation/hardhat-verify";
// import { configVariable, defineConfig } from "hardhat/config";

// export default defineConfig({
//   plugins: [hardhatToolboxViemPlugin],
//   solidity: {
//     profiles: {
//       default: {
//         version: "0.8.28",
//       },
//       production: {
//         version: "0.8.28",
//         settings: {
//           optimizer: {
//             enabled: true,
//             runs: 200,
//           },
//         },
//       },
//     },
//   },
//   networks: {
//     hardhatMainnet: {
//       type: "edr-simulated",
//       chainType: "l1",
//     },
//     hardhatOp: {
//       type: "edr-simulated",
//       chainType: "op",
//     },
//     sepolia: {
//       type: "http",
//       chainType: "l1",
//       url: configVariable("SEPOLIA_RPC_URL"),
//       accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
//     },
//   },
// });


// import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";
// import "@nomicfoundation/hardhat-verify";
// import * as dotenv from "dotenv";

// dotenv.config();

// const config: HardhatUserConfig = {
//   solidity: {
//     version: "0.8.20",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200,
//       },
//     },
//   },
//   networks: {
//     // Sepolia Testnet (Ethereum)
//     sepolia: {
//       url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//       chainId: 11155111,
//     },
//     // BSC Testnet
//     bscTestnet: {
//       url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//       chainId: 97,
//     },
//     // BSC Mainnet
//     bsc: {
//       url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//       chainId: 56,
//     },
//     // Ethereum Mainnet
//     mainnet: {
//       url: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//       chainId: 1,
//     },
//   },
//   etherscan: {
//     apiKey: {
//       sepolia: process.env.ETHERSCAN_API_KEY || "",
//       bsc: process.env.BSCSCAN_API_KEY || "",
//       bscTestnet: process.env.BSCSCAN_API_KEY || "",
//     },
//   },
//   paths: {
//     sources: "./contracts",
//     tests: "./test",
//     cache: "./cache",
//     artifacts: "./artifacts",
//   },
// };

// export default config;
