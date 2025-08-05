import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Test thêm thanh khoản vào SimpleDEX...\n");

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
    testName: "Test thêm thanh khoản",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("TEST THÊM THANH KHOẢN");
  console.log("=".repeat(50));

  try {
    // Bước 1: Kiểm tra trạng thái trước khi thêm thanh khoản
    console.log("Bước 1: Kiểm tra trạng thái trước khi thêm thanh khoản...");
    const reservesBefore = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidityBefore = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidityBefore = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    const balance1Before = await token1Contract.balanceOf(deployer.address);
    const balance2Before = await token2Contract.balanceOf(deployer.address);

    console.log(`Reserves trước: ${ethers.utils.formatUnits(reservesBefore[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesBefore[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`Tổng thanh khoản trước: ${ethers.utils.formatUnits(liquidityBefore, 18)} LP tokens`);
    console.log(`Thanh khoản user trước: ${ethers.utils.formatUnits(userLiquidityBefore, 18)} LP tokens`);
    console.log(`Số dư ${token1Info.symbol} trước: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    console.log(`Số dư ${token2Info.symbol} trước: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);

    // Bước 2: Chuẩn bị số lượng token để thêm thanh khoản
    console.log("Bước 2: Chuẩn bị số lượng token để thêm thanh khoản...");
    const addAmount1 = ethers.utils.parseUnits("5000", token1Info.decimals); // 5k token1
    const addAmount2 = ethers.utils.parseUnits("5000", token2Info.decimals); // 5k token2

    console.log(`Sẽ thêm: ${ethers.utils.formatUnits(addAmount1, token1Info.decimals)} ${token1Info.symbol} + ${ethers.utils.formatUnits(addAmount2, token2Info.decimals)} ${token2Info.symbol}`);

    // Kiểm tra số dư có đủ không
    if (balance1Before.lt(addAmount1)) {
      throw new Error(`Số dư ${token1Info.symbol} không đủ! Cần: ${ethers.utils.formatUnits(addAmount1, token1Info.decimals)}, Có: ${ethers.utils.formatUnits(balance1Before, token1Info.decimals)}`);
    }
    if (balance2Before.lt(addAmount2)) {
      throw new Error(`Số dư ${token2Info.symbol} không đủ! Cần: ${ethers.utils.formatUnits(addAmount2, token2Info.decimals)}, Có: ${ethers.utils.formatUnits(balance2Before, token2Info.decimals)}`);
    }

    // Bước 3: Approve token cho SimpleDEX
    /*
    Khi muốn smart contract thay mặt bạn làm gì đó với token
     (ví dụ thêm thanh khoản, swap, stake, transfer,...) thì bạn phải cấp phép (approve) trước
    */
    console.log("Bước 3: Approve token cho SimpleDEX...");
    console.log("Approving token1...");
    const approve1Tx = await token1Contract.approve(simpleDexAddress, addAmount1);
    await approve1Tx.wait();
    console.log("Token1 approved thành công!");

    console.log("Approving token2...");
    const approve2Tx = await token2Contract.approve(simpleDexAddress, addAmount2);
    await approve2Tx.wait();
    console.log("Token2 approved thành công!");

    // Bước 4: Thêm thanh khoản
    console.log("Bước 4: Thêm thanh khoản...");
    console.log("Đang gửi transaction thêm thanh khoản...");
    const addLiquidityTx = await simpleDex.addLiquidity(
      token1Info.tokenAddress,  // Địa chỉ token1
      token2Info.tokenAddress,  // Địa chỉ token2
      addAmount1,               // Số lượng token1
      addAmount2,               // Số lượng token2
      { gasLimit: 300000 }      // Giới hạn gas để tránh lỗi
    );
    
    console.log("Transaction hash:", addLiquidityTx.hash);
    console.log("Đang chờ xác nhận...");
    await addLiquidityTx.wait();
    console.log("Thêm thanh khoản thành công!");

    // Bước 5: Kiểm tra trạng thái sau khi thêm thanh khoản
    console.log("Bước 5: Kiểm tra trạng thái sau khi thêm thanh khoản...");
    const reservesAfter = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidityAfter = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidityAfter = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    const balance1After = await token1Contract.balanceOf(deployer.address);
    const balance2After = await token2Contract.balanceOf(deployer.address);

    console.log(`Reserves sau: ${ethers.utils.formatUnits(reservesAfter[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reservesAfter[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`Tổng thanh khoản sau: ${ethers.utils.formatUnits(liquidityAfter, 18)} LP tokens`);
    console.log(`Thanh khoản user sau: ${ethers.utils.formatUnits(userLiquidityAfter, 18)} LP tokens`);
    console.log(`Số dư ${token1Info.symbol} sau: ${ethers.utils.formatUnits(balance1After, token1Info.decimals)}`);
    console.log(`Số dư ${token2Info.symbol} sau: ${ethers.utils.formatUnits(balance2After, token2Info.decimals)}`);

    // Bước 6: Tính toán thay đổi
    console.log("Bước 6: Tính toán thay đổi...");
    const liquidityAdded = userLiquidityAfter.sub(userLiquidityBefore);
    const token1Used = balance1Before.sub(balance1After);
    const token2Used = balance2Before.sub(balance2After);

    console.log(`Thanh khoản đã thêm: ${ethers.utils.formatUnits(liquidityAdded, 18)} LP tokens`);
    console.log(`${token1Info.symbol} đã sử dụng: ${ethers.utils.formatUnits(token1Used, token1Info.decimals)}`);
    console.log(`${token2Info.symbol} đã sử dụng: ${ethers.utils.formatUnits(token2Used, token2Info.decimals)}`);

    // Lưu kết quả
    testResults.data = {
      transactionHash: addLiquidityTx.hash,
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
        liquidityAdded: ethers.utils.formatUnits(liquidityAdded, 18),
        token1Used: ethers.utils.formatUnits(token1Used, token1Info.decimals),
        token2Used: ethers.utils.formatUnits(token2Used, token2Info.decimals)
      }
    };

    console.log("\nTest thêm thanh khoản hoàn thành thành công!");
    testResults.status = "success";

  } catch (error) {
    console.log("Lỗi khi test thêm thanh khoản:", error.message);
    testResults.status = "failed";
    testResults.error = error.message;
  }

  // Lưu kết quả vào file
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "05b-test-add-liquidity.json"),
    JSON.stringify(testResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("Kết quả đã lưu vào: info/05b-test-add-liquidity.json");
  console.log("Bước tiếp theo: Chạy 05c-test-swap-token1-to-token2.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 