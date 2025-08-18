import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang deploy Swap Dex...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Người deploy có địa chỉ ví :", deployer.address);

  // Deploy SimpleDEX
  console.log("Đang Deploy Swap Dex contract...");
  const SwapDex = await ethers.getContractFactory("SwapDex");
  const swapDex = await SwapDex.deploy();
  await swapDex.deployed();

  console.log("Đã deploy Swap Dex có địa chỉ là :", swapDex.address);

  // Lưu lại thông tin SimpleDEX
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  const swapDexInfo = {
    address: swapDex.address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    network: "sepolia"
  };

  fs.writeFileSync(
    path.resolve(infoDir, "SwapDexAddress.json"),
    JSON.stringify(swapDexInfo, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("Đã Deploy SwapDex thành công");
  console.log("=".repeat(50));
  console.log("Thông tin về SwapDEX lưu tại : info/SwapDexAddress.json");
  console.log("Bước tiếp theo là approve tokens : 03-approve-tokens.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 