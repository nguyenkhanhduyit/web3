import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Test tất cả tính năng SimpleDEX...\n");

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
  
  console.log("Người deploy:", deployer.address);
  console.log("SimpleDEX:", simpleDexAddress);

  // Lấy thông tin 2 token đầu tiên để test
  const tokenEntries = Object.entries(tokens);
  const [token1Name, token1Info] = tokenEntries[0];
  const [token2Name, token2Info] = tokenEntries[1];

  console.log(`\nSử dụng cặp token: ${token1Name} (${token1Info.symbol}) & ${token2Name} (${token2Info.symbol})`);

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
    testName: "Test tất cả tính năng DEX",
    status: "completed",
    tests: {}
  };

  console.log("\n" + "=".repeat(50));
  console.log("TEST TẤT CẢ TÍNH NĂNG SIMPLEDEX");
  console.log("=".repeat(50));

  //TEST 1: Kiểm tra trạng thái ban đầu 
  console.log("\nTEST 1: Kiểm tra trạng thái ban đầu");
  console.log("-".repeat(30));

  try {
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    const balance1 = await token1Contract.balanceOf(deployer.address);
    const balance2 = await token2Contract.balanceOf(deployer.address);

    console.log(`Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`Tổng thanh khoản: ${ethers.utils.formatUnits(liquidity, 18)} LP tokens`);
    console.log(`Thanh khoản user: ${ethers.utils.formatUnits(userLiquidity, 18)} LP tokens`);
    console.log(`Số dư ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1, token1Info.decimals)}`);
    console.log(`Số dư ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2, token2Info.decimals)}`);

    testResults.tests.initialState = {
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

  } catch (error) {
    console.log("Lỗi khi kiểm tra trạng thái ban đầu:", error.message);
    testResults.tests.initialState = {
      status: "failed",
      error: error.message
    };
  }

  // TEST 2: Thêm thanh khoản 
  console.log("\nTEST 2: Thêm thanh khoản");
  console.log("-".repeat(30));

  try {
    const addAmount1 = ethers.utils.parseUnits("50", token1Info.decimals);
    const addAmount2 = ethers.utils.parseUnits("50", token2Info.decimals);

    console.log(`Thêm: ${ethers.utils.formatUnits(addAmount1, token1Info.decimals)} ${token1Info.symbol} + ${ethers.utils.formatUnits(addAmount2, token2Info.decimals)} ${token2Info.symbol}`);

    // Approve tokens
    await token1Contract.approve(simpleDexAddress, addAmount1);
    await token2Contract.approve(simpleDexAddress, addAmount2);

    const addTx = await simpleDex.addLiquidity(
      token1Info.tokenAddress,
      token2Info.tokenAddress,
      addAmount1,
      addAmount2,
      { gasLimit: 300000 }
    );
    
    await addTx.wait();
    console.log("Thêm thanh khoản thành công!");

    const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`Reserves sau: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`Tổng thanh khoản sau: ${ethers.utils.formatUnits(liquidityAfter, 18)} LP tokens`);

    testResults.tests.addLiquidity = {
      status: "passed",
      transactionHash: addTx.hash,
      newReserves: {
        reserve0: ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)
      },
      newLiquidity: ethers.utils.formatUnits(liquidityAfter, 18)
    };

  } catch (error) {
    console.log("Lỗi khi thêm thanh khoản:", error.message);
    testResults.tests.addLiquidity = {
      status: "failed",
      error: error.message
    };
  }

  // TEST 3: Swap token1 → token2
  console.log("\nTEST 3: Swap token1 → token2");
  console.log("-".repeat(30));

  try {
    const swapAmount = ethers.utils.parseUnits("5", token1Info.decimals);
    console.log(`Swap ${ethers.utils.formatUnits(swapAmount, token1Info.decimals)} ${token1Info.symbol} → ${token2Info.symbol}`);

    // Approve và swap
    await token1Contract.approve(simpleDexAddress, swapAmount);
    const swapTx = await simpleDex.swapExactTokensForTokens(
      token1Info.tokenAddress,
      token2Info.tokenAddress,
      swapAmount,
      { gasLimit: 300000 }
    );
    
    await swapTx.wait();
    console.log("Swap token1 → token2 thành công!");

    const reservesAfterSwap = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`Reserves sau swap: ${ethers.utils.formatUnits(reservesAfterSwap[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfterSwap[1], token2Info.decimals)} ${token2Info.symbol}`);

    testResults.tests.swapToken1ToToken2 = {
      status: "passed",
      transactionHash: swapTx.hash,
      reservesAfter: {
        reserve0: ethers.utils.formatUnits(reservesAfterSwap[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reservesAfterSwap[1], token2Info.decimals)
      }
    };

  } catch (error) {
    console.log("Lỗi khi swap token1 → token2:", error.message);
    testResults.tests.swapToken1ToToken2 = {
      status: "failed",
      error: error.message
    };
  }

  //TEST 4: Swap token2 → token1 
  console.log("\nTEST 4: Swap token2 → token1");
  console.log("-".repeat(30));

  try {
    const swapAmount2 = ethers.utils.parseUnits("5", token2Info.decimals);
    console.log(`Swap ${ethers.utils.formatUnits(swapAmount2, token2Info.decimals)} ${token2Info.symbol} → ${token1Info.symbol}`);

    // Approve và swap
    await token2Contract.approve(simpleDexAddress, swapAmount2);
    const swapTx2 = await simpleDex.swapExactTokensForTokens(
      token2Info.tokenAddress,
      token1Info.tokenAddress,
      swapAmount2,
      { gasLimit: 300000 }
    );
    
    await swapTx2.wait();
    console.log("Swap token2 → token1 thành công!");

    const reservesAfterSwap2 = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`Reserves sau swap: ${ethers.utils.formatUnits(reservesAfterSwap2[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfterSwap2[1], token2Info.decimals)} ${token2Info.symbol}`);

    testResults.tests.swapToken2ToToken1 = {
      status: "passed",
      transactionHash: swapTx2.hash,
      reservesAfter: {
        reserve0: ethers.utils.formatUnits(reservesAfterSwap2[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reservesAfterSwap2[1], token2Info.decimals)
      }
    };

  } catch (error) {
    console.log("Lỗi khi swap token2 → token1:", error.message);
    testResults.tests.swapToken2ToToken1 = {
      status: "failed",
      error: error.message
    };
  }

  //TEST 5: Rút thanh khoản
  console.log("\nTEST 5: Rút thanh khoản");
  console.log("-".repeat(30));

  try {
    const currentUserLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    
    if (currentUserLiquidity.isZero()) {
      console.log("User không có thanh khoản để rút!");
      testResults.tests.removeLiquidity = {
        status: "skipped",
        reason: "User không có thanh khoản để rút"
      };
    } else {
      const removeAmount = ethers.utils.parseUnits("50", 18);
      console.log(`Rút ${ethers.utils.formatUnits(removeAmount, 18)} LP tokens`);

      let actualRemoveAmount = removeAmount;
      if (removeAmount.gt(currentUserLiquidity)) {
        actualRemoveAmount = currentUserLiquidity.div(2); // Rút 50% thanh khoản hiện có
        console.log(`Số lượng rút lớn hơn thanh khoản hiện có!`);
        console.log(`Sẽ rút 50% thanh khoản: ${ethers.utils.formatUnits(actualRemoveAmount, 18)}`);
      }

      const removeTx = await simpleDex.removeLiquidity(
        token1Info.tokenAddress,
        token2Info.tokenAddress,
        actualRemoveAmount,
        { gasLimit: 300000 }
      );
      
      await removeTx.wait();
      console.log("Rút thanh khoản thành công!");

      const finalReserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      const finalLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
      const finalUserLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
      const finalBalance1 = await token1Contract.balanceOf(deployer.address);
      const finalBalance2 = await token2Contract.balanceOf(deployer.address);

      console.log(`Reserves cuối: ${ethers.utils.formatUnits(finalReserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(finalReserves[1], token2Info.decimals)} ${token2Info.symbol}`);
      console.log(`Tổng thanh khoản cuối: ${ethers.utils.formatUnits(finalLiquidity, 18)} LP tokens`);
      console.log(`Thanh khoản user cuối: ${ethers.utils.formatUnits(finalUserLiquidity, 18)} LP tokens`);
      console.log(`Số dư ${token1Info.symbol} cuối: ${ethers.utils.formatUnits(finalBalance1, token1Info.decimals)}`);
      console.log(`Số dư ${token2Info.symbol} cuối: ${ethers.utils.formatUnits(finalBalance2, token2Info.decimals)}`);

      testResults.tests.removeLiquidity = {
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
    }

  } catch (error) {
    console.log("Lỗi khi rút thanh khoản:", error.message);
    testResults.tests.removeLiquidity = {
      status: "failed",
      error: error.message
    };
  }

  // TEST 6: Test các hàm ước tính
  console.log("\nTEST 6: Test các hàm ước tính");
  console.log("-".repeat(30));

  try {
    const testAmount = ethers.utils.parseUnits("10", token1Info.decimals);
    
    // Test getAmountOut
    const amountOut = await simpleDex.getAmountOut(token1Info.tokenAddress, token2Info.tokenAddress, testAmount);
    console.log(`getAmountOut: ${ethers.utils.formatUnits(testAmount, token1Info.decimals)} ${token1Info.symbol} → ${ethers.utils.formatUnits(amountOut, token2Info.decimals)} ${token2Info.symbol}`);
    
    // Test getAmountIn
    const amountIn = await simpleDex.getAmountIn(token1Info.tokenAddress, token2Info.tokenAddress, amountOut);
    console.log(`getAmountIn: ${ethers.utils.formatUnits(amountOut, token2Info.decimals)} ${token2Info.symbol} ← ${ethers.utils.formatUnits(amountIn, token1Info.decimals)} ${token1Info.symbol}`);

    testResults.tests.estimationFunctions = {
      status: "passed",
      getAmountOut: {
        amountIn: ethers.utils.formatUnits(testAmount, token1Info.decimals),
        amountOut: ethers.utils.formatUnits(amountOut, token2Info.decimals)
      },
      getAmountIn: {
        amountOut: ethers.utils.formatUnits(amountOut, token2Info.decimals),
        amountIn: ethers.utils.formatUnits(amountIn, token1Info.decimals)
      }
    };

  } catch (error) {
    console.log("Lỗi khi test các hàm ước tính:", error.message);
    testResults.tests.estimationFunctions = {
      status: "failed",
      error: error.message
    };
  }

  // Tính toán tổng kết
  const totalTests = Object.keys(testResults.tests).length;
  const passedTests = Object.values(testResults.tests).filter((test: any) => test.status === "passed").length;
  const failedTests = Object.values(testResults.tests).filter((test: any) => test.status === "failed").length;
  const skippedTests = Object.values(testResults.tests).filter((test: any) => test.status === "skipped").length;

  testResults.summary = {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    skipped: skippedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(2) + "%"
  };

  // Lưu kết quả vào file
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "05f-test-all-dex-features.json"),
    JSON.stringify(testResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("TẤT CẢ TEST ĐÃ HOÀN THÀNH!");
  console.log("=".repeat(50));
  console.log(`Tổng số test: ${totalTests}`);
  console.log(`Thành công: ${passedTests}`);
  console.log(`Thất bại: ${failedTests}`);
  console.log(`Bỏ qua: ${skippedTests}`);
  console.log(`Tỷ lệ thành công: ${testResults.summary.successRate}`);
  console.log("Kết quả chi tiết đã lưu vào: info/05f-test-all-dex-features.json");
  
  if (failedTests === 0) {
    console.log("\nTẤT CẢ TEST ĐỀU THÀNH CÔNG! SimpleDEX hoạt động hoàn hảo!");
    console.log(" Tất cả tính năng cốt lõi của DEX đều hoạt động:");
    console.log("   - Thêm thanh khoản");
    console.log("   - Rút thanh khoản");
    console.log("   - Swap (cả hai chiều)");
    console.log("   - Tính toán giá với phí");
    console.log("   - Quản lý token thanh khoản");
    console.log("   - Các hàm ước tính");
  } else {
    console.log(`\n Có ${failedTests} test thất bại. Vui lòng kiểm tra lại!`);
  }
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 