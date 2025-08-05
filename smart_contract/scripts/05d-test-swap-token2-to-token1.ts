import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script test swap token từ token2 sang token1
 * Chức năng:
 * - Phê duyệt token2 để SimpleDEX có thể swap
 * - Thực hiện swap token2 → token1
 * - Kiểm tra reserves sau khi swap
 * - Lưu kết quả test
 */
async function main() {
  console.log("🔄 Đang test swap từ token2 sang token1...\n");

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

  console.log(`\n🪙 Đang test với cặp token: ${token2Name} (${token2Info.symbol}) → ${token1Name} (${token1Info.symbol})`);

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
    testType: "swap_token2_to_token1",   // Loại test
    testResults: {}                      // Kết quả test sẽ được lưu ở đây
  };

  // ===== TEST SWAP TOKEN2 → TOKEN1 =====
  console.log("\n" + "=".repeat(50));
  console.log("🔄 TEST SWAP TOKEN2 → TOKEN1");
  console.log("=".repeat(50));

  // Định nghĩa số lượng token2 sẽ swap
  const swapAmount = ethers.utils.parseUnits("5", token2Info.decimals); // 5 token2

  console.log(`📈 Số lượng token2 sẽ swap: ${ethers.utils.formatUnits(swapAmount, token2Info.decimals)} ${token2Info.symbol}`);

  try {
    // Bước 1: Kiểm tra reserves trước khi swap
    console.log("\n🔍 Đang kiểm tra reserves trước khi swap...");
    const reservesBefore = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves trước swap:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)}`);

    // Bước 2: Kiểm tra số dư token trước khi swap
    console.log("\n💳 Đang kiểm tra số dư token trước khi swap...");
    const balance1Before = await token1Contract.balanceOf(deployer.address);
    const balance2Before = await token2Contract.balanceOf(deployer.address);
    console.log(`💰 Số dư trước swap:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);

    // Bước 3: Ước tính số lượng token1 sẽ nhận được
    console.log("\n🧮 Đang ước tính số lượng token1 sẽ nhận được...");
    const estimatedAmountOut = await simpleDex.getAmountOut(swapAmount, token2Info.tokenAddress, token1Info.tokenAddress);
    console.log(`📊 Ước tính sẽ nhận: ${ethers.utils.formatUnits(estimatedAmountOut, token1Info.decimals)} ${token1Info.symbol}`);

    // Bước 4: Phê duyệt token2 để SimpleDEX có thể swap
    console.log("\n🔐 Đang phê duyệt token2 để swap...");
    const approveTx = await token2Contract.approve(simpleDexAddress, swapAmount);
    console.log("⏳ Transaction phê duyệt đã gửi:", approveTx.hash);
    await approveTx.wait(); // Chờ transaction hoàn thành
    console.log("✅ Token2 đã được phê duyệt thành công!");

    // Bước 5: Thực hiện swap token2 → token1
    console.log("\n🔄 Đang thực hiện swap...");
    const swapTx = await simpleDex.swapExactTokensForTokens(
      swapAmount,                    // Số lượng token2 muốn swap
      estimatedAmountOut.mul(95).div(100), // Số lượng token1 tối thiểu muốn nhận (95% của ước tính)
      token2Info.tokenAddress,       // Địa chỉ token2
      token1Info.tokenAddress,       // Địa chỉ token1
      deployer.address,              // Địa chỉ người nhận token1
      { gasLimit: 300000 }           // Giới hạn gas để tránh lỗi
    );
    
    console.log("⏳ Transaction swap đã gửi:", swapTx.hash);
    console.log("⏳ Đang chờ xác nhận...");
    
    const receipt = await swapTx.wait(); // Chờ transaction hoàn thành
    console.log("✅ Swap đã được thực hiện thành công!");
    console.log("⛽ Gas đã sử dụng:", receipt.gasUsed.toString());

    // Bước 6: Kiểm tra reserves sau khi swap
    console.log("\n🔍 Đang kiểm tra reserves sau khi swap...");
    const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves sau swap:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)}`);

    // Bước 7: Kiểm tra số dư token sau khi swap
    console.log("\n💳 Đang kiểm tra số dư token sau khi swap...");
    const balance1After = await token1Contract.balanceOf(deployer.address);
    const balance2After = await token2Contract.balanceOf(deployer.address);
    console.log(`💰 Số dư sau swap:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1After, token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2After, token2Info.decimals)}`);

    // Bước 8: Tính toán thay đổi số dư
    const balance1Change = balance1After.sub(balance1Before); // Số token1 đã nhận
    const balance2Change = balance2Before.sub(balance2After); // Số token2 đã mất

    console.log(`\n📊 Thay đổi số dư:`);
    console.log(`   • ${token2Info.symbol} đã mất: ${ethers.utils.formatUnits(balance2Change, token2Info.decimals)}`);
    console.log(`   • ${token1Info.symbol} đã nhận: ${ethers.utils.formatUnits(balance1Change, token1Info.decimals)}`);

    // Bước 9: Tính toán tỷ giá swap thực tế
    const actualRate = balance1Change.mul(ethers.utils.parseUnits("1", token2Info.decimals)).div(balance2Change);
    console.log(`💱 Tỷ giá swap thực tế: 1 ${token2Info.symbol} = ${ethers.utils.formatUnits(actualRate, token1Info.decimals)} ${token1Info.symbol}`);

    // Lưu kết quả test thành công
    testResults.testResults.swapToken2ToToken1 = {
      status: "passed", // Trạng thái: thành công
      transactionHash: swapTx.hash, // Hash của transaction
      gasUsed: receipt.gasUsed.toString(), // Gas đã sử dụng
      swapDetails: {
        inputAmount: ethers.utils.formatUnits(swapAmount, token2Info.decimals), // Số lượng token2 đã swap
        estimatedOutput: ethers.utils.formatUnits(estimatedAmountOut, token1Info.decimals), // Số lượng token1 ước tính
        actualOutput: ethers.utils.formatUnits(balance1Change, token1Info.decimals), // Số lượng token1 thực tế nhận
        actualRate: ethers.utils.formatUnits(actualRate, token1Info.decimals) // Tỷ giá thực tế
      },
      reservesBefore: {
        reserve0: ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals), // Reserve token1 trước swap
        reserve1: ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)  // Reserve token2 trước swap
      },
      reservesAfter: {
        reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals), // Reserve token1 sau swap
        reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)  // Reserve token2 sau swap
      },
      balanceChanges: {
        token2Lost: ethers.utils.formatUnits(balance2Change, token2Info.decimals), // Số token2 đã mất
        token1Gained: ethers.utils.formatUnits(balance1Change, token1Info.decimals) // Số token1 đã nhận
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
    console.log("❌ Swap thất bại:", error.message);
    
    // Hiển thị thông tin lỗi chi tiết nếu có
    if (error.transaction) {
      console.log("Transaction hash:", error.transaction.hash);
    }
    
    if (error.receipt) {
      console.log("Gas đã sử dụng:", error.receipt.gasUsed.toString());
      console.log("Status:", error.receipt.status);
    }

    // Lưu kết quả test thất bại
    testResults.testResults.swapToken2ToToken1 = {
      status: "failed", // Trạng thái: thất bại
      error: error.message, // Thông báo lỗi
      swapAmount: ethers.utils.formatUnits(swapAmount, token2Info.decimals), // Số lượng token2 đã thử swap
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
    path.resolve(infoDir, "SwapToken2ToToken1Test.json"),
    JSON.stringify(testResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("✅ HOÀN THÀNH TEST SWAP TOKEN2 → TOKEN1!");
  console.log("=".repeat(50));
  
  if (testResults.testResults.swapToken2ToToken1.status === "passed") {
    console.log("🎉 Test swap thành công!");
    console.log("📊 Token đã được swap thành công");
    console.log("💰 Reserves đã được cập nhật");
    console.log("💱 Tỷ giá swap đã được tính toán");
  } else {
    console.log("❌ Test swap thất bại!");
    console.log("🔍 Vui lòng kiểm tra lỗi và thử lại");
  }
  
  console.log("📁 Kết quả đã lưu vào: info/SwapToken2ToToken1Test.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Chạy 05e-test-remove-liquidity.ts để test rút thanh khoản");
  console.log("2. Hoặc chạy 05f-test-all-dex-features.ts để test tất cả");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 