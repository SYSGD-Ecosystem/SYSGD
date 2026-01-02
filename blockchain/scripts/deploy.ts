import { network } from "hardhat";

async function main() {
  console.log("🚀 Iniciando deployment...");

  // Conectar a la red (esto es requerido en Hardhat 3)
  const { viem } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  // Ahora sí podemos obtener los clientes
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();
  
  console.log("📍 Deploying con:", deployer.account.address);

  // 1. Deploy TestUSDT
  console.log("\n📝 Deployando TestUSDT...");
  const testUSDT = await viem.deployContract("TestUSDT");
  console.log("✅ TestUSDT deployed a:", testUSDT.address);

  // 2. Deploy PaymentGateway
  console.log("\n📝 Deployando PaymentGateway...");
  const treasuryWallet ="0x18f541A2dcC987E4380a8636dF08F4AF518cFF42" //process.env.TREASURY_WALLET || deployer.account.address;
  console.log("💼 Treasury wallet:", treasuryWallet);

  const paymentGateway = await viem.deployContract("PaymentGateway", [
    testUSDT.address,
    treasuryWallet,
  ]);
  console.log("✅ PaymentGateway deployed a:", paymentGateway.address);

  // 3. Verificar productos
  console.log("\n📦 Verificando productos...");
  const productList = await paymentGateway.read.getAllProducts();
  console.log("Total de productos:", productList.length);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETADO");
  console.log("=".repeat(60));
  console.log("📋 Resumen:");
  console.log("  TestUSDT:", testUSDT.address);
  console.log("  PaymentGateway:", paymentGateway.address);
  console.log("  Treasury:", treasuryWallet);
  console.log("=".repeat(60));
  
  console.log("\n📝 Guarda en tu .env:");
  console.log(`TESTUSDT_CONTRACT_ADDRESS=${testUSDT.address}`);
  console.log(`PAYMENT_GATEWAY_CONTRACT_ADDRESS=${paymentGateway.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });