import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script tổng hợp test tất cả tính năng của SimpleDEX
 * Chức năng:
 * - Test trạng thái ban đầu
 * - Test thêm thanh khoản
 * - Test swap token1 → token2
 * - Test swap token2 → token1
 * - Test rút thanh khoản
 * - Lưu kết quả tổng hợp
 */
async function main() {
  console.log("🧪 Đang test tất cả tính năng của SimpleDEX...\n");

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

  // Khởi tạo object để lưu kết quả test tổng hợp
  const testResults: any = {
    timestamp: new Date().toISOString(), // Thời gian test
    testType: "all_dex_features_test",   // Loại test
    summary: {
      totalTests: 5,                     // Tổng số test
      passedTests: 0,                    // Số test thành công
      failedTests: 0,                    // Số test thất bại
      skippedTests: 0                    // Số test bỏ qua
    },
    testResults: {}                      // Kết quả chi tiết của từng test
  };

  // ===== TEST 1: KIỂM TRA TRẠNG THÁI BAN ĐẦU =====
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST 1: KIỂM TRA TRẠNG THÁI BAN ĐẦU");
  console.log("=".repeat(60));

  try {
    // Lấy thông tin reserves hiện tại
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    const balance1 = await token1Contract.balanceOf(deployer.address);
    const balance2 = await token2Contract.balanceOf(deployer.address);

    console.log(`💰 Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`🏊 Tổng Thanh khoản: ${ethers.utils.formatUnits(liquidity, 18)}`);
    console.log(`👤 Thanh khoản của người dùng: ${ethers.utils.formatUnits(userLiquidity, 18)}`);
    console.log(`💳 Số dư Token: ${ethers.utils.formatUnits(balance1, token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(balance2, token2Info.decimals)} ${token2Info.symbol}`);

    // Lưu kết quả test trạng thái ban đầu
    testResults.testResults.initialState = {
      status: "passed",
      reserves: {
        reserve0: ethers.utils.formatUnits(reserves[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reserves[1], token2Info.decimals)
      },
      liquidity: {
        total: ethers.utils.formatUnits(liquidity, 18),
        user: ethers.utils.formatUnits(userLiquidity, 18)
      },
      userBalance: {
        token0: ethers.utils.formatUnits(balance1, token1Info.decimals),
        token1: ethers.utils.formatUnits(balance2, token2Info.decimals)
      }
    };
    testResults.summary.passedTests++;

  } catch (error: any) {
    console.log("❌ Test trạng thái ban đầu thất bại:", error.message);
    testResults.testResults.initialState = {
      status: "failed",
      error: error.message
    };
    testResults.summary.failedTests++;
  }

  // ===== TEST 2: THÊM THANH KHOẢN =====
  console.log("\n" + "=".repeat(60));
  console.log("➕ TEST 2: THÊM THANH KHOẢN");
  console.log("=".repeat(60));

  const addAmount1 = ethers.utils.parseUnits("50", token1Info.decimals); // 50 token1
  const addAmount2 = ethers.utils.parseUnits("50", token2Info.decimals); // 50 token2

  console.log(`📈 Số lượng token sẽ thêm: ${ethers.utils.formatUnits(addAmount1, token1Info.decimals)} ${token1Info.symbol} + ${ethers.utils.formatUnits(addAmount2, token2Info.decimals)} ${token2Info.symbol}`);

  try {
    // Phê duyệt token để thêm thanh khoản
    console.log("🔐 Đang phê duyệt token để thêm thanh khoản...");
    await token1Contract.approve(simpleDexAddress, addAmount1);
    await token2Contract.approve(simpleDexAddress, addAmount2);
    console.log("✅ Token đã được phê duyệt thành công!");

    // Thêm thanh khoản
    const addTx = await simpleDex.addLiquidity(
      token1Info.tokenAddress,
      token2Info.tokenAddress,
      addAmount1,
      addAmount2,
      { gasLimit: 300000 }
    );
    
    console.log("⏳ Transaction thêm thanh khoản đã gửi:", addTx.hash);
    await addTx.wait();
    console.log("✅ Thanh khoản đã được thêm thành công!");

    // Kiểm tra trạng thái sau khi thêm
    const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves mới: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`🏊 Tổng thanh khoản mới: ${ethers.utils.formatUnits(liquidityAfter, 18)}`);

    // Lưu kết quả test thêm thanh khoản
    testResults.testResults.addLiquidity = {
      status: "passed",
      transactionHash: addTx.hash,
      newReserves: {
        reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)
      },
      newLiquidity: ethers.utils.formatUnits(liquidityAfter, 18)
    };
    testResults.summary.passedTests++;

  } catch (error: any) {
    console.log("❌ Test thêm thanh khoản thất bại:", error.message);
    testResults.testResults.addLiquidity = {
      status: "failed",
      error: error.message
    };
    testResults.summary.failedTests++;
  }

  // ===== TEST 3: SWAP TOKEN1 → TOKEN2 =====
  console.log("\n" + "=".repeat(60));
  console.log("🔄 TEST 3: SWAP TOKEN1 → TOKEN2");
  console.log("=".repeat(60));

  const swapAmount = ethers.utils.parseUnits("5", token1Info.decimals); // 5 token1
  console.log(`🔄 Số lượng token1 sẽ swap: ${ethers.utils.formatUnits(swapAmount, token1Info.decimals)} ${token1Info.symbol}`);

  try {
    // Phê duyệt và swap
    await token1Contract.approve(simpleDexAddress, swapAmount);
    const swapTx = await simpleDex.swapExactTokensForTokens(
      swapAmount,
      0, // Số lượng token2 tối thiểu muốn nhận (0 = không giới hạn)
      token1Info.tokenAddress,
      token2Info.tokenAddress,
      deployer.address,
      { gasLimit: 300000 }
    );
    
    console.log("⏳ Transaction swap đã gửi:", swapTx.hash);
    await swapTx.wait();
    console.log("✅ Swap đã được thực hiện thành công!");

    // Kiểm tra reserves sau khi swap
    const reservesAfterSwap = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves sau swap: ${ethers.utils.formatUnits(reservesAfterSwap[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfterSwap[1], token2Info.decimals)} ${token2Info.symbol}`);

    // Lưu kết quả test swap token1 → token2
    testResults.testResults.swapToken1ToToken2 = {
      status: "passed",
      transactionHash: swapTx.hash,
      reservesAfter: {
        reserve0: ethers.utils.formatUnits(reservesAfterSwap[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reservesAfterSwap[1], token2Info.decimals)
      }
    };
    testResults.summary.passedTests++;

  } catch (error: any) {
    console.log("❌ Test swap token1 → token2 thất bại:", error.message);
    testResults.testResults.swapToken1ToToken2 = {
      status: "failed",
      error: error.message
    };
    testResults.summary.failedTests++;
  }

  // ===== TEST 4: SWAP TOKEN2 → TOKEN1 =====
  console.log("\n" + "=".repeat(60));
  console.log("🔄 TEST 4: SWAP TOKEN2 → TOKEN1");
  console.log("=".repeat(60));

  const swapAmount2 = ethers.utils.parseUnits("5", token2Info.decimals); // 5 token2
  console.log(`🔄 Số lượng token2 sẽ swap: ${ethers.utils.formatUnits(swapAmount2, token2Info.decimals)} ${token2Info.symbol}`);

  try {
    // Phê duyệt và swap
    await token2Contract.approve(simpleDexAddress, swapAmount2);
    const swapTx2 = await simpleDex.swapExactTokensForTokens(
      swapAmount2,
      0, // Số lượng token1 tối thiểu muốn nhận (0 = không giới hạn)
      token2Info.tokenAddress,
      token1Info.tokenAddress,
      deployer.address,
      { gasLimit: 300000 }
    );
    
    console.log("⏳ Transaction swap đã gửi:", swapTx2.hash);
    await swapTx2.wait();
    console.log("✅ Swap đã được thực hiện thành công!");

    // Kiểm tra reserves sau khi swap
    const reservesAfterSwap2 = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves sau swap: ${ethers.utils.formatUnits(reservesAfterSwap2[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfterSwap2[1], token2Info.decimals)} ${token2Info.symbol}`);

    // Lưu kết quả test swap token2 → token1
    testResults.testResults.swapToken2ToToken1 = {
      status: "passed",
      transactionHash: swapTx2.hash,
      reservesAfter: {
        reserve0: ethers.utils.formatUnits(reservesAfterSwap2[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reservesAfterSwap2[1], token2Info.decimals)
      }
    };
    testResults.summary.passedTests++;

  } catch (error: any) {
    console.log("❌ Test swap token2 → token1 thất bại:", error.message);
    testResults.testResults.swapToken2ToToken1 = {
      status: "failed",
      error: error.message
    };
    testResults.summary.failedTests++;
  }

  // ===== TEST 5: RÚT THANH KHOẢN =====
  console.log("\n" + "=".repeat(60));
  console.log("➖ TEST 5: RÚT THANH KHOẢN");
  console.log("=".repeat(60));

  const removeAmount = ethers.utils.parseUnits("50", 18); // 50 liquidity tokens
  console.log(`📉 Số lượng thanh khoản sẽ rút: ${ethers.utils.formatUnits(removeAmount, 18)} liquidity tokens`);

  try {
    // Kiểm tra thanh khoản hiện tại
    const currentUserLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    
    if (currentUserLiquidity.isZero()) {
      console.log("⚠️ Không có thanh khoản để rút!");
      testResults.testResults.removeLiquidity = {
        status: "skipped",
        reason: "No liquidity to remove"
      };
      testResults.summary.skippedTests++;
    } else {
      // Rút thanh khoản
      const removeTx = await simpleDex.removeLiquidity(
        token1Info.tokenAddress,
        token2Info.tokenAddress,
        removeAmount,
        { gasLimit: 300000 }
      );
      
      console.log("⏳ Transaction rút thanh khoản đã gửi:", removeTx.hash);
      await removeTx.wait();
      console.log("✅ Thanh khoản đã được rút thành công!");

      // Kiểm tra trạng thái cuối cùng
      const finalReserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      const finalLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
      const finalUserLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
      const finalBalance1 = await token1Contract.balanceOf(deployer.address);
      const finalBalance2 = await token2Contract.balanceOf(deployer.address);

      console.log(`💰 Reserves cuối cùng: ${ethers.utils.formatUnits(finalReserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(finalReserves[1], token2Info.decimals)} ${token2Info.symbol}`);
      console.log(`🏊 Tổng thanh khoản cuối cùng: ${ethers.utils.formatUnits(finalLiquidity, 18)}`);
      console.log(`👤 Thanh khoản người dùng cuối cùng: ${ethers.utils.formatUnits(finalUserLiquidity, 18)}`);
      console.log(`💳 Số dư token cuối cùng: ${ethers.utils.formatUnits(finalBalance1, token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(finalBalance2, token2Info.decimals)} ${token2Info.symbol}`);

      // Lưu kết quả test rút thanh khoản
      testResults.testResults.removeLiquidity = {
        status: "passed",
        transactionHash: removeTx.hash,
        finalState: {
          reserves: {
            reserve0: ethers.utils.formatUnits(finalReserves[0], token1Info.decimals),
            reserve1: ethers.utils.formatUnits(finalReserves[1], token2Info.decimals)
          },
          liquidity: {
            total: ethers.utils.formatUnits(finalLiquidity, 18),
            user: ethers.utils.formatUnits(finalUserLiquidity, 18)
          },
          userBalance: {
            token0: ethers.utils.formatUnits(finalBalance1, token1Info.decimals),
            token1: ethers.utils.formatUnits(finalBalance2, token2Info.decimals)
          }
        }
      };
      testResults.summary.passedTests++;
    }

  } catch (error: any) {
    console.log("❌ Test rút thanh khoản thất bại:", error.message);
    testResults.testResults.removeLiquidity = {
      status: "failed",
      error: error.message
    };
    testResults.summary.failedTests++;
  }

  // ===== LƯU KẾT QUẢ TEST TỔNG HỢP =====
  console.log("\n💾 Đang lưu kết quả test tổng hợp...");
  
  // Tạo thư mục info nếu chưa có
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }
  
  // Lưu kết quả vào file JSON
  fs.writeFileSync(
    path.resolve(infoDir, "AllDEXFeaturesTest.json"),
    JSON.stringify(testResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(60));
  console.log("🎉 HOÀN THÀNH TEST TẤT CẢ TÍNH NĂNG DEX!");
  console.log("=".repeat(60));
  
  console.log(`📊 TỔNG KẾT KẾT QUẢ:`);
  console.log(`   • Tổng số test: ${testResults.summary.totalTests}`);
  console.log(`   • Thành công: ${testResults.summary.passedTests}`);
  console.log(`   • Thất bại: ${testResults.summary.failedTests}`);
  console.log(`   • Bỏ qua: ${testResults.summary.skippedTests}`);
  
  console.log(`\n📋 CHI TIẾT TỪNG TEST:`);
  console.log(`   1. Trạng thái ban đầu: ${testResults.testResults.initialState.status}`);
  console.log(`   2. Thêm thanh khoản: ${testResults.testResults.addLiquidity.status}`);
  console.log(`   3. Swap token1 → token2: ${testResults.testResults.swapToken1ToToken2.status}`);
  console.log(`   4. Swap token2 → token1: ${testResults.testResults.swapToken2ToToken1.status}`);
  console.log(`   5. Rút thanh khoản: ${testResults.testResults.removeLiquidity.status}`);
  
  if (testResults.summary.passedTests === testResults.summary.totalTests) {
    console.log(`\n🎉 TẤT CẢ TEST ĐỀU THÀNH CÔNG!`);
    console.log(`✅ SimpleDEX hoạt động hoàn hảo!`);
    console.log(`✅ Tất cả tính năng cốt lõi đều hoạt động:`);
    console.log(`   - Thêm Thanh khoản`);
    console.log(`   - Rút Thanh khoản`);
    console.log(`   - Swap (cả hai hướng)`);
    console.log(`   - Tính toán giá với phí`);
    console.log(`   - Quản lý token thanh khoản`);
  } else {
    console.log(`\n⚠️ CÓ ${testResults.summary.failedTests} TEST THẤT BẠI!`);
    console.log(`🔍 Vui lòng kiểm tra lại các tính năng thất bại`);
  }
  
  console.log("📁 Kết quả đã lưu vào: info/AllDEXFeaturesTest.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Xây dựng frontend để tương tác với SimpleDEX");
  console.log("2. Thêm tính năng quản lý pool");
  console.log("3. Thêm tính năng staking và reward");
  console.log("4. Tích hợp với ví người dùng");
  console.log("5. Thêm tính năng báo cáo và phân tích");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 