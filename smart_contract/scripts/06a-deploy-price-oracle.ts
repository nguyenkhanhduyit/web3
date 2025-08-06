import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploy Price Oracle...\n");

  // Đọc địa chỉ các token đã deploy
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );

  // Lấy thông tin người deploy
  const [deployer] = await ethers.getSigners();
  
  console.log("Người deploy:", deployer.address);

  // Lưu kết quả deploy
  const deployResults: any = {
    timestamp: new Date().toISOString(),
    deployName: "Price Oracle",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOY PRICE ORACLE");
  console.log("=".repeat(50));

  try {
    // Bước 1: Deploy Price Oracle contract
    console.log("Bước 1: Deploy Price Oracle contract...");
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy(
      { gasLimit: 3000000 } // Thêm gasLimit rõ ràng để tránh lỗi _hex
    );
    
    await priceOracle.deployed();
    console.log("Price Oracle đã được deploy thành công!");
    console.log("Địa chỉ Price Oracle:", priceOracle.address);

    // Bước 2: Thiết lập giá ban đầu cho các token
    console.log("Bước 2: Thiết lập giá ban đầu cho các token...");
    
    const tokenEntries = Object.entries(tokens);
    const priceUpdates: any = {};

    // Lấy địa chỉ USDT để làm base currency
    const usdtToken = tokens["Tether USD"];
    const usdtAddress = usdtToken.tokenAddress;

    for (const [tokenName, tokenInfo] of tokenEntries) {
      // Bỏ qua USDT vì nó là base currency
      if (tokenName === "Tether USD") {
        console.log(`Bỏ qua ${tokenName} vì đây là base currency`);
        continue;
      }

      console.log(`Thiết lập giá cho ${tokenName} (${tokenInfo.symbol})...`);
      
      // Tạo giá ngẫu nhiên cho mỗi token (1-1000 USDT)
      const randomPrice = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
      
      // Thiết lập giá: 1 token = randomPrice USDT
      // Price được tính theo wei (18 decimals)
      const priceInWei = ethers.utils.parseUnits(randomPrice.toString(), 18);
      
      const updatePriceTx = await priceOracle.updatePrice(
        tokenInfo.tokenAddress, // token0
        usdtAddress,           // token1 (USDT)
        priceInWei,
        { gasLimit: 200000 }
      );
      
      await updatePriceTx.wait();
      console.log(`Đã thiết lập giá ${tokenName}: 1 ${tokenInfo.symbol} = ${randomPrice} USDT`);
      
      priceUpdates[tokenName] = {
        tokenAddress: tokenInfo.tokenAddress,
        symbol: tokenInfo.symbol,
        priceInUSDT: randomPrice.toString(),
        priceInWei: priceInWei.toString(),
        transactionHash: updatePriceTx.hash
      };
    }

    // Bước 3: Test các hàm của Price Oracle
    console.log("Bước 3: Test các hàm của Price Oracle...");
    
    // Test getPrice - lấy giá của token đầu tiên so với USDT
    const [token1Name, token1Info] = tokenEntries[0];
    if (token1Name !== "Tether USD") {
      const price1 = await priceOracle.getPrice(token1Info.tokenAddress, usdtAddress);
      console.log(`Giá ${token1Name}: ${ethers.utils.formatUnits(price1, 18)} USDT`);

      // Test getPriceData
      const priceData = await priceOracle.getPriceData(token1Info.tokenAddress, usdtAddress);
      console.log(`Dữ liệu giá ${token1Name}:`);
      console.log(`  - Giá: ${ethers.utils.formatUnits(priceData.price, 18)} USDT`);
      console.log(`  - Timestamp: ${priceData.timestamp}`);
      console.log(`  - Block Number: ${priceData.blockNumber}`);

      // Test calculatePriceFromReserves (simulate với reserves giả)
      const reserve0 = ethers.utils.parseUnits("1000", token1Info.decimals); // 1000 tokens
      const reserve1 = ethers.utils.parseUnits("50000", usdtToken.decimals); // 50000 USDT
      const calculatedPrice = await priceOracle.calculatePriceFromReserves(
        reserve0,
        reserve1,
        token1Info.decimals,
        usdtToken.decimals
      );
      console.log(`Giá tính từ reserves: ${ethers.utils.formatUnits(calculatedPrice, 18)} USDT`);
    }

    // Bước 4: Lưu thông tin deploy
    const oracleInfo = {
      address: priceOracle.address,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      priceUpdates: priceUpdates,
      testResults: {
        price1: token1Name !== "Tether USD" ? ethers.utils.formatUnits(await priceOracle.getPrice(token1Info.tokenAddress, usdtAddress), 18) : "N/A",
        priceData: token1Name !== "Tether USD" ? await priceOracle.getPriceData(token1Info.tokenAddress, usdtAddress) : "N/A"
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

    console.log("\nDeploy Price Oracle hoàn thành thành công!");
    console.log("Thông tin đã lưu vào: info/PriceOracleAddress.json");

  } catch (error) {
    console.log("Lỗi khi deploy Price Oracle:", error.message);
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
  console.log("Kết quả deploy đã lưu vào: info/06a-deploy-price-oracle.json");
  console.log("Bước tiếp theo: Chạy 06b-deploy-liquidity-mining.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 