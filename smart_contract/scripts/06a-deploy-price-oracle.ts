import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔮 Deploy Price Oracle...\n");

  // Đọc địa chỉ các token đã deploy
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );

  // Lấy thông tin người deploy
  const [deployer] = await ethers.getSigners();
  
  console.log("📍 Người deploy:", deployer.address);

  // Lưu kết quả deploy
  const deployResults: any = {
    timestamp: new Date().toISOString(),
    deployName: "Price Oracle",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("🔮 DEPLOY PRICE ORACLE");
  console.log("=".repeat(50));

  try {
    // Bước 1: Deploy Price Oracle contract
    console.log("🔍 Bước 1: Deploy Price Oracle contract...");
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy(
      { gasLimit: 3000000 } // Thêm gasLimit rõ ràng để tránh lỗi _hex
    );
    
    await priceOracle.deployed();
    console.log("✅ Price Oracle đã được deploy thành công!");
    console.log("📍 Địa chỉ Price Oracle:", priceOracle.address);

    // Bước 2: Thiết lập giá ban đầu cho các token
    console.log("🔍 Bước 2: Thiết lập giá ban đầu cho các token...");
    
    const tokenEntries = Object.entries(tokens);
    const priceUpdates: any = {};

    for (const [tokenName, tokenInfo] of tokenEntries) {
      console.log(`💰 Thiết lập giá cho ${tokenName} (${tokenInfo.symbol})...`);
      
      // Thiết lập giá mặc định (1 token = 1 USD)
      const defaultPrice = ethers.utils.parseUnits("1", 8); // 8 decimals cho giá
      
      const setPriceTx = await priceOracle.setPrice(
        tokenInfo.tokenAddress,
        defaultPrice,
        { gasLimit: 200000 }
      );
      
      await setPriceTx.wait();
      console.log(`✅ Đã thiết lập giá ${tokenName}: 1 ${tokenInfo.symbol} = $1.00`);
      
      priceUpdates[tokenName] = {
        tokenAddress: tokenInfo.tokenAddress,
        symbol: tokenInfo.symbol,
        price: "1.00",
        priceInWei: defaultPrice.toString(),
        transactionHash: setPriceTx.hash
      };
    }

    // Bước 3: Test các hàm của Price Oracle
    console.log("🔍 Bước 3: Test các hàm của Price Oracle...");
    
    // Test getPrice
    const [token1Name, token1Info] = tokenEntries[0];
    const price1 = await priceOracle.getPrice(token1Info.tokenAddress);
    console.log(`📊 Giá ${token1Name}: ${ethers.utils.formatUnits(price1, 8)} USD`);

    // Test getPriceInUSD
    const amount = ethers.utils.parseUnits("10", token1Info.decimals);
    const priceInUSD = await priceOracle.getPriceInUSD(token1Info.tokenAddress, amount);
    console.log(`💰 Giá trị ${ethers.utils.formatUnits(amount, token1Info.decimals)} ${token1Info.symbol} = $${ethers.utils.formatUnits(priceInUSD, 8)}`);

    // Test hasPrice
    const hasPrice = await priceOracle.hasPrice(token1Info.tokenAddress);
    console.log(`🔍 ${token1Name} có giá: ${hasPrice}`);

    // Bước 4: Lưu thông tin deploy
    const oracleInfo = {
      address: priceOracle.address,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      priceUpdates: priceUpdates,
      testResults: {
        price1: ethers.utils.formatUnits(price1, 8),
        priceInUSD: ethers.utils.formatUnits(priceInUSD, 8),
        hasPrice: hasPrice
      }
    };

    // Lưu vào file
    const infoDir = path.resolve(__dirname, "../info");
    if (!fs.existsSync(infoDir)) {
      fs.mkdirSync(infoDir, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(infoDir, "PriceOracleAddress.json"),
      JSON.stringify(oracleInfo, null, 2)
    );

    deployResults.data = oracleInfo;
    deployResults.status = "success";

    console.log("\n✅ Deploy Price Oracle hoàn thành thành công!");
    console.log("📁 Thông tin đã lưu vào: info/PriceOracleAddress.json");

  } catch (error) {
    console.log("❌ Lỗi khi deploy Price Oracle:", error.message);
    deployResults.status = "failed";
    deployResults.error = error.message;
  }

  // Lưu kết quả deploy
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "06a-deploy-price-oracle.json"),
    JSON.stringify(deployResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("📁 Kết quả deploy đã lưu vào: info/06a-deploy-price-oracle.json");
  console.log("🎯 Bước tiếp theo: Chạy 06b-deploy-liquidity-mining.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 