import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("...Đang deploy tokens...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Người deploy có địa chỉ  :", deployer.address);

  // Token configurations
  const tokens = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
      totalSupply: "1000000000" // 1B BTC
    },
    {
      name: "Ethereum", 
      symbol: "ETH",
      decimals: 18,
      totalSupply: "1000000000" // 1B ETH
    },
    {
      name: "Tether USD",
      symbol: "USDT", 
      decimals: 6,
      totalSupply: "1000000000" // 1B USDT
    }
  ];

  const deployedTokens: any = {};

  for (const tokenConfig of tokens) {
    console.log(`\n ...Đang deploy token có thông tin : ${tokenConfig.name} (${tokenConfig.symbol})...`);
    
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
      tokenConfig.name,
      tokenConfig.symbol,
      tokenConfig.decimals,
      ethers.utils.parseUnits(tokenConfig.totalSupply, tokenConfig.decimals)
    );
    
    await token.deployed();
    
    console.log(`Đã deploy token có tên : ${tokenConfig.name} và có địa chỉ : ${token.address}`);
    console.log(`Với tổng cung : ${tokenConfig.totalSupply} - ${tokenConfig.symbol}`);
    
    deployedTokens[tokenConfig.name] = {
      tokenAddress: token.address,
      symbol: tokenConfig.symbol,
      decimals: tokenConfig.decimals,
      totalSupply: tokenConfig.totalSupply,
      deployedAt: new Date().toISOString()
    };
  }

  // Lưu lại thông tin token
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "TokenAddress.json"),
    JSON.stringify(deployedTokens, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("...Tất cả token đã được deploy...");
  console.log("=".repeat(50));
  console.log("Thông tin về token được lưu tại : info/TokenAddress.json");
  console.log("Bước tiếp theo sẽ là 02-deploy-simple-dex.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 