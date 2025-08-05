import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🪙 Deploying tokens...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  // Token configurations
  const tokens = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
      totalSupply: "1000000" // 1M BTC
    },
    {
      name: "Ethereum", 
      symbol: "ETH",
      decimals: 18,
      totalSupply: "1000000" // 1M ETH
    },
    {
      name: "Tether USD",
      symbol: "USDT", 
      decimals: 6,
      totalSupply: "1000000" // 1M USDT
    }
  ];

  const deployedTokens: any = {};

  for (const tokenConfig of tokens) {
    console.log(`\n🚀 Deploying ${tokenConfig.name} (${tokenConfig.symbol})...`);
    
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
      tokenConfig.name,
      tokenConfig.symbol,
      tokenConfig.decimals,
      ethers.utils.parseUnits(tokenConfig.totalSupply, tokenConfig.decimals)
    );
    
    await token.deployed();
    
    console.log(`✅ ${tokenConfig.name} deployed at: ${token.address}`);
    console.log(`💰 Total supply: ${tokenConfig.totalSupply} ${tokenConfig.symbol}`);
    
    deployedTokens[tokenConfig.name] = {
      tokenAddress: token.address,
      symbol: tokenConfig.symbol,
      decimals: tokenConfig.decimals,
      totalSupply: tokenConfig.totalSupply,
      deployedAt: new Date().toISOString()
    };
  }

  // Save token addresses
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "TokenAddress.json"),
    JSON.stringify(deployedTokens, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("🎉 TOKENS DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(50));
  console.log("📁 Token addresses saved to: info/TokenAddress.json");
  console.log("📋 Next step: Run 02-deploy-simple-dex.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 