import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script triển khai Liquidity Mining - Hệ thống khuyến khích cung cấp thanh khoản
 * Chức năng:
 * - Deploy contract LiquidityMining
 * - Thiết lập token reward (USDT)
 * - Thêm pool vào chương trình mining
 * - Tính toán reward rate
 * - Lưu thông tin deployment
 */
async function main() {
  console.log("⛏️ Đang triển khai Liquidity Mining cho SimpleDEX...\n");

  // Lấy thông tin người deploy (ví chính)
  const [deployer] = await ethers.getSigners();
  console.log("📍 Địa chỉ người deploy:", deployer.address);

  // Đọc thông tin token và SimpleDEX đã được deploy trước đó
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  // Khởi tạo object để lưu kết quả deployment
  const deploymentResults = {
    timestamp: new Date().toISOString(),
    liquidityMining: {
      status: "pending",
      address: "",
      configuration: {},
      testResults: {},
      timestamp: new Date().toISOString()
    }
  };

  // ===== TRIỂN KHAI LIQUIDITY MINING =====
  console.log("\n" + "=".repeat(50));
  console.log("⛏️ Đang triển khai Liquidity Mining");
  console.log("=".repeat(50));

  try {
    // Thiết lập thông tin reward token (sử dụng USDT)
    console.log("🎁 Đang thiết lập token reward...");
    const usdtInfo = tokens["Tether USD"];
    const rewardToken = usdtInfo.tokenAddress; // Địa chỉ token USDT
    
    // Thiết lập tổng số reward và thời gian
    const totalRewards = ethers.utils.parseUnits("10000", usdtInfo.decimals); // 10,000 USDT
    const duration = 30 * 24 * 60 * 60; // 30 ngày (tính bằng giây)
    
    console.log(`💰 Token reward: ${usdtInfo.symbol} (${rewardToken})`);
    console.log(`🎯 Tổng reward: ${ethers.utils.formatUnits(totalRewards, usdtInfo.decimals)} ${usdtInfo.symbol}`);
    console.log(`⏱️ Thời gian: ${duration / (24 * 60 * 60)} ngày`);

    // Lấy contract factory cho LiquidityMining
    const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
    
    // Deploy contract LiquidityMining với các tham số
    console.log("\n⏳ Đang deploy contract LiquidityMining...");
    const liquidityMining = await LiquidityMining.deploy(
      rewardToken,    // Địa chỉ token reward
      totalRewards,   // Tổng số reward
      duration        // Thời gian chương trình
    );
    
    // Chờ contract được deploy hoàn tất
    await liquidityMining.deployed();

    console.log("✅ LiquidityMining đã được deploy tại:", liquidityMining.address);

    // ===== KIỂM TRA TÍNH NĂNG LIQUIDITY MINING =====
    console.log("\n🧪 Đang kiểm tra tính năng Liquidity Mining...");

    // Lấy thông tin 2 token đầu tiên để tạo pool mining
    const tokenEntries = Object.entries(tokens);
    const [token1Name, token1Info] = tokenEntries[0]; // Token đầu tiên (ví dụ: BTC)
    const [token2Name, token2Info] = tokenEntries[1]; // Token thứ hai (ví dụ: ETH)

    console.log(`\n📋 Thông tin pool mining:`);
    console.log(`Pool: ${token1Name}-${token2Name}`);
    console.log(`Token1: ${token1Name} (${token1Info.symbol}) - ${token1Info.tokenAddress}`);
    console.log(`Token2: ${token2Name} (${token2Info.symbol}) - ${token2Info.tokenAddress}`);

    // Thiết lập reward rate cho pool (0.1 USDT mỗi giây)
    const rewardRate = ethers.utils.parseUnits("0.1", usdtInfo.decimals);
    console.log(`\n🏊 Đang thêm pool với reward rate: ${ethers.utils.formatUnits(rewardRate, usdtInfo.decimals)} ${usdtInfo.symbol}/giây`);
    
    // Thêm pool vào chương trình liquidity mining
    const addPoolTx = await liquidityMining.addPool(
      token1Info.tokenAddress, // Địa chỉ token1
      token2Info.tokenAddress, // Địa chỉ token2
      rewardRate               // Tốc độ reward
    );
    await addPoolTx.wait();
    console.log("✅ Pool đã được thêm vào chương trình mining!");

    // Lấy thông tin pool đã thêm
    console.log(`\n📊 Đang lấy thông tin pool...`);
    const poolInfo = await liquidityMining.getPoolInfo(token1Info.tokenAddress);
    console.log(`📈 Thông tin pool:`);
    console.log(`   • Total staked: ${poolInfo.totalStaked}`);
    console.log(`   • Reward rate: ${ethers.utils.formatUnits(poolInfo.rewardRate, usdtInfo.decimals)} ${usdtInfo.symbol}/giây`);
    console.log(`   • Last update time: ${new Date(poolInfo.lastUpdateTime * 1000).toLocaleString()}`);

    // Tính toán reward hàng ngày
    const dailyReward = rewardRate * 24 * 60 * 60; // Reward rate * số giây trong ngày
    const totalDailyReward = dailyReward * tokenPairs.length; // Tổng reward cho tất cả pool
    
    console.log(`\n📅 Tính toán reward:`);
    console.log(`   • Reward mỗi ngày cho pool này: ${ethers.utils.formatUnits(dailyReward, usdtInfo.decimals)} ${usdtInfo.symbol}`);
    console.log(`   • Tổng reward mỗi ngày: ${ethers.utils.formatUnits(totalDailyReward, usdtInfo.decimals)} ${usdtInfo.symbol}`);

    // Lưu kết quả test thành công
    deploymentResults.liquidityMining = {
      status: "success",
      address: liquidityMining.address,
      configuration: {
        rewardToken: {
          symbol: usdtInfo.symbol,
          address: rewardToken,
          totalRewards: ethers.utils.formatUnits(totalRewards, usdtInfo.decimals)
        },
        duration: duration / (24 * 60 * 60), // Chuyển về ngày
        rewardRate: ethers.utils.formatUnits(rewardRate, usdtInfo.decimals),
        dailyReward: ethers.utils.formatUnits(dailyReward, usdtInfo.decimals)
      },
      testResults: {
        poolAdded: `${token1Name}-${token2Name}`,
        totalStaked: poolInfo.totalStaked.toString(),
        rewardRate: ethers.utils.formatUnits(poolInfo.rewardRate, usdtInfo.decimals),
        lastUpdateTime: new Date(poolInfo.lastUpdateTime * 1000).toISOString()
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n✅ Tất cả test Liquidity Mining đã thành công!");

  } catch (error) {
    console.log("❌ Triển khai Liquidity Mining thất bại:", error.message);
    
    // Lưu thông tin lỗi
    deploymentResults.liquidityMining = {
      status: "failed",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // ===== LƯU KẾT QUẢ DEPLOYMENT =====
  console.log("\n💾 Đang lưu kết quả deployment...");
  
  // Tạo thư mục info nếu chưa có
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }
  
  // Lưu kết quả vào file JSON
  fs.writeFileSync(
    path.resolve(infoDir, "LiquidityMiningDeployment.json"),
    JSON.stringify(deploymentResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("🎉 HOÀN THÀNH TRIỂN KHAI LIQUIDITY MINING!");
  console.log("=".repeat(50));
  
  if (deploymentResults.liquidityMining.status === "success") {
    console.log("✅ LiquidityMining: Sẵn sàng khuyến khích cung cấp thanh khoản");
    console.log(`📍 Địa chỉ contract: ${deploymentResults.liquidityMining.address}`);
    console.log("📊 Cấu hình:");
    console.log(`   • Token reward: ${deploymentResults.liquidityMining.configuration.rewardToken.symbol}`);
    console.log(`   • Tổng reward: ${deploymentResults.liquidityMining.configuration.rewardToken.totalRewards} USDT`);
    console.log(`   • Thời gian: ${deploymentResults.liquidityMining.configuration.duration} ngày`);
    console.log(`   • Reward rate: ${deploymentResults.liquidityMining.configuration.rewardRate} USDT/giây`);
    console.log(`   • Reward mỗi ngày: ${deploymentResults.liquidityMining.configuration.dailyReward} USDT`);
    console.log("📈 Kết quả test:");
    console.log(`   • Pool đã thêm: ${deploymentResults.liquidityMining.testResults.poolAdded}`);
    console.log(`   • Total staked: ${deploymentResults.liquidityMining.testResults.totalStaked}`);
  } else {
    console.log("❌ LiquidityMining: Triển khai thất bại");
    console.log(`🔍 Lỗi: ${deploymentResults.liquidityMining.error}`);
  }
  
  console.log("📁 Kết quả đã lưu vào: info/LiquidityMiningDeployment.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Kết nối LiquidityMining với SimpleDEX pools");
  console.log("2. Thêm nhiều pool vào chương trình mining");
  console.log("3. Xây dựng frontend để staking/unstaking");
  console.log("4. Thêm tính năng claim reward");
  console.log("5. Tích hợp với ví người dùng");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 