import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script test thêm thanh khoản vào SimpleDEX
 * Chức năng:
 * - Phê duyệt token để SimpleDEX có thể sử dụng
 * - Thêm thanh khoản mới vào pool
 * - Kiểm tra trạng thái sau khi thêm
 * - Lưu kết quả test
 */
async function main() {
  console.log("➕ Đang test thêm thanh khoản vào SimpleDEX...\n");

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
  console.log("📍 Địa chỉ người test:", deployer.address);
  console.log("🏦 Địa chỉ SimpleDEX:", simpleDexAddress);

  // Lấy thông tin 2 token đầu tiên để test
  const tokenEntries = Object.entries(tokens);
  const [token1Name, token1Info] = tokenEntries[0]; // Token đầu tiên (ví dụ: Bitcoin)
  const [token2Name, token2Info] = tokenEntries[1]; // Token thứ hai (ví dụ: Ethereum)

  console.log(`\n🪙 Đang test với cặp token: ${token1Name} (${token1Info.symbol}) & ${token2Name} (${token2Info.symbol})`);

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

  // Khởi tạo object để lưu kết quả test
  const testResults: any = {
    timestamp: new Date().toISOString(), // Thời gian test
    testType: "add_liquidity_test",      // Loại test
    testResults: {}                      // Kết quả test sẽ được lưu ở đây
  };

  // ===== TEST THÊM THANH KHOẢN =====
  console.log("\n" + "=".repeat(50));
  console.log("➕ TEST THÊM THANH KHOẢN");
  console.log("=".repeat(50));

  // Định nghĩa số lượng token sẽ thêm vào thanh khoản
  const addAmount1 = ethers.utils.parseUnits("50", token1Info.decimals); // 50 token1
  const addAmount2 = ethers.utils.parseUnits("50", token2Info.decimals); // 50 token2

  console.log(`📈 Số lượng token sẽ thêm:`);
  console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(addAmount1, token1Info.decimals)}`);
  console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(addAmount2, token2Info.decimals)}`);

  try {
    // Bước 1: Phê duyệt token1 để SimpleDEX có thể sử dụng
    console.log("\n🔐 Đang phê duyệt token1...");
    const approve1Tx = await token1Contract.approve(simpleDexAddress, addAmount1);
    console.log("⏳ Transaction phê duyệt token1 đã gửi:", approve1Tx.hash);
    await approve1Tx.wait(); // Chờ transaction hoàn thành
    console.log("✅ Token1 đã được phê duyệt thành công!");

    // Bước 2: Phê duyệt token2 để SimpleDEX có thể sử dụng
    console.log("\n🔐 Đang phê duyệt token2...");
    const approve2Tx = await token2Contract.approve(simpleDexAddress, addAmount2);
    console.log("⏳ Transaction phê duyệt token2 đã gửi:", approve2Tx.hash);
    await approve2Tx.wait(); // Chờ transaction hoàn thành
    console.log("✅ Token2 đã được phê duyệt thành công!");

    // Bước 3: Thêm thanh khoản vào pool
    console.log("\n🏊 Đang thêm thanh khoản vào pool...");
    const addLiquidityTx = await simpleDex.addLiquidity(
      token1Info.tokenAddress,  // Địa chỉ token1
      token2Info.tokenAddress,  // Địa chỉ token2
      addAmount1,               // Số lượng token1
      addAmount2,               // Số lượng token2
      { gasLimit: 300000 }      // Giới hạn gas để tránh lỗi
    );
    
    console.log("⏳ Transaction thêm thanh khoản đã gửi:", addLiquidityTx.hash);
    console.log("⏳ Đang chờ xác nhận...");
    
    const receipt = await addLiquidityTx.wait(); // Chờ transaction hoàn thành
    console.log("✅ Thanh khoản đã được thêm thành công!");
    console.log("⛽ Gas đã sử dụng:", receipt.gasUsed.toString());

    // Bước 4: Kiểm tra trạng thái sau khi thêm thanh khoản
    console.log("\n🔍 Đang kiểm tra trạng thái sau khi thêm thanh khoản...");
    
    // Lấy reserves mới
    const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves mới:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)}`);
    
    // Lấy tổng thanh khoản mới
    const liquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`🏊 Tổng thanh khoản mới: ${ethers.utils.formatUnits(liquidityAfter, 18)}`);
    
    // Lấy thanh khoản của người dùng
    const userLiquidityAfter = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    console.log(`👤 Thanh khoản của người dùng: ${ethers.utils.formatUnits(userLiquidityAfter, 18)}`);

    // Lưu kết quả test thành công
    testResults.testResults.addLiquidity = {
      status: "passed", // Trạng thái: thành công
      transactionHash: addLiquidityTx.hash, // Hash của transaction
      gasUsed: receipt.gasUsed.toString(),  // Gas đã sử dụng
      newReserves: {
        reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals), // Reserve mới của token1
        reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)  // Reserve mới của token2
      },
      newLiquidity: ethers.utils.formatUnits(liquidityAfter, 18),     // Tổng thanh khoản mới
      userLiquidity: ethers.utils.formatUnits(userLiquidityAfter, 18), // Thanh khoản của người dùng
      addedAmounts: {
        token1: ethers.utils.formatUnits(addAmount1, token1Info.decimals), // Số lượng token1 đã thêm
        token2: ethers.utils.formatUnits(addAmount2, token2Info.decimals)  // Số lượng token2 đã thêm
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

  } catch (error: any) {
    // Xử lý lỗi nếu có
    console.log("❌ Thêm thanh khoản thất bại:", error.message);
    
    // Hiển thị thông tin lỗi chi tiết nếu có
    if (error.transaction) {
      console.log("Transaction hash:", error.transaction.hash);
    }
    
    if (error.receipt) {
      console.log("Gas đã sử dụng:", error.receipt.gasUsed.toString());
      console.log("Status:", error.receipt.status);
    }

    // Lưu kết quả test thất bại
    testResults.testResults.addLiquidity = {
      status: "failed", // Trạng thái: thất bại
      error: error.message, // Thông báo lỗi
      addedAmounts: {
        token1: ethers.utils.formatUnits(addAmount1, token1Info.decimals), // Số lượng token1 đã thử thêm
        token2: ethers.utils.formatUnits(addAmount2, token2Info.decimals)  // Số lượng token2 đã thử thêm
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
    path.resolve(infoDir, "AddLiquidityTest.json"),
    JSON.stringify(testResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("✅ HOÀN THÀNH TEST THÊM THANH KHOẢN!");
  console.log("=".repeat(50));
  
  if (testResults.testResults.addLiquidity.status === "passed") {
    console.log("🎉 Test thêm thanh khoản thành công!");
    console.log("📊 Thanh khoản đã được thêm vào pool");
    console.log("💰 Reserves đã được cập nhật");
  } else {
    console.log("❌ Test thêm thanh khoản thất bại!");
    console.log("🔍 Vui lòng kiểm tra lỗi và thử lại");
  }
  
  console.log("📁 Kết quả đã lưu vào: info/AddLiquidityTest.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Chạy 05c-test-swap-token1-to-token2.ts để test swap");
  console.log("2. Chạy 05d-test-swap-token2-to-token1.ts để test swap ngược");
  console.log("3. Chạy 05e-test-remove-liquidity.ts để test rút thanh khoản");
  console.log("4. Hoặc chạy 05f-test-all-dex-features.ts để test tất cả");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 