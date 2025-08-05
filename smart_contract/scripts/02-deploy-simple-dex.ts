import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang deploy SimpleDEX...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Người deploy có địa chỉ ví :", deployer.address);

  // Deploy SimpleDEX
  console.log("Đang Deploy SimpleDEX contract...");
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDex = await SimpleDEX.deploy();
  await simpleDex.deployed();

  console.log("Đã deploy SimleDex có địa chỉ là :", simpleDex.address);

  // Lưu lại thông tin SimpleDEX
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
  console.log("Đã Deploy SimpleDEX thành công");
  console.log("=".repeat(50));
  console.log("Thông tin về SimpleDEX lưu tại : info/SimpleDEXAddress.json");
  console.log("Bước tiếp theo là approve tokens : 03-approve-tokens.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 