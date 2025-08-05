import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🏦 Deploying SimpleDEX...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  // Deploy SimpleDEX
  console.log("🚀 Deploying SimpleDEX contract...");
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDex = await SimpleDEX.deploy();
  await simpleDex.deployed();

  console.log("✅ SimpleDEX deployed at:", simpleDex.address);

  // Save SimpleDEX address
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  const simpleDexInfo = {
    address: simpleDex.address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    network: "sepolia"
  };

  fs.writeFileSync(
    path.resolve(infoDir, "SimpleDEXAddress.json"),
    JSON.stringify(simpleDexInfo, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("🎉 SIMPLEDEX DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(50));
  console.log("📁 SimpleDEX address saved to: info/SimpleDEXAddress.json");
  console.log("📋 Next step: Run 03-approve-tokens.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 