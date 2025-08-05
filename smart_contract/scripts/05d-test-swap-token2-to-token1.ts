import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔄 Test swap token2 → token1...\n");

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

  console.log(`\n🪙 Sử dụng cặp token: ${token2Name} (${token2Info.symbol}) → ${token1Name} (${token1Info.symbol})`);

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
    testName: "Test swap token2 → token1",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("🔄 TEST SWAP TOKEN2 → TOKEN1");
  console.log("=".repeat(50));

  try {
    // Bước 1: Kiểm tra trạng thái trước khi swap
    console.log("🔍 Bước 1: Kiểm tra trạng thái trước khi swap...");
    const reservesBefore = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const balance1Before = await token1Contract.balanceOf(deployer.address);
    const balance2Before = await token2Contract.balanceOf(deployer.address);

    console.log(`💰 Reserves trước: ${ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`💳 Số dư ${token1Info.symbol} trước: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    console.log(`💳 Số dư ${token2Info.symbol} trước: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);

    // Bước 2: Chuẩn bị số lượng token để swap
    console.log("🔍 Bước 2: Chuẩn bị số lượng token để swap...");
    const swapAmount = ethers.utils.parseUnits("5", token2Info.decimals); // Swap 5 token2

    console.log(`🔄 Sẽ swap: ${ethers.utils.formatUnits(swapAmount, token2Info.decimals)} ${token2Info.symbol} → ${token1Info.symbol}`);

    // Kiểm tra số dư có đủ không
    if (balance2Before.lt(swapAmount)) {
      throw new Error(`Số dư ${token2Info.symbol} không đủ! Cần: ${ethers.utils.formatUnits(swapAmount, token2Info.decimals)}, Có: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);
    }

    // Bước 3: Ước tính số lượng token1 sẽ nhận được
    console.log("🔍 Bước 3: Ước tính số lượng token1 sẽ nhận được...");
    const estimatedAmountOut = await simpleDex.getAmountOut(token2Info.tokenAddress, token1Info.tokenAddress, swapAmount);
    console.log(`📊 Ước tính sẽ nhận: ${ethers.utils.formatUnits(estimatedAmountOut, token1Info.decimals)} ${token1Info.symbol}`);

    // Bước 4: Approve token2 cho SimpleDEX
    console.log("🔍 Bước 4: Approve token2 cho SimpleDEX...");
    console.log("🔐 Approving token2...");
    const approveTx = await token2Contract.approve(simpleDexAddress, swapAmount);
    await approveTx.wait();
    console.log("✅ Token2 approved thành công!");

    // Bước 5: Thực hiện swap token2 → token1
    console.log("🔍 Bước 5: Thực hiện swap token2 → token1...");
    console.log("⏳ Đang gửi transaction swap...");
    const swapTx = await simpleDex.swapExactTokensForTokens(
      token2Info.tokenAddress,       // Địa chỉ token2
      token1Info.tokenAddress,       // Địa chỉ token1
      swapAmount,                    // Số lượng token2 muốn swap
      { gasLimit: 300000 }           // Giới hạn gas để tránh lỗi
    );
    
    console.log("📝 Transaction hash:", swapTx.hash);
    console.log("⏳ Đang chờ xác nhận...");
    await swapTx.wait();
    console.log("✅ Swap thành công!");

    // Bước 6: Kiểm tra trạng thái sau khi swap
    console.log("🔍 Bước 6: Kiểm tra trạng thái sau khi swap...");
    const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const balance1After = await token1Contract.balanceOf(deployer.address);
    const balance2After = await token2Contract.balanceOf(deployer.address);

    console.log(`💰 Reserves sau: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`💳 Số dư ${token1Info.symbol} sau: ${ethers.utils.formatUnits(balance1After, token1Info.decimals)}`);
    console.log(`💳 Số dư ${token2Info.symbol} sau: ${ethers.utils.formatUnits(balance2After, token2Info.decimals)}`);

    // Bước 7: Tính toán thay đổi
    console.log("🔍 Bước 7: Tính toán thay đổi...");
    const token2Used = balance2Before.sub(balance2After);
    const token1Received = balance1After.sub(balance1Before);

    console.log(`💸 ${token2Info.symbol} đã sử dụng: ${ethers.utils.formatUnits(token2Used, token2Info.decimals)}`);
    console.log(`💰 ${token1Info.symbol} đã nhận: ${ethers.utils.formatUnits(token1Received, token1Info.decimals)}`);
    console.log(`📊 Ước tính ban đầu: ${ethers.utils.formatUnits(estimatedAmountOut, token1Info.decimals)} ${token1Info.symbol}`);
    console.log(`📊 Thực tế nhận được: ${ethers.utils.formatUnits(token1Received, token1Info.decimals)} ${token1Info.symbol}`);

    // Tính toán tỷ lệ swap
    const swapRate = token1Received.mul(ethers.utils.parseUnits("1", token2Info.decimals)).div(token2Used);
    console.log(`📈 Tỷ lệ swap: 1 ${token2Info.symbol} = ${ethers.utils.formatUnits(swapRate, token1Info.decimals)} ${token1Info.symbol}`);

    // Lưu kết quả
    testResults.data = {
      transactionHash: swapTx.hash,
      before: {
        reserves: {
          reserve0: ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals),
          reserve1: ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)
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
        userBalance: {
          token0: ethers.utils.formatUnits(balance1After, token1Info.decimals),
          token1: ethers.utils.formatUnits(balance2After, token2Info.decimals)
        }
      },
      swapDetails: {
        amountIn: ethers.utils.formatUnits(swapAmount, token2Info.decimals),
        estimatedAmountOut: ethers.utils.formatUnits(estimatedAmountOut, token1Info.decimals),
        actualAmountOut: ethers.utils.formatUnits(token1Received, token1Info.decimals),
        swapRate: ethers.utils.formatUnits(swapRate, token1Info.decimals)
      }
    };

    console.log("\n✅ Test swap token2 → token1 hoàn thành thành công!");
    testResults.status = "success";

  } catch (error) {
    console.log("❌ Lỗi khi test swap token2 → token1:", error.message);
    testResults.status = "failed";
    testResults.error = error.message;
  }

  // Lưu kết quả vào file
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "05d-test-swap-token2-to-token1.json"),
    JSON.stringify(testResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("📁 Kết quả đã lưu vào: info/05d-test-swap-token2-to-token1.json");
  console.log("🎯 Bước tiếp theo: Chạy 05e-test-remove-liquidity.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 