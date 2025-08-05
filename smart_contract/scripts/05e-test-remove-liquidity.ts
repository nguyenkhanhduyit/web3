import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("📉 Test rút thanh khoản từ SimpleDEX...\n");

  // Đọc địa chỉ các token đã deploy
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  // Đọc địa chỉ SimpleDEX đã deploy
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  // Lấy thông tin người deploy
  const [deployer] = await ethers.getSigners();
  
  console.log("📍 Người deploy:", deployer.address);
  console.log("🏦 SimpleDEX:", simpleDexAddress);

  // Lấy thông tin 2 token đầu tiên để test
  const tokenEntries = Object.entries(tokens);
  const [token1Name, token1Info] = tokenEntries[0];
  const [token2Name, token2Info] = tokenEntries[1];

  console.log(`\n🪙 Sử dụng cặp token: ${token1Name} (${token1Info.symbol}) & ${token2Name} (${token2Info.symbol})`);

  // Lấy contract SimpleDEX
  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);

  // Lấy contract của 2 token
  const token1Contract = new ethers.Contract(token1Info.tokenAddress, [
    "function balanceOf(address) external view returns (uint256)",
    "function approve(address,uint256) external returns (bool)"
  ], deployer);
  
  const token2Contract = new ethers.Contract(token2Info.tokenAddress, [
    "function balanceOf(address) external view returns (uint256)",
    "function approve(address,uint256) external returns (bool)"
  ], deployer);

  // Lưu kết quả test
  const testResults: any = {
    timestamp: new Date().toISOString(),
    testName: "Test rút thanh khoản",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("📉 TEST RÚT THANH KHOẢN");
  console.log("=".repeat(50));

  try {
    // Bước 1: Kiểm tra trạng thái trước khi rút thanh khoản
    console.log("🔍 Bước 1: Kiểm tra trạng thái trước khi rút thanh khoản...");
    const reservesBefore = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidityBefore = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidityBefore = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    const balance1Before = await token1Contract.balanceOf(deployer.address);
    const balance2Before = await token2Contract.balanceOf(deployer.address);

    console.log(`💰 Reserves trước: ${ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`🏊 Tổng thanh khoản trước: ${ethers.utils.formatUnits(liquidityBefore, 18)} LP tokens`);
    console.log(`👤 Thanh khoản user trước: ${ethers.utils.formatUnits(userLiquidityBefore, 18)} LP tokens`);
    console.log(`💳 Số dư ${token1Info.symbol} trước: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    console.log(`💳 Số dư ${token2Info.symbol} trước: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);

    // Bước 2: Kiểm tra xem user có thanh khoản không
    if (userLiquidityBefore.isZero()) {
      console.log("⚠️ User không có thanh khoản để rút!");
      console.log("💡 Cần chạy 05b-test-add-liquidity.ts trước để thêm thanh khoản");
      
      testResults.status = "skipped";
      testResults.reason = "User không có thanh khoản để rút";
      
    } else {
      // Bước 3: Chuẩn bị số lượng thanh khoản để rút
      console.log("🔍 Bước 3: Chuẩn bị số lượng thanh khoản để rút...");
      const removeAmount = ethers.utils.parseUnits("50", 18); // 50 liquidity tokens (giá trị ban đầu)
      
      console.log(`📉 Sẽ rút: ${ethers.utils.formatUnits(removeAmount, 18)} LP tokens`);

      // Kiểm tra xem số lượng rút có lớn hơn thanh khoản hiện có không
      if (removeAmount.gt(userLiquidityBefore)) {
        console.log("⚠️ Số lượng rút lớn hơn thanh khoản hiện có!");
        console.log(`💡 Sẽ rút 50% thanh khoản: ${ethers.utils.formatUnits(userLiquidityBefore.div(2), 18)}`);
        const actualRemoveAmount = userLiquidityBefore.div(2); // Rút 50% thanh khoản hiện có
        console.log(`📉 Số lượng thanh khoản sẽ rút: ${ethers.utils.formatUnits(actualRemoveAmount, 18)} liquidity tokens`);

        // Bước 4: Rút thanh khoản
        console.log("🔍 Bước 4: Rút thanh khoản...");
        console.log("⏳ Đang gửi transaction rút thanh khoản...");
        const removeTx = await simpleDex.removeLiquidity(
          token1Info.tokenAddress,  // Địa chỉ token1
          token2Info.tokenAddress,  // Địa chỉ token2
          actualRemoveAmount,       // Số lượng thanh khoản muốn rút
          { gasLimit: 300000 }      // Giới hạn gas để tránh lỗi
        );
        
        console.log("📝 Transaction hash:", removeTx.hash);
        console.log("⏳ Đang chờ xác nhận...");
        await removeTx.wait();
        console.log("✅ Rút thanh khoản thành công!");

        // Bước 5: Kiểm tra trạng thái sau khi rút thanh khoản
        console.log("🔍 Bước 5: Kiểm tra trạng thái sau khi rút thanh khoản...");
        const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
        const liquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
        const userLiquidityAfter = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
        const balance1After = await token1Contract.balanceOf(deployer.address);
        const balance2After = await token2Contract.balanceOf(deployer.address);

        console.log(`💰 Reserves sau: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)} ${token2Info.symbol}`);
        console.log(`🏊 Tổng thanh khoản sau: ${ethers.utils.formatUnits(liquidityAfter, 18)} LP tokens`);
        console.log(`👤 Thanh khoản user sau: ${ethers.utils.formatUnits(userLiquidityAfter, 18)} LP tokens`);
        console.log(`💳 Số dư ${token1Info.symbol} sau: ${ethers.utils.formatUnits(balance1After, token1Info.decimals)}`);
        console.log(`💳 Số dư ${token2Info.symbol} sau: ${ethers.utils.formatUnits(balance2After, token2Info.decimals)}`);

        // Bước 6: Tính toán thay đổi
        console.log("🔍 Bước 6: Tính toán thay đổi...");
        const liquidityRemoved = userLiquidityBefore.sub(userLiquidityAfter);
        const token1Received = balance1After.sub(balance1Before);
        const token2Received = balance2After.sub(balance2Before);

        console.log(`📉 Thanh khoản đã rút: ${ethers.utils.formatUnits(liquidityRemoved, 18)} LP tokens`);
        console.log(`💰 ${token1Info.symbol} đã nhận: ${ethers.utils.formatUnits(token1Received, token1Info.decimals)}`);
        console.log(`💰 ${token2Info.symbol} đã nhận: ${ethers.utils.formatUnits(token2Received, token2Info.decimals)}`);

        // Lưu kết quả
        testResults.data = {
          transactionHash: removeTx.hash,
          before: {
            reserves: {
              reserve0: ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals),
              reserve1: ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)
            },
            liquidity: {
              total: ethers.utils.formatUnits(liquidityBefore, 18),
              user: ethers.utils.formatUnits(userLiquidityBefore, 18)
            },
            userBalance: {
              token0: ethers.utils.formatUnits(balance1Before, token1Info.decimals),
              token1: ethers.utils.formatUnits(balance2Before, token2Info.decimals)
            }
          },
          after: {
            reserves: {
              reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals),
              reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)
            },
            liquidity: {
              total: ethers.utils.formatUnits(liquidityAfter, 18),
              user: ethers.utils.formatUnits(userLiquidityAfter, 18)
            },
            userBalance: {
              token0: ethers.utils.formatUnits(balance1After, token1Info.decimals),
              token1: ethers.utils.formatUnits(balance2After, token2Info.decimals)
            }
          },
          changes: {
            liquidityRemoved: ethers.utils.formatUnits(liquidityRemoved, 18),
            token1Received: ethers.utils.formatUnits(token1Received, token1Info.decimals),
            token2Received: ethers.utils.formatUnits(token2Received, token2Info.decimals)
          }
        };

        console.log("\n✅ Test rút thanh khoản hoàn thành thành công!");
        testResults.status = "success";

      } else {
        // Nếu số lượng rút nhỏ hơn hoặc bằng thanh khoản hiện có
        console.log(`📉 Số lượng thanh khoản sẽ rút: ${ethers.utils.formatUnits(removeAmount, 18)} liquidity tokens`);

        // Bước 4: Rút thanh khoản
        console.log("🔍 Bước 4: Rút thanh khoản...");
        console.log("⏳ Đang gửi transaction rút thanh khoản...");
        const removeTx = await simpleDex.removeLiquidity(
          token1Info.tokenAddress,  // Địa chỉ token1
          token2Info.tokenAddress,  // Địa chỉ token2
          removeAmount,             // Số lượng thanh khoản muốn rút
          { gasLimit: 300000 }      // Giới hạn gas để tránh lỗi
        );
        
        console.log("📝 Transaction hash:", removeTx.hash);
        console.log("⏳ Đang chờ xác nhận...");
        await removeTx.wait();
        console.log("✅ Rút thanh khoản thành công!");

        // Bước 5: Kiểm tra trạng thái sau khi rút thanh khoản
        console.log("🔍 Bước 5: Kiểm tra trạng thái sau khi rút thanh khoản...");
        const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
        const liquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
        const userLiquidityAfter = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
        const balance1After = await token1Contract.balanceOf(deployer.address);
        const balance2After = await token2Contract.balanceOf(deployer.address);

        console.log(`💰 Reserves sau: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)} ${token2Info.symbol}`);
        console.log(`🏊 Tổng thanh khoản sau: ${ethers.utils.formatUnits(liquidityAfter, 18)} LP tokens`);
        console.log(`👤 Thanh khoản user sau: ${ethers.utils.formatUnits(userLiquidityAfter, 18)} LP tokens`);
        console.log(`💳 Số dư ${token1Info.symbol} sau: ${ethers.utils.formatUnits(balance1After, token1Info.decimals)}`);
        console.log(`💳 Số dư ${token2Info.symbol} sau: ${ethers.utils.formatUnits(balance2After, token2Info.decimals)}`);

        // Bước 6: Tính toán thay đổi
        console.log("🔍 Bước 6: Tính toán thay đổi...");
        const liquidityRemoved = userLiquidityBefore.sub(userLiquidityAfter);
        const token1Received = balance1After.sub(balance1Before);
        const token2Received = balance2After.sub(balance2Before);

        console.log(`📉 Thanh khoản đã rút: ${ethers.utils.formatUnits(liquidityRemoved, 18)} LP tokens`);
        console.log(`💰 ${token1Info.symbol} đã nhận: ${ethers.utils.formatUnits(token1Received, token1Info.decimals)}`);
        console.log(`💰 ${token2Info.symbol} đã nhận: ${ethers.utils.formatUnits(token2Received, token2Info.decimals)}`);

        // Lưu kết quả
        testResults.data = {
          transactionHash: removeTx.hash,
          before: {
            reserves: {
              reserve0: ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals),
              reserve1: ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)
            },
            liquidity: {
              total: ethers.utils.formatUnits(liquidityBefore, 18),
              user: ethers.utils.formatUnits(userLiquidityBefore, 18)
            },
            userBalance: {
              token0: ethers.utils.formatUnits(balance1Before, token1Info.decimals),
              token1: ethers.utils.formatUnits(balance2Before, token2Info.decimals)
            }
          },
          after: {
            reserves: {
              reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals),
              reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)
            },
            liquidity: {
              total: ethers.utils.formatUnits(liquidityAfter, 18),
              user: ethers.utils.formatUnits(userLiquidityAfter, 18)
            },
            userBalance: {
              token0: ethers.utils.formatUnits(balance1After, token1Info.decimals),
              token1: ethers.utils.formatUnits(balance2After, token2Info.decimals)
            }
          },
          changes: {
            liquidityRemoved: ethers.utils.formatUnits(liquidityRemoved, 18),
            token1Received: ethers.utils.formatUnits(token1Received, token1Info.decimals),
            token2Received: ethers.utils.formatUnits(token2Received, token2Info.decimals)
          }
        };

        console.log("\n✅ Test rút thanh khoản hoàn thành thành công!");
        testResults.status = "success";
      }
    }

  } catch (error) {
    console.log("❌ Lỗi khi test rút thanh khoản:", error.message);
    testResults.status = "failed";
    testResults.error = error.message;
  }

  // Lưu kết quả vào file
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "05e-test-remove-liquidity.json"),
    JSON.stringify(testResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("📁 Kết quả đã lưu vào: info/05e-test-remove-liquidity.json");
  console.log("🎯 Bước tiếp theo: Chạy 05f-test-all-dex-features.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 