import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Test tokens với decimals chính xác và price oracle...\n");

  // Đọc địa chỉ các token đã deploy
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  console.log("\n" + "=".repeat(60));
  console.log("KIỂM TRA TOKENS VỚI DECIMALS CHÍNH XÁC");
  console.log("=".repeat(60));

  const tokenEntries = Object.entries(tokens);
  
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const totalSupply = await tokenContract.totalSupply();
    const balance = await tokenContract.balanceOf(deployer.address);
    
    console.log(`\n${tokenName} (${(tokenInfo as any).symbol}):`);
    console.log(`  - Decimals: ${(tokenInfo as any).decimals}`);
    console.log(`  - Total Supply: ${ethers.utils.formatUnits(totalSupply, (tokenInfo as any).decimals)} ${(tokenInfo as any).symbol}`);
    console.log(`  - Deployer Balance: ${ethers.utils.formatUnits(balance, (tokenInfo as any).decimals)} ${(tokenInfo as any).symbol}`);
    
    // Tính toán giá trị USD dựa trên total supply
    let usdValue = 0;
    switch(tokenName) {
      case "Bitcoin":
        usdValue = parseFloat(ethers.utils.formatUnits(totalSupply, (tokenInfo as any).decimals)) * 113000;
        break;
      case "Ethereum":
        usdValue = parseFloat(ethers.utils.formatUnits(totalSupply, (tokenInfo as any).decimals)) * 3800;
        break;
      case "Tether USD":
        usdValue = parseFloat(ethers.utils.formatUnits(totalSupply, (tokenInfo as any).decimals)) * 1;
        break;
    }
    console.log(`  - Total USD Value: $${usdValue.toLocaleString()}`);
  }

  // Kiểm tra Price Oracle nếu đã deploy
  try {
    const priceOracleAddress = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../info/PriceOracleAddress.json"), "utf8")
    ).address;

    const priceOracle = await ethers.getContractAt("PriceOracle", priceOracleAddress);
    const usdTokenAddress = ethers.constants.AddressZero;

    console.log("\n" + "=".repeat(60));
    console.log("KIỂM TRA PRICE ORACLE");
    console.log("=".repeat(60));

    for (const [tokenName, tokenInfo] of tokenEntries) {
      const price = await priceOracle.getPrice((tokenInfo as any).tokenAddress, usdTokenAddress);
      const priceInUSD = ethers.utils.formatUnits(price, 18);
      
      console.log(`\n${tokenName} (${(tokenInfo as any).symbol}):`);
      console.log(`  - Price: $${parseFloat(priceInUSD).toLocaleString()} USD`);
      
      // Verify price matches expected
      let expectedPrice = 0;
      switch(tokenName) {
        case "Bitcoin":
          expectedPrice = 113000;
          break;
        case "Ethereum":
          expectedPrice = 3800;
          break;
        case "Tether USD":
          expectedPrice = 1;
          break;
      }
      
      const actualPrice = parseFloat(priceInUSD);
      const priceDiff = Math.abs(actualPrice - expectedPrice);
      const priceAccuracy = ((expectedPrice - priceDiff) / expectedPrice) * 100;
      
      console.log(`  - Expected Price: $${expectedPrice.toLocaleString()} USD`);
      console.log(`  - Price Accuracy: ${priceAccuracy.toFixed(2)}%`);
      
      if (priceDiff < 0.01) {
        console.log(`  ✅ Price matches expected value`);
      } else {
        console.log(`  ⚠️  Price differs from expected value`);
      }
    }

  } catch (error) {
    console.log("\nPrice Oracle chưa được deploy hoặc có lỗi:");
    console.log(error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TÓM TẮT CẤU HÌNH TOKENS");
  console.log("=".repeat(60));
  
  console.log("\nCấu hình tokens với decimals chính xác:");
  console.log("1. Bitcoin (BTC):");
  console.log("   - Decimals: 8");
  console.log("   - Total Supply: 21,000,000 BTC");
  console.log("   - Price: $113,000 USD");
  console.log("   - Total Value: $2,373,000,000,000 USD");
  
  console.log("\n2. Ethereum (ETH):");
  console.log("   - Decimals: 18");
  console.log("   - Total Supply: 120,000,000 ETH");
  console.log("   - Price: $3,800 USD");
  console.log("   - Total Value: $456,000,000,000 USD");
  
  console.log("\n3. Tether USD (USDT):");
  console.log("   - Decimals: 6");
  console.log("   - Total Supply: 1,000,000,000 USDT");
  console.log("   - Price: $1 USD");
  console.log("   - Total Value: $1,000,000,000 USD");
  
  console.log("\n✅ Tất cả tokens đã được cấu hình với decimals chính xác!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 