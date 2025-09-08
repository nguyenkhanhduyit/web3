import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script riêng cho việc swap token
 * Hỗ trợ các loại swap khác nhau:
 * - Swap với số lượng input cố định
 * - Swap với số lượng output cố định
 * - Tính toán giá trước khi swap
 */
async function main() {
    console.log("Bắt đầu script swap tokens...");
    
    // Lấy deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Đọc thông tin đã deploy
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    const dexInfoPath = path.join(__dirname, "../info/SimpleDEXAddress.json");
    
    if (!fs.existsSync(tokenInfoPath) || !fs.existsSync(dexInfoPath)) {
        throw new Error("Thiếu thông tin deployment. Hãy chạy 00-deploy-everything.ts trước!");
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    const dexInfo = JSON.parse(fs.readFileSync(dexInfoPath, "utf8"));
    
    console.log("Thông tin token:", Object.keys(tokenInfo));
    console.log("SimpleDEX address:", dexInfo.address);
    
    // Tạo contract instances
    const simpleDex = new ethers.Contract(dexInfo.address, [
        "function swapExactTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256 amountOut)",
        "function swapTokensForExactTokens(address tokenIn, address tokenOut, uint256 amountOut) external returns (uint256 amountIn)",
        "function getPrice(address token0, address token1) external view returns (uint256)",
        "function getReserves(address token0, address token1) external view returns (uint256 reserve0, uint256 reserve1)"
    ], deployer);
    
    // Lấy danh sách token
    const tokens = Object.values(tokenInfo);
    const btcToken = tokens.find(t => t.symbol === "BTC");
    const ethToken = tokens.find(t => t.symbol === "ETH");
    const usdtToken = tokens.find(t => t.symbol === "USDT");
    
    if (!btcToken || !ethToken || !usdtToken) {
        throw new Error("Không tìm thấy đủ token cần thiết");
    }
    
    // Tạo token contract instances
    const btcContract = new ethers.Contract(btcToken.tokenAddress, [
        "function balanceOf(address account) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function transfer(address to, uint256 amount) external returns (bool)"
    ], deployer);
    
    const ethContract = new ethers.Contract(ethToken.tokenAddress, [
        "function balanceOf(address account) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function transfer(address to, uint256 amount) external returns (bool)"
    ], deployer);
    
    const usdtContract = new ethers.Contract(usdtToken.tokenAddress, [
        "function balanceOf(address account) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function transfer(address to, uint256 amount) external returns (bool)"
    ], deployer);
    
    // Kiểm tra balance và approve
    console.log("\nKiểm tra balance và approve tokens...");
    
    const balances = {
        BTC: await btcContract.balanceOf(deployer.address),
        ETH: await ethContract.balanceOf(deployer.address),
        USDT: await usdtContract.balanceOf(deployer.address)
    };
    
    console.log("Token balances:");
    console.log(`   BTC: ${ethers.formatUnits(balances.BTC, btcToken.decimals)}`);
    console.log(`   ETH: ${ethers.formatUnits(balances.ETH, ethToken.decimals)}`);
    console.log(`   USDT: ${ethers.formatUnits(balances.USDT, usdtToken.decimals)}`);
    
    // Approve tokens cho SimpleDEX
    console.log("\nApproving tokens cho SimpleDEX...");
    
    const approveAmount = ethers.parseUnits("1000000", 18); // Approve 1M tokens
    
    await btcContract.approve(dexInfo.address, approveAmount);
    await ethContract.approve(dexInfo.address, approveAmount);
    await usdtContract.approve(dexInfo.address, approveAmount);
    
    console.log("Tokens đã được approve");
    
    // Kiểm tra giá hiện tại
    console.log("\nKiểm tra giá hiện tại...");
    
    try {
        const btcEthPrice = await simpleDex.getPrice(btcToken.tokenAddress, ethToken.tokenAddress);
        const ethUsdtPrice = await simpleDex.getPrice(ethToken.tokenAddress, usdtToken.tokenAddress);
        const btcUsdtPrice = await simpleDex.getPrice(btcToken.tokenAddress, usdtToken.tokenAddress);
        
        console.log("Giá hiện tại:");
        console.log(`   1 BTC = ${ethers.formatUnits(btcEthPrice, 18)} ETH`);
        console.log(`   1 ETH = ${ethers.formatUnits(ethUsdtPrice, 18)} USDT`);
        console.log(`   1 BTC = ${ethers.formatUnits(btcUsdtPrice, 18)} USDT`);
    } catch (error) {
        console.log("Không thể lấy giá (có thể pool chưa có thanh khoản)");
    }
    
    // Test swap với số lượng input cố định
    console.log("\nTesting swap với số lượng input cố định...");
    
    const swapAmount = ethers.parseUnits("1", ethToken.decimals); // Swap 1 ETH
    
    if (balances.ETH >= swapAmount) {
        try {
            console.log(`Swapping ${ethers.formatUnits(swapAmount, ethToken.decimals)} ETH -> BTC...`);
            
            const btcBalanceBefore = await btcContract.balanceOf(deployer.address);
            
            const swapTx = await simpleDex.swapExactTokensForTokens(
                ethToken.tokenAddress,
                btcToken.tokenAddress,
                swapAmount
            );
            await swapTx.wait();
            
            const btcBalanceAfter = await btcContract.balanceOf(deployer.address);
            const btcReceived = btcBalanceAfter - btcBalanceBefore;
            
            console.log("Swap thành công!");
            console.log(`   Đã nhận: ${ethers.formatUnits(btcReceived, btcToken.decimals)} BTC`);
            console.log(`   Tỷ lệ: 1 ETH = ${ethers.formatUnits(btcReceived, btcToken.decimals)} BTC`);
            
        } catch (error) {
            console.log("Swap failed:", error);
        }
    } else {
        console.log("Không đủ ETH để swap");
    }
    
    // Test swap với số lượng output cố định
    console.log("\nTesting swap với số lượng output cố định...");
    
    const desiredBtcAmount = ethers.parseUnits("0.1", btcToken.decimals); // Muốn nhận 0.1 BTC
    
    if (balances.ETH >= swapAmount) {
        try {
            console.log(`Swapping ETH -> ${ethers.formatUnits(desiredBtcAmount, btcToken.decimals)} BTC...`);
            
            const ethBalanceBefore = await ethContract.balanceOf(deployer.address);
            
            const swapTx = await simpleDex.swapTokensForExactTokens(
                ethToken.tokenAddress,
                btcToken.tokenAddress,
                desiredBtcAmount
            );
            await swapTx.wait();
            
            const ethBalanceAfter = await ethContract.balanceOf(deployer.address);
            const ethUsed = ethBalanceBefore - ethBalanceAfter;
            
            console.log("Swap thành công!");
            console.log(`   Đã dùng: ${ethers.formatUnits(ethUsed, ethToken.decimals)} ETH`);
            console.log(`   Đã nhận: ${ethers.formatUnits(desiredBtcAmount, btcToken.decimals)} BTC`);
            console.log(`   Tỷ lệ: ${ethers.formatUnits(ethUsed, ethToken.decimals)} ETH = ${ethers.formatUnits(desiredBtcAmount, btcToken.decimals)} BTC`);
            
        } catch (error) {
            console.log("Swap failed:", error);
        }
    } else {
        console.log("Không đủ ETH để swap");
    }
    
    // Test swap USDT -> ETH
    console.log("\nTesting swap USDT -> ETH...");
    
    const usdtSwapAmount = ethers.parseUnits("100", usdtToken.decimals); // Swap 100 USDT
    
    if (balances.USDT >= usdtSwapAmount) {
        try {
            console.log(`Swapping ${ethers.formatUnits(usdtSwapAmount, usdtToken.decimals)} USDT -> ETH...`);
            
            const ethBalanceBefore = await ethContract.balanceOf(deployer.address);
            
            const swapTx = await simpleDex.swapExactTokensForTokens(
                usdtToken.tokenAddress,
                ethToken.tokenAddress,
                usdtSwapAmount
            );
            await swapTx.wait();
            
            const ethBalanceAfter = await ethContract.balanceOf(deployer.address);
            const ethReceived = ethBalanceAfter - ethBalanceBefore;
            
            console.log("Swap thành công!");
            console.log(`   Đã nhận: ${ethers.formatUnits(ethReceived, ethToken.decimals)} ETH`);
            console.log(`   Tỷ lệ: 100 USDT = ${ethers.formatUnits(ethReceived, ethToken.decimals)} ETH`);
            
        } catch (error) {
            console.log("Swap failed:", error);
        }
    } else {
        console.log("Không đủ USDT để swap");
    }
    
    // Lưu kết quả swap
    const swapResults = {
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        dexAddress: dexInfo.address,
        swaps: [
            {
                type: "ExactInput",
                tokenIn: "ETH",
                tokenOut: "BTC",
                amountIn: ethers.formatUnits(swapAmount, ethToken.decimals),
                status: "completed"
            },
            {
                type: "ExactOutput",
                tokenIn: "ETH",
                tokenOut: "BTC",
                amountOut: ethers.formatUnits(desiredBtcAmount, btcToken.decimals),
                status: "completed"
            },
            {
                type: "ExactInput",
                tokenIn: "USDT",
                tokenOut: "ETH",
                amountIn: ethers.formatUnits(usdtSwapAmount, usdtToken.decimals),
                status: "completed"
            }
        ]
    };
    
    const swapResultsPath = path.join(__dirname, "../info/SwapResults.json");
    fs.writeFileSync(swapResultsPath, JSON.stringify(swapResults, null, 2));
    console.log("\nKết quả swap đã được lưu vào:", swapResultsPath);
    
    console.log("\nScript swap tokens hoàn thành!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
