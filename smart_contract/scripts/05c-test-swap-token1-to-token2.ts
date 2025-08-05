import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔄 Test swap token1 → token2...\n");

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

  console.log(`\n🪙 Sử dụng cặp token: ${token1Name} (${token1Info.symbol}) → ${token2Name} (${token2Info.symbol})`);

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
    testName: "Test swap token1 → token2",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("🔄 TEST SWAP TOKEN1 → TOKEN2");
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
    const swapAmount = ethers.utils.parseUnits("5", token1Info.decimals); // Swap 5 token1

    console.log(`🔄 Sẽ swap: ${ethers.utils.formatUnits(swapAmount, token1Info.decimals)} ${token1Info.symbol} → ${token2Info.symbol}`);

    // Kiểm tra số dư có đủ không
    if (balance1Before.lt(swapAmount)) {
      throw new Error(`Số dư ${token1Info.symbol} không đủ! Cần: ${ethers.utils.formatUnits(swapAmount, token1Info.decimals)}, Có: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    }

    // Bước 3: Ước tính số lượng token2 sẽ nhận được
    console.log("🔍 Bước 3: Ước tính số lượng token2 sẽ nhận được...");
    const estimatedAmountOut = await simpleDex.getAmountOut(token1Info.tokenAddress, token2Info.tokenAddress, swapAmount);
    console.log(`📊 Ước tính sẽ nhận: ${ethers.utils.formatUnits(estimatedAmountOut, token2Info.decimals)} ${token2Info.symbol}`);

    // Bước 4: Approve token1 cho SimpleDEX
    console.log("🔍 Bước 4: Approve token1 cho SimpleDEX...");
    console.log("🔐 Approving token1...");
    const approveTx = await token1Contract.approve(simpleDexAddress, swapAmount);
    await approveTx.wait();
    console.log("✅ Token1 approved thành công!");

    // Bước 5: Thực hiện swap token1 → token2
    console.log("🔍 Bước 5: Thực hiện swap token1 → token2...");
    console.log("⏳ Đang gửi transaction swap...");
    const swapTx = await simpleDex.swapExactTokensForTokens(
      token1Info.tokenAddress,       // Địa chỉ token1
      token2Info.tokenAddress,       // Địa chỉ token2
      swapAmount,                    // Số lượng token1 muốn swap
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
    const token1Used = balance1Before.sub(balance1After);
    const token2Received = balance2After.sub(balance2Before);

    console.log(`💸 ${token1Info.symbol} đã sử dụng: ${ethers.utils.formatUnits(token1Used, token1Info.decimals)}`);
    console.log(`💰 ${token2Info.symbol} đã nhận: ${ethers.utils.formatUnits(token2Received, token2Info.decimals)}`);
    console.log(`📊 Ước tính ban đầu: ${ethers.utils.formatUnits(estimatedAmountOut, token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`📊 Thực tế nhận được: ${ethers.utils.formatUnits(token2Received, token2Info.decimals)} ${token2Info.symbol}`);

    // Tính toán tỷ lệ swap
    const swapRate = token2Received.mul(ethers.utils.parseUnits("1", token1Info.decimals)).div(token1Used);
    console.log(`📈 Tỷ lệ swap: 1 ${token1Info.symbol} = ${ethers.utils.formatUnits(swapRate, token2Info.decimals)} ${token2Info.symbol}`);

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
        amountIn: ethers.utils.formatUnits(swapAmount, token1Info.decimals),
        estimatedAmountOut: ethers.utils.formatUnits(estimatedAmountOut, token2Info.decimals),
        actualAmountOut: ethers.utils.formatUnits(token2Received, token2Info.decimals),
        swapRate: ethers.utils.formatUnits(swapRate, token2Info.decimals)
      }
    };

    console.log("\n✅ Test swap token1 → token2 hoàn thành thành công!");
    testResults.status = "success";

  } catch (error) {
    console.log("❌ Lỗi khi test swap token1 → token2:", error.message);
    testResults.status = "failed";
    testResults.error = error.message;
  }

  // Lưu kết quả vào file
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "05c-test-swap-token1-to-token2.json"),
    JSON.stringify(testResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("📁 Kết quả đã lưu vào: info/05c-test-swap-token1-to-token2.json");
  console.log("🎯 Bước tiếp theo: Chạy 05d-test-swap-token2-to-token1.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 