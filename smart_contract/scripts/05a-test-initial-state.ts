import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script kiểm tra trạng thái ban đầu của SimpleDEX
 * Chức năng:
 * - Kiểm tra reserves (dự trữ) của pool
 * - Kiểm tra tổng thanh khoản
 * - Kiểm tra thanh khoản của người dùng
 * - Kiểm tra số dư token của người dùng
 * - Lưu kết quả kiểm tra
 */
async function main() {
  console.log("🔍 Đang kiểm tra trạng thái ban đầu của SimpleDEX...\n");

  // Đọc thông tin token đã deploy từ file JSON
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  // Đọc địa chỉ SimpleDEX đã deploy từ file JSON
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  // Lấy thông tin người deploy (ví chính)
  const [deployer] = await ethers.getSigners();
  
  // Hiển thị thông tin cơ bản
  console.log("📍 Địa chỉ người kiểm tra:", deployer.address);
  console.log("🏦 Địa chỉ SimpleDEX:", simpleDexAddress);

  // Lấy thông tin 2 token đầu tiên để test
  const tokenEntries = Object.entries(tokens);
  const [token1Name, token1Info] = tokenEntries[0]; // Token đầu tiên (ví dụ: Bitcoin)
  const [token2Name, token2Info] = tokenEntries[1]; // Token thứ hai (ví dụ: Ethereum)

  console.log(`\n🪙 Đang kiểm tra với cặp token: ${token1Name} (${token1Info.symbol}) & ${token2Name} (${token2Info.symbol})`);

  // Lấy contract instance của SimpleDEX
  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);

  // Tạo contract instance cho token1 với các function cần thiết
  const token1Contract = new ethers.Contract(token1Info.tokenAddress, [
    "function balanceOf(address) external view returns (uint256)", // Function kiểm tra số dư
    "function approve(address,uint256) external returns (bool)"     // Function phê duyệt chi tiêu
  ], deployer);
  
  // Tạo contract instance cho token2 với các function cần thiết
  const token2Contract = new ethers.Contract(token2Info.tokenAddress, [
    "function balanceOf(address) external view returns (uint256)", // Function kiểm tra số dư
    "function approve(address,uint256) external returns (bool)"     // Function phê duyệt chi tiêu
  ], deployer);

  // Khởi tạo object để lưu kết quả kiểm tra
  const testResults: any = {
    timestamp: new Date().toISOString(), // Thời gian kiểm tra
    testType: "initial_state_check",     // Loại test
    testResults: {}                      // Kết quả test sẽ được lưu ở đây
  };

  // ===== KIỂM TRA TRẠNG THÁI BAN ĐẦU =====
  console.log("\n" + "=".repeat(50));
  console.log("📊 KIỂM TRA TRẠNG THÁI BAN ĐẦU");
  console.log("=".repeat(50));

  // Lấy thông tin reserves (dự trữ) của pool
  console.log("🔍 Đang lấy thông tin reserves...");
  const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
  
  // Lấy tổng thanh khoản của pool
  console.log("🔍 Đang lấy tổng thanh khoản...");
  const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
  
  // Lấy thanh khoản của người dùng hiện tại
  console.log("🔍 Đang lấy thanh khoản của người dùng...");
  const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
  
  // Lấy số dư token1 của người dùng
  console.log("🔍 Đang lấy số dư token1...");
  const balance1 = await token1Contract.balanceOf(deployer.address);
  
  // Lấy số dư token2 của người dùng
  console.log("🔍 Đang lấy số dư token2...");
  const balance2 = await token2Contract.balanceOf(deployer.address);

  // Hiển thị kết quả kiểm tra
  console.log(`\n💰 Thông tin Reserves (Dự trữ):`);
  console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)}`);
  console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)}`);
  
  console.log(`\n🏊 Thông tin Thanh khoản:`);
  console.log(`   • Tổng thanh khoản: ${ethers.utils.formatUnits(liquidity, 18)}`);
  console.log(`   • Thanh khoản của người dùng: ${ethers.utils.formatUnits(userLiquidity, 18)}`);
  
  console.log(`\n💳 Số dư Token của người dùng:`);
  console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1, token1Info.decimals)}`);
  console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2, token2Info.decimals)}`);

  // Lưu kết quả kiểm tra vào object
  testResults.testResults.initialState = {
    status: "passed", // Trạng thái: thành công
    reserves: {
      reserve0: ethers.utils.formatUnits(reserves[0], token1Info.decimals), // Reserve của token1
      reserve1: ethers.utils.formatUnits(reserves[1], token2Info.decimals)  // Reserve của token2
    },
    liquidity: {
      total: ethers.utils.formatUnits(liquidity, 18),     // Tổng thanh khoản
      user: ethers.utils.formatUnits(userLiquidity, 18)   // Thanh khoản của người dùng
    },
    userBalance: {
      token0: ethers.utils.formatUnits(balance1, token1Info.decimals), // Số dư token1
      token1: ethers.utils.formatUnits(balance2, token2Info.decimals)  // Số dư token2
    },
    testTokens: {
      token1: {
        name: token1Name,
        symbol: token1Info.symbol,
        address: token1Info.tokenAddress,
        decimals: token1Info.decimals
      },
      token2: {
        name: token2Name,
        symbol: token2Info.symbol,
        address: token2Info.tokenAddress,
        decimals: token2Info.decimals
      }
    }
  };

  // ===== LƯU KẾT QUẢ KIỂM TRA =====
  console.log("\n💾 Đang lưu kết quả kiểm tra...");
  
  // Tạo thư mục info nếu chưa có
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }
  
  // Lưu kết quả vào file JSON
  fs.writeFileSync(
    path.resolve(infoDir, "InitialStateTest.json"),
    JSON.stringify(testResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("✅ HOÀN THÀNH KIỂM TRA TRẠNG THÁI BAN ĐẦU!");
  console.log("=".repeat(50));
  console.log("📁 Kết quả đã lưu vào: info/InitialStateTest.json");
  console.log("🔍 Trạng thái SimpleDEX đã được kiểm tra thành công!");
  console.log("📊 Tất cả thông tin reserves, liquidity và balance đã được ghi nhận");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Chạy 05b-test-add-liquidity.ts để thêm thanh khoản");
  console.log("2. Chạy 05c-test-swap-token1-to-token2.ts để test swap");
  console.log("3. Chạy 05d-test-swap-token2-to-token1.ts để test swap ngược");
  console.log("4. Chạy 05e-test-remove-liquidity.ts để test rút thanh khoản");
  console.log("5. Hoặc chạy 05f-test-all-dex-features.ts để test tất cả");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 