import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Script test rút thanh khoản từ SimpleDEX
 * Chức năng:
 * - Kiểm tra thanh khoản hiện tại của người dùng
 * - Rút một phần thanh khoản
 * - Kiểm tra trạng thái sau khi rút
 * - Lưu kết quả test
 */
async function main() {
  console.log("➖ Đang test rút thanh khoản từ SimpleDEX...\n");

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
    testType: "remove_liquidity_test",   // Loại test
    testResults: {}                      // Kết quả test sẽ được lưu ở đây
  };

  // ===== TEST RÚT THANH KHOẢN =====
  console.log("\n" + "=".repeat(50));
  console.log("➖ TEST RÚT THANH KHOẢN");
  console.log("=".repeat(50));

  try {
    // Bước 1: Kiểm tra trạng thái trước khi rút thanh khoản
    console.log("\n🔍 Đang kiểm tra trạng thái trước khi rút thanh khoản...");
    
    // Lấy reserves hiện tại
    const reservesBefore = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves trước khi rút:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)}`);
    
    // Lấy tổng thanh khoản hiện tại
    const totalLiquidityBefore = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`🏊 Tổng thanh khoản trước khi rút: ${ethers.utils.formatUnits(totalLiquidityBefore, 18)}`);
    
    // Lấy thanh khoản của người dùng hiện tại
    const userLiquidityBefore = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    console.log(`👤 Thanh khoản của người dùng trước khi rút: ${ethers.utils.formatUnits(userLiquidityBefore, 18)}`);
    
    // Lấy số dư token trước khi rút
    const balance1Before = await token1Contract.balanceOf(deployer.address);
    const balance2Before = await token2Contract.balanceOf(deployer.address);
    console.log(`💳 Số dư token trước khi rút:`);
    console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);

    // Bước 2: Kiểm tra xem có thanh khoản để rút không
    if (userLiquidityBefore.isZero()) {
      console.log("⚠️ Không có thanh khoản để rút!");
      console.log("💡 Vui lòng thêm thanh khoản trước khi test rút");
      
      // Lưu kết quả test bỏ qua
      testResults.testResults.removeLiquidity = {
        status: "skipped", // Trạng thái: bỏ qua
        reason: "No liquidity to remove", // Lý do bỏ qua
        userLiquidity: "0", // Thanh khoản của người dùng
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
    } else {
      // Bước 3: Định nghĩa số lượng thanh khoản sẽ rút
      const removeAmount = ethers.utils.parseUnits("50", 18); // Rút 50 liquidity tokens
      
      // Kiểm tra xem có đủ thanh khoản để rút không
      if (removeAmount.gt(userLiquidityBefore)) {
        console.log("⚠️ Số lượng rút lớn hơn thanh khoản hiện có!");
        console.log(`💡 Sẽ rút toàn bộ thanh khoản: ${ethers.utils.formatUnits(userLiquidityBefore, 18)}`);
        const actualRemoveAmount = userLiquidityBefore; // Rút toàn bộ thanh khoản
      } else {
        const actualRemoveAmount = removeAmount; // Rút số lượng đã định
      }
      
      const actualRemoveAmount = removeAmount.gt(userLiquidityBefore) ? userLiquidityBefore : removeAmount;
      
      console.log(`📉 Số lượng thanh khoản sẽ rút: ${ethers.utils.formatUnits(actualRemoveAmount, 18)} liquidity tokens`);

      // Bước 4: Tính toán số lượng token sẽ nhận được
      console.log("\n🧮 Đang tính toán số lượng token sẽ nhận được...");
      
      // Tính tỷ lệ thanh khoản sẽ rút so với tổng thanh khoản
      const liquidityRatio = actualRemoveAmount.mul(ethers.utils.parseUnits("1", 18)).div(totalLiquidityBefore);
      console.log(`📊 Tỷ lệ thanh khoản sẽ rút: ${ethers.utils.formatUnits(liquidityRatio, 18)} (${liquidityRatio.mul(100).div(ethers.utils.parseUnits("1", 18))}%)`);
      
      // Tính số lượng token1 sẽ nhận được
      const token1AmountOut = reservesBefore[0].mul(liquidityRatio).div(ethers.utils.parseUnits("1", 18));
      console.log(`📈 Số lượng ${token1Info.symbol} sẽ nhận: ${ethers.utils.formatUnits(token1AmountOut, token1Info.decimals)}`);
      
      // Tính số lượng token2 sẽ nhận được
      const token2AmountOut = reservesBefore[1].mul(liquidityRatio).div(ethers.utils.parseUnits("1", 18));
      console.log(`📈 Số lượng ${token2Info.symbol} sẽ nhận: ${ethers.utils.formatUnits(token2AmountOut, token2Info.decimals)}`);

      // Bước 5: Thực hiện rút thanh khoản
      console.log("\n➖ Đang thực hiện rút thanh khoản...");
      const removeLiquidityTx = await simpleDex.removeLiquidity(
        token1Info.tokenAddress,  // Địa chỉ token1
        token2Info.tokenAddress,  // Địa chỉ token2
        actualRemoveAmount,        // Số lượng liquidity tokens sẽ rút
        { gasLimit: 300000 }       // Giới hạn gas để tránh lỗi
      );
      
      console.log("⏳ Transaction rút thanh khoản đã gửi:", removeLiquidityTx.hash);
      console.log("⏳ Đang chờ xác nhận...");
      
      const receipt = await removeLiquidityTx.wait(); // Chờ transaction hoàn thành
      console.log("✅ Thanh khoản đã được rút thành công!");
      console.log("⛽ Gas đã sử dụng:", receipt.gasUsed.toString());

      // Bước 6: Kiểm tra trạng thái sau khi rút thanh khoản
      console.log("\n🔍 Đang kiểm tra trạng thái sau khi rút thanh khoản...");
      
      // Lấy reserves sau khi rút
      const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      console.log(`💰 Reserves sau khi rút:`);
      console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)}`);
      console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)}`);
      
      // Lấy tổng thanh khoản sau khi rút
      const totalLiquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
      console.log(`🏊 Tổng thanh khoản sau khi rút: ${ethers.utils.formatUnits(totalLiquidityAfter, 18)}`);
      
      // Lấy thanh khoản của người dùng sau khi rút
      const userLiquidityAfter = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
      console.log(`👤 Thanh khoản của người dùng sau khi rút: ${ethers.utils.formatUnits(userLiquidityAfter, 18)}`);
      
      // Lấy số dư token sau khi rút
      const balance1After = await token1Contract.balanceOf(deployer.address);
      const balance2After = await token2Contract.balanceOf(deployer.address);
      console.log(`💳 Số dư token sau khi rút:`);
      console.log(`   • ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1After, token1Info.decimals)}`);
      console.log(`   • ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2After, token2Info.decimals)}`);

      // Bước 7: Tính toán thay đổi số dư
      const balance1Change = balance1After.sub(balance1Before); // Số token1 đã nhận
      const balance2Change = balance2After.sub(balance2Before); // Số token2 đã nhận
      const liquidityChange = userLiquidityBefore.sub(userLiquidityAfter); // Số liquidity tokens đã mất

      console.log(`\n📊 Thay đổi số dư:`);
      console.log(`   • ${token1Info.symbol} đã nhận: ${ethers.utils.formatUnits(balance1Change, token1Info.decimals)}`);
      console.log(`   • ${token2Info.symbol} đã nhận: ${ethers.utils.formatUnits(balance2Change, token2Info.decimals)}`);
      console.log(`   • Liquidity tokens đã mất: ${ethers.utils.formatUnits(liquidityChange, 18)}`);

      // Bước 8: So sánh với ước tính
      console.log(`\n📊 So sánh với ước tính:`);
      console.log(`   • ${token1Info.symbol} ước tính: ${ethers.utils.formatUnits(token1AmountOut, token1Info.decimals)}`);
      console.log(`   • ${token1Info.symbol} thực tế: ${ethers.utils.formatUnits(balance1Change, token1Info.decimals)}`);
      console.log(`   • ${token2Info.symbol} ước tính: ${ethers.utils.formatUnits(token2AmountOut, token2Info.decimals)}`);
      console.log(`   • ${token2Info.symbol} thực tế: ${ethers.utils.formatUnits(balance2Change, token2Info.decimals)}`);

      // Lưu kết quả test thành công
      testResults.testResults.removeLiquidity = {
        status: "passed", // Trạng thái: thành công
        transactionHash: removeLiquidityTx.hash, // Hash của transaction
        gasUsed: receipt.gasUsed.toString(), // Gas đã sử dụng
        removeDetails: {
          liquidityRemoved: ethers.utils.formatUnits(actualRemoveAmount, 18), // Số lượng liquidity tokens đã rút
          liquidityRatio: ethers.utils.formatUnits(liquidityRatio, 18), // Tỷ lệ thanh khoản đã rút
          estimatedToken1: ethers.utils.formatUnits(token1AmountOut, token1Info.decimals), // Số lượng token1 ước tính
          estimatedToken2: ethers.utils.formatUnits(token2AmountOut, token2Info.decimals), // Số lượng token2 ước tính
          actualToken1: ethers.utils.formatUnits(balance1Change, token1Info.decimals), // Số lượng token1 thực tế
          actualToken2: ethers.utils.formatUnits(balance2Change, token2Info.decimals)  // Số lượng token2 thực tế
        },
        reservesBefore: {
          reserve0: ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals), // Reserve token1 trước khi rút
          reserve1: ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)  // Reserve token2 trước khi rút
        },
        reservesAfter: {
          reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals), // Reserve token1 sau khi rút
          reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)  // Reserve token2 sau khi rút
        },
        liquidityChanges: {
          totalBefore: ethers.utils.formatUnits(totalLiquidityBefore, 18), // Tổng thanh khoản trước khi rút
          totalAfter: ethers.utils.formatUnits(totalLiquidityAfter, 18),   // Tổng thanh khoản sau khi rút
          userBefore: ethers.utils.formatUnits(userLiquidityBefore, 18),   // Thanh khoản người dùng trước khi rút
          userAfter: ethers.utils.formatUnits(userLiquidityAfter, 18)      // Thanh khoản người dùng sau khi rút
        },
        balanceChanges: {
          token1Gained: ethers.utils.formatUnits(balance1Change, token1Info.decimals), // Số token1 đã nhận
          token2Gained: ethers.utils.formatUnits(balance2Change, token2Info.decimals)  // Số token2 đã nhận
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

  } catch (error: any) {
    // Xử lý lỗi nếu có
    console.log("❌ Rút thanh khoản thất bại:", error.message);
    
    // Hiển thị thông tin lỗi chi tiết nếu có
    if (error.transaction) {
      console.log("Transaction hash:", error.transaction.hash);
    }
    
    if (error.receipt) {
      console.log("Gas đã sử dụng:", error.receipt.gasUsed.toString());
      console.log("Status:", error.receipt.status);
    }

    // Lưu kết quả test thất bại
    testResults.testResults.removeLiquidity = {
      status: "failed", // Trạng thái: thất bại
      error: error.message, // Thông báo lỗi
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
    path.resolve(infoDir, "RemoveLiquidityTest.json"),
    JSON.stringify(testResults, null, 2)
  );

  // ===== HIỂN THỊ TỔNG KẾT =====
  console.log("\n" + "=".repeat(50));
  console.log("✅ HOÀN THÀNH TEST RÚT THANH KHOẢN!");
  console.log("=".repeat(50));
  
  if (testResults.testResults.removeLiquidity.status === "passed") {
    console.log("🎉 Test rút thanh khoản thành công!");
    console.log("📊 Thanh khoản đã được rút thành công");
    console.log("💰 Token đã được trả về");
    console.log("📈 Reserves đã được cập nhật");
  } else if (testResults.testResults.removeLiquidity.status === "skipped") {
    console.log("⚠️ Test rút thanh khoản bị bỏ qua!");
    console.log("💡 Không có thanh khoản để rút");
  } else {
    console.log("❌ Test rút thanh khoản thất bại!");
    console.log("🔍 Vui lòng kiểm tra lỗi và thử lại");
  }
  
  console.log("📁 Kết quả đã lưu vào: info/RemoveLiquidityTest.json");
  
  console.log("\n🚀 BƯỚC TIẾP THEO:");
  console.log("-".repeat(40));
  console.log("1. Chạy 05f-test-all-dex-features.ts để test tất cả tính năng");
  console.log("2. Hoặc chạy các script test riêng lẻ khác");
}

// Chạy script chính
main().catch(e => {
  console.error("❌ Lỗi khi chạy script:", e);
  process.exit(1);
}); 