import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Kiểm tra trạng thái ban đầu của SimpleDEX...\n");

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
    testName: "Kiểm tra trạng thái ban đầu",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("📊 KIỂM TRA TRẠNG THÁI BAN ĐẦU");
  console.log("=".repeat(50));

  try {
    /**
     * Reserves :
     Hiển thị số lượng token đang có trong pool (2 token):

reserves[0]: số lượng token0 hiện tại trong pool (BigNumber)

reserves[1]: số lượng token1 hiện tại trong pool (BigNumber)
     */
    // Bước 1: Kiểm tra reserves của pool
    console.log("Bước 1: Kiểm tra reserves của pool...");
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`💰 Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);

    // Bước 2: Kiểm tra tổng thanh khoản
    /*
    Total Liquidity:
    Tổng thanh khoản của pool – thường là tổng lượng liquidity token được mint khi bạn và người khác thêm thanh khoản vào.

liquidity là giá trị kiểu BigNumber

Format về 18 decimals (Uniswap liquidity thường chuẩn 18)
    */
    console.log("🔍 Bước 2: Kiểm tra tổng thanh khoản...");
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`🏊 Tổng thanh khoản: ${ethers.utils.formatUnits(liquidity, 18)} LP tokens`);

    // Bước 3: Kiểm tra thanh khoản của user
    /*
    User Liquidity:
     Số lượng thanh khoản (LP tokens) mà riêng user vừa thêm vào (hoặc đang giữ trong pool).

Cũng dùng formatUnits(..., 18) vì LP token thường có 18 decimals.
    */
    console.log("🔍 Bước 3: Kiểm tra thanh khoản của user...");
    const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    console.log(`👤 Thanh khoản của user: ${ethers.utils.formatUnits(userLiquidity, 18)} LP tokens`);

    // Bước 4: Kiểm tra số dư token của user
    console.log("🔍 Bước 4: Kiểm tra số dư token của user...");
    const balance1 = await token1Contract.balanceOf(deployer.address);
    const balance2 = await token2Contract.balanceOf(deployer.address);
    console.log(`💳 Số dư ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1, token1Info.decimals)}`);
    console.log(`💳 Số dư ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2, token2Info.decimals)}`);

    // Bước 5: Kiểm tra thông tin pool
    console.log("🔍 Bước 5: Kiểm tra thông tin pool...");
    const poolInfo = await simpleDex.getPoolInfo(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`📊 Thông tin pool:`);
    console.log(`   - Token0: ${poolInfo.token0}`);
    console.log(`   - Token1: ${poolInfo.token1}`);
    console.log(`   - Reserve0: ${ethers.utils.formatUnits(poolInfo.reserve0, token1Info.decimals)} ${token1Info.symbol}`);
    console.log(`   - Reserve1: ${ethers.utils.formatUnits(poolInfo.reserve1, token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`   - Total Supply: ${ethers.utils.formatUnits(poolInfo.totalSupply, 18)} LP tokens`);

    // Lưu kết quả
    testResults.data = {
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
      },
      poolInfo: {
        token0: poolInfo.token0,
        token1: poolInfo.token1,
        reserve0: ethers.utils.formatUnits(poolInfo.reserve0, token1Info.decimals),
        reserve1: ethers.utils.formatUnits(poolInfo.reserve1, token2Info.decimals),
        totalSupply: ethers.utils.formatUnits(poolInfo.totalSupply, 18)
      }
    };

    console.log("\n✅ Kiểm tra trạng thái ban đầu hoàn thành thành công!");
    testResults.status = "success";

  } catch (error) {
    console.log("❌ Lỗi khi kiểm tra trạng thái ban đầu:", error.message);
    testResults.status = "failed";
    testResults.error = error.message;
  }

  // Lưu kết quả vào file
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "05a-test-initial-state.json"),
    JSON.stringify(testResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("📁 Kết quả đã lưu vào: info/05a-test-initial-state.json");
  console.log("🎯 Bước tiếp theo: Chạy 05b-test-add-liquidity.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 