import { network } from "hardhat";

async function main() {
  console.log("🚀 Iniciando deployment...");

  const { viem } = await network.connect({ network: "sepolia", chainType: "l1" });
  const [deployer] = await viem.getWalletClients();
  console.log("📍 Deploying con:", deployer.account.address);

  const testUSDT = { address: "0xbf1d573d4ce347b7ba0f198028cca36df7aeaf9b" };
  console.log("✅ TestUSDT ya desplegado a:", testUSDT.address);

  console.log("\n📝 Deployando PaymentGateway...");
  const treasuryWallet = "0x18f541A2dcC987E4380a8636dF08F4AF518cFF42";
  
  const paymentGateway = await viem.deployContract("PaymentGateway", [
    testUSDT.address,
    treasuryWallet,
  ]);
  console.log("✅ PaymentGateway deployed a:", paymentGateway.address);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETADO");
  console.log("=".repeat(60));
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
  .catch((error) => { console.error("❌ Error:", error); process.exit(1); });