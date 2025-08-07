import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Check Price Oracle...\n");

  // Đọc địa chỉ Price Oracle đã deploy
  const priceOracleInfo = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/PriceOracleAddress.json"), "utf8")
  );

  // Đọc địa chỉ các token
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );

  // Lấy thông tin người deploy
  const [deployer] = await ethers.getSigners();
  
  console.log("Người deploy:", deployer.address);
  console.log("Price Oracle Address:", priceOracleInfo.address);

  // Lấy địa chỉ USD token (sử dụng địa chỉ zero như trong script deploy)
  const usdTokenAddress = ethers.constants.AddressZero;

  console.log("\n" + "=".repeat(50));
  console.log("CHECK PRICE ORACLE");
  console.log("=".repeat(50));

  try {
    // Kết nối đến Price Oracle contract
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = PriceOracle.attach(priceOracleInfo.address);

    console.log("Đã kết nối đến Price Oracle contract");
    console.log("Base currency: USD");

    // Kiểm tra giá của tất cả các token
    const tokenEntries = Object.entries(tokens);
    
    for (const [tokenName, tokenInfo] of tokenEntries) {
      try {
        // Lấy giá từ PriceOracle
        const price = await priceOracle.getPrice(tokenInfo.tokenAddress, usdTokenAddress);
        const priceInUSD = ethers.utils.formatUnits(price, 18);
        
        console.log(`\n${tokenName} (${tokenInfo.symbol}):`);
        console.log(`  - Token Address: ${tokenInfo.tokenAddress}`);
        console.log(`  - Price: $${priceInUSD} USD`);
        console.log(`  - Price (wei): ${price.toString()}`);

        // Lấy thông tin chi tiết về giá
        const priceData = await priceOracle.getPriceData(tokenInfo.tokenAddress, usdTokenAddress);
        console.log(`  - Timestamp: ${priceData.timestamp}`);
        console.log(`  - Block Number: ${priceData.blockNumber}`);

      } catch (error: any) {
        console.error(`Lỗi khi lấy giá ${tokenName}:`, error.message);
      }
    }

  } catch (error: any) {
    console.error("Lỗi khi kiểm tra Price Oracle:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 