import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  const [user] = await viem.getWalletClients();
  const testUSDT = await viem.getContractAt(
    "TestUSDT",
    "0xbf1d573d4ce347b7ba0f198028cca36df7aeaf9b"
  );

  console.log("🪙 Solicitando tokens de prueba...");
  console.log("Usuario:", user.account.address);

  const tx = await testUSDT.write.requestTokens();
  console.log("✅ Tokens solicitados! TX:", tx);

  // Verificar balance
  const balance = await testUSDT.read.balanceOf([user.account.address]);
  console.log("💰 Balance actual:", Number(balance) / 10**6, "TUSDT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });