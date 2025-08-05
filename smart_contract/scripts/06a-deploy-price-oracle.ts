import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script triển khai Price Oracle - Hệ thống cung cấp giá token
 * Chức năng:
 * - Deploy contract PriceOracle
 * - Cập nhật giá token
 * - Tính toán giá từ reserves của pool
 * - Lưu thông tin deployment
 */
async function main() {
  console.log("🚀 Đang triển khai Price Oracle cho SimpleDEX...\n");

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
    priceOracle: {
      status: "pending",
      address: "",
      testResults: {},
      timestamp: new Date().toISOString()
    }
  };

  // ===== TRIỂN KHAI PRICE ORACLE =====
  console.log("\n" + "=".repeat(50));
  console.log("📊 Đang triển khai Price Oracle");
  console.log("=".repeat(50));

  try {
    // Lấy contract factory cho PriceOracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    
    // Deploy contract PriceOracle
    console.log("⏳ Đang deploy contract PriceOracle...");
    const priceOracle = await PriceOracle.deploy();
    
    // Chờ contract được deploy hoàn tất
    await priceOracle.deployed();

    console.log("✅ PriceOracle đã được deploy tại:", priceOracle.address);

    // ===== KIỂM TRA TÍNH NĂNG PRICE ORACLE =====
    console.log("\n🧪 Đang kiểm tra tính năng Price Oracle...");

    // Lấy thông tin 2 token đầu tiên để test
    const tokenEntries = Object.entries(tokens);
    const [token1Name, token1Info] = tokenEntries[0]; // Token đầu tiên (ví dụ: BTC)
    const [token2Name, token2Info] = tokenEntries[1]; // Token thứ hai (ví dụ: ETH)

    console.log(`\n📋 Thông tin token test:`);
    console.log(`Token1: ${token1Name} (${token1Info.symbol}) - ${token1Info.tokenAddress}`);
    console.log(`Token2: ${token2Name} (${token2Info.symbol}) - ${token2Info.tokenAddress}`);

    // Cập nhật giá token (ví dụ: 1 BTC = 15 ETH)
    const price = ethers.utils.parseEther("15"); // Chuyển đổi 15 thành wei
    console.log(`\n💰 Đang cập nhật giá: 1 ${token1Info.symbol} = 15 ${token2Info.symbol}`);
    
    // Gọi hàm updatePrice để cập nhật giá
    const updatePriceTx = await priceOracle.updatePrice(
      token1Info.tokenAddress, 
      token2Info.tokenAddress, 
      price
    );
    await updatePriceTx.wait();
    console.log("✅ Giá đã được cập nhật thành công!");

    // Lấy giá đã cập nhật
    console.log(`\n📈 Đang lấy giá đã cập nhật...`);
    const retrievedPrice = await priceOracle.getPrice(
      token1Info.tokenAddress, 
      token2Info.tokenAddress
    );
    console.log(`📊 Giá đã lấy: ${ethers.utils.formatEther(retrievedPrice)} ${token2Info.symbol} per ${token1Info.symbol}`);

    // Tính toán giá từ reserves của pool trong SimpleDEX
    console.log(`\n🧮 Đang tính toán giá từ reserves của pool...`);
    
    // Lấy contract SimpleDEX để truy cập reserves
    const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);
    
    // Lấy reserves hiện tại của pool
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`📊 Reserves hiện tại:`);
    console.log(`  ${token1Info.symbol}: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)}`);
    console.log(`  ${token2Info.symbol}: ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)}`);
    
    // Tính toán giá từ reserves
    const calculatedPrice = await priceOracle.calculatePriceFromReserves(
      reserves[0],        // Reserve của token1
      reserves[1],        // Reserve của token2
      token1Info.decimals, // Số thập phân của token1
      token2Info.decimals  // Số thập phân của token2
    );
    console.log(`🧮 Giá tính từ reserves: ${ethers.utils.formatEther(calculatedPrice)} ${token2Info.symbol} per ${token1Info.symbol}`);

    // Lưu kết quả test thành công
    deploymentResults.priceOracle = {
      status: "success",
      address: priceOracle.address,
      testResults: {
        testPrice: ethers.utils.formatEther(price),
        retrievedPrice: ethers.utils.formatEther(retrievedPrice),
        calculatedPrice: ethers.utils.formatEther(calculatedPrice),
        reserves: {
          token1: ethers.utils.formatUnits(reserves[0], token1Info.decimals),
          token2: ethers.utils.formatUnits(reserves[1], token2Info.decimals)
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n✅ Tất cả test Price Oracle đã thành công!");

  } catch (error) {
    console.log("❌ Triển khai Price Oracle thất bại:", error.message);
    
    // Lưu thông tin lỗi
    deploymentResults.priceOracle = {
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
    path.resolve(infoDir, "PriceOracleDeployment.json"),
    JSON.stringify(deploymentResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("🎉 HOÀN THÀNH TRIỂN KHAI PRICE ORACLE!");
  console.log("=".repeat(50));
  
  if (deploymentResults.priceOracle.status === "success") {
    console.log("✅ PriceOracle: Sẵn sàng cung cấp giá token");
    console.log(`📍 Địa chỉ contract: ${deploymentResults.priceOracle.address}`);
    console.log("📊 Kết quả test:");
    console.log(`   • Giá test: ${deploymentResults.priceOracle.testResults.testPrice} ETH per BTC`);
    console.log(`   • Giá đã lấy: ${deploymentResults.priceOracle.testResults.retrievedPrice} ETH per BTC`);
    console.log(`   • Giá từ reserves: ${deploymentResults.priceOracle.testResults.calculatedPrice} ETH per BTC`);
  } else {
    console.log("❌ PriceOracle: Triển khai thất bại");
    console.log(`🔍 Lỗi: ${deploymentResults.priceOracle.error}`);
  }
  
  console.log("📁 Kết quả đã lưu vào: info/PriceOracleDeployment.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Tích hợp PriceOracle với SimpleDEX");
  console.log("2. Thêm nhiều nguồn giá khác nhau");
  console.log("3. Xây dựng frontend để hiển thị giá");
  console.log("4. Thêm tính năng cập nhật giá tự động");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 