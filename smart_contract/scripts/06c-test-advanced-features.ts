import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Định nghĩa interface cho token info
interface TokenInfo {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  name: string;
}

/**
 * Script test tích hợp các tính năng nâng cao
 * Chức năng:
 * - Test tích hợp PriceOracle với SimpleDEX
 * - Test tích hợp LiquidityMining với SimpleDEX
 * - Kiểm tra tính năng staking và reward
 * - Lưu kết quả test
 */
async function main() {
  console.log("🧪 Đang test tích hợp các tính năng nâng cao...\n");

  // Lấy thông tin người deploy (ví chính)
  const [deployer] = await ethers.getSigners();
  console.log("📍 Địa chỉ người test:", deployer.address);

  // Đọc thông tin deployment từ các file JSON
  const tokens: any = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  // Đọc thông tin PriceOracle deployment
  let priceOracleAddress = "";
  try {
    const priceOracleDeployment = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../info/PriceOracleDeployment.json"), "utf8")
    );
    if (priceOracleDeployment.priceOracle.status === "success") {
      priceOracleAddress = priceOracleDeployment.priceOracle.address;
    }
  } catch (error) {
    console.log("⚠️ Không tìm thấy file PriceOracleDeployment.json");
  }

  // Đọc thông tin LiquidityMining deployment
  let liquidityMiningAddress = "";
  try {
    const liquidityMiningDeployment = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../info/LiquidityMiningDeployment.json"), "utf8")
    );
    if (liquidityMiningDeployment.liquidityMining.status === "success") {
      liquidityMiningAddress = liquidityMiningDeployment.liquidityMining.address;
    }
  } catch (error) {
    console.log("⚠️ Không tìm thấy file LiquidityMiningDeployment.json");
  }

  // Khởi tạo object để lưu kết quả test
  const testResults = {
    timestamp: new Date().toISOString(),
    integrationTests: {
      priceOracle: { status: "pending", results: {} },
      liquidityMining: { status: "pending", results: {} }
    }
  };

  // ===== TEST TÍCH HỢP PRICE ORACLE =====
  if (priceOracleAddress) {
    console.log("\n" + "=".repeat(50));
    console.log("📊 Test tích hợp Price Oracle với SimpleDEX");
    console.log("=".repeat(50));

    try {
      // Lấy contract instances
      const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);
      const priceOracle = await ethers.getContractAt("PriceOracle", priceOracleAddress);

      // Lấy thông tin token để test
      const tokenEntries = Object.entries(tokens);
      const [token1Name, token1Info]: [string, any] = tokenEntries[0];
      const [token2Name, token2Info]: [string, any] = tokenEntries[1];

      console.log(`\n📋 Test với cặp token: ${token1Name}-${token2Name}`);

      // Test 1: So sánh giá từ PriceOracle với giá từ SimpleDEX
      console.log("\n🧮 Test 1: So sánh giá từ các nguồn khác nhau...");

      // Lấy giá từ PriceOracle
      const oraclePrice = await priceOracle.getPrice(token1Info.tokenAddress, token2Info.tokenAddress);
      console.log(`📊 Giá từ PriceOracle: ${ethers.utils.formatEther(oraclePrice)} ${token2Info.symbol} per ${token1Info.symbol}`);

      // Lấy giá từ SimpleDEX
      const dexPrice = await simpleDex.getPrice(token1Info.tokenAddress, token2Info.tokenAddress);
      console.log(`📈 Giá từ SimpleDEX: ${ethers.utils.formatEther(dexPrice)} ${token2Info.symbol} per ${token1Info.symbol}`);

      // Tính toán chênh lệch
      const priceDifference = oraclePrice.sub(dexPrice).abs();
      const priceDifferencePercent = priceDifference.mul(100).div(oraclePrice);
      console.log(`📊 Chênh lệch giá: ${ethers.utils.formatEther(priceDifference)} ${token2Info.symbol} (${priceDifferencePercent}%)`);

      // Test 2: Cập nhật giá và kiểm tra
      console.log("\n🔄 Test 2: Cập nhật giá và kiểm tra...");
      
      // Cập nhật giá mới (1 BTC = 20 ETH)
      const newPrice = ethers.utils.parseEther("20");
      const updateTx = await priceOracle.updatePrice(token1Info.tokenAddress, token2Info.tokenAddress, newPrice);
      await updateTx.wait();
      console.log(`✅ Đã cập nhật giá: 1 ${token1Info.symbol} = 20 ${token2Info.symbol}`);

      // Kiểm tra giá đã cập nhật
      const updatedOraclePrice = await priceOracle.getPrice(token1Info.tokenAddress, token2Info.tokenAddress);
      console.log(`📊 Giá đã cập nhật: ${ethers.utils.formatEther(updatedOraclePrice)} ${token2Info.symbol} per ${token1Info.symbol}`);

      // Lưu kết quả test PriceOracle
      testResults.integrationTests.priceOracle = {
        status: "success",
        results: {
          originalOraclePrice: ethers.utils.formatEther(oraclePrice),
          dexPrice: ethers.utils.formatEther(dexPrice),
          priceDifference: ethers.utils.formatEther(priceDifference),
          priceDifferencePercent: priceDifferencePercent.toString(),
          updatedPrice: ethers.utils.formatEther(updatedOraclePrice),
          testTokens: `${token1Name}-${token2Name}`
        }
      };

      console.log("✅ Test tích hợp PriceOracle thành công!");

    } catch (error) {
      console.log("❌ Test tích hợp PriceOracle thất bại:", error.message);
      testResults.integrationTests.priceOracle = {
        status: "failed",
        error: error.message
      };
    }
  } else {
    console.log("⚠️ Bỏ qua test PriceOracle - chưa có deployment");
    testResults.integrationTests.priceOracle = {
      status: "skipped",
      reason: "No PriceOracle deployment found"
    };
  }

  // ===== TEST TÍCH HỢP LIQUIDITY MINING =====
  if (liquidityMiningAddress) {
    console.log("\n" + "=".repeat(50));
    console.log("⛏️ Test tích hợp Liquidity Mining với SimpleDEX");
    console.log("=".repeat(50));

    try {
      // Lấy contract instances
      const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);
      const liquidityMining = await ethers.getContractAt("LiquidityMining", liquidityMiningAddress);

      // Lấy thông tin token để test
      const tokenEntries = Object.entries(tokens);
      const [token1Name, token1Info] = tokenEntries[0];
      const [token2Name, token2Info] = tokenEntries[1];
      const usdtInfo = tokens["Tether USD"];

      console.log(`\n📋 Test với pool: ${token1Name}-${token2Name}`);

      // Test 1: Kiểm tra thông tin pool trong LiquidityMining
      console.log("\n📊 Test 1: Kiểm tra thông tin pool...");
      
      const poolInfo = await liquidityMining.getPoolInfo(token1Info.tokenAddress);
      console.log(`📈 Thông tin pool:`);
      console.log(`   • Total staked: ${poolInfo.totalStaked}`);
      console.log(`   • Reward rate: ${ethers.utils.formatUnits(poolInfo.rewardRate, usdtInfo.decimals)} ${usdtInfo.symbol}/giây`);
      console.log(`   • Last update time: ${new Date(poolInfo.lastUpdateTime * 1000).toLocaleString()}`);

      // Test 2: Kiểm tra thông tin liquidity trong SimpleDEX
      console.log("\n🏊 Test 2: Kiểm tra thông tin liquidity...");
      
      const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      const totalLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
      const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);

      console.log(`📊 Thông tin liquidity:`);
      console.log(`   • Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
      console.log(`   • Total liquidity: ${ethers.utils.formatUnits(totalLiquidity, 18)}`);
      console.log(`   • User liquidity: ${ethers.utils.formatUnits(userLiquidity, 18)}`);

      // Test 3: Tính toán reward tiềm năng
      console.log("\n🎁 Test 3: Tính toán reward tiềm năng...");
      
      const rewardRate = poolInfo.rewardRate;
      const dailyReward = rewardRate.mul(24 * 60 * 60); // Reward rate * số giây trong ngày
      const weeklyReward = dailyReward.mul(7); // Reward trong 1 tuần
      const monthlyReward = dailyReward.mul(30); // Reward trong 1 tháng

      console.log(`📅 Tính toán reward:`);
      console.log(`   • Reward mỗi ngày: ${ethers.utils.formatUnits(dailyReward, usdtInfo.decimals)} ${usdtInfo.symbol}`);
      console.log(`   • Reward mỗi tuần: ${ethers.utils.formatUnits(weeklyReward, usdtInfo.decimals)} ${usdtInfo.symbol}`);
      console.log(`   • Reward mỗi tháng: ${ethers.utils.formatUnits(monthlyReward, usdtInfo.decimals)} ${usdtInfo.symbol}`);

      // Test 4: Kiểm tra thông tin reward token
      console.log("\n💰 Test 4: Kiểm tra thông tin reward token...");
      
      const rewardTokenAddress = await liquidityMining.rewardToken();
      const totalRewards = await liquidityMining.totalRewards();
      const startTime = await liquidityMining.startTime();
      const endTime = await liquidityMining.endTime();

      console.log(`📊 Thông tin reward token:`);
      console.log(`   • Token address: ${rewardTokenAddress}`);
      console.log(`   • Total rewards: ${ethers.utils.formatUnits(totalRewards, usdtInfo.decimals)} ${usdtInfo.symbol}`);
      console.log(`   • Start time: ${new Date(startTime * 1000).toLocaleString()}`);
      console.log(`   • End time: ${new Date(endTime * 1000).toLocaleString()}`);

      // Lưu kết quả test LiquidityMining
      testResults.integrationTests.liquidityMining = {
        status: "success",
        results: {
          poolInfo: {
            totalStaked: poolInfo.totalStaked.toString(),
            rewardRate: ethers.utils.formatUnits(poolInfo.rewardRate, usdtInfo.decimals),
            lastUpdateTime: new Date(poolInfo.lastUpdateTime * 1000).toISOString()
          },
          liquidityInfo: {
            reserves: {
              token1: ethers.utils.formatUnits(reserves[0], token1Info.decimals),
              token2: ethers.utils.formatUnits(reserves[1], token2Info.decimals)
            },
            totalLiquidity: ethers.utils.formatUnits(totalLiquidity, 18),
            userLiquidity: ethers.utils.formatUnits(userLiquidity, 18)
          },
          rewardCalculation: {
            dailyReward: ethers.utils.formatUnits(dailyReward, usdtInfo.decimals),
            weeklyReward: ethers.utils.formatUnits(weeklyReward, usdtInfo.decimals),
            monthlyReward: ethers.utils.formatUnits(monthlyReward, usdtInfo.decimals)
          },
          rewardTokenInfo: {
            address: rewardTokenAddress,
            totalRewards: ethers.utils.formatUnits(totalRewards, usdtInfo.decimals),
            startTime: new Date(startTime * 1000).toISOString(),
            endTime: new Date(endTime * 1000).toISOString()
          },
          testPool: `${token1Name}-${token2Name}`
        }
      };

      console.log("✅ Test tích hợp LiquidityMining thành công!");

    } catch (error) {
      console.log("❌ Test tích hợp LiquidityMining thất bại:", error.message);
      testResults.integrationTests.liquidityMining = {
        status: "failed",
        error: error.message
      };
    }
  } else {
    console.log("⚠️ Bỏ qua test LiquidityMining - chưa có deployment");
    testResults.integrationTests.liquidityMining = {
      status: "skipped",
      reason: "No LiquidityMining deployment found"
    };
  }

  // ===== LƯU KẾT QUẢ TEST =====
  console.log("\n💾 Đang lưu kết quả test...");
  
  // Tạo thư mục info nếu chưa có
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }
  
  // Lưu kết quả vào file JSON
  fs.writeFileSync(
    path.resolve(infoDir, "AdvancedFeaturesIntegrationTest.json"),
    JSON.stringify(testResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("🎉 HOÀN THÀNH TEST TÍCH HỢP TÍNH NĂNG NÂNG CAO!");
  console.log("=".repeat(50));
  
  // Hiển thị kết quả PriceOracle
  if (testResults.integrationTests.priceOracle.status === "success") {
    console.log("✅ PriceOracle Integration: Thành công");
    const results = testResults.integrationTests.priceOracle.results;
    console.log(`   • Chênh lệch giá: ${results.priceDifferencePercent}%`);
    console.log(`   • Giá đã cập nhật: ${results.updatedPrice} ETH per BTC`);
  } else if (testResults.integrationTests.priceOracle.status === "skipped") {
    console.log("⚠️ PriceOracle Integration: Bỏ qua (chưa có deployment)");
  } else {
    console.log("❌ PriceOracle Integration: Thất bại");
  }

  // Hiển thị kết quả LiquidityMining
  if (testResults.integrationTests.liquidityMining.status === "success") {
    console.log("✅ LiquidityMining Integration: Thành công");
    const results = testResults.integrationTests.liquidityMining.results;
    console.log(`   • Reward mỗi ngày: ${results.rewardCalculation.dailyReward} USDT`);
    console.log(`   • Total staked: ${results.poolInfo.totalStaked}`);
  } else if (testResults.integrationTests.liquidityMining.status === "skipped") {
    console.log("⚠️ LiquidityMining Integration: Bỏ qua (chưa có deployment)");
  } else {
    console.log("❌ LiquidityMining Integration: Thất bại");
  }
  
  console.log("📁 Kết quả đã lưu vào: info/AdvancedFeaturesIntegrationTest.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Xây dựng frontend để tương tác với các tính năng");
  console.log("2. Thêm tính năng staking/unstaking liquidity");
  console.log("3. Thêm tính năng claim reward");
  console.log("4. Tích hợp với ví người dùng");
  console.log("5. Thêm tính năng quản lý pool");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 