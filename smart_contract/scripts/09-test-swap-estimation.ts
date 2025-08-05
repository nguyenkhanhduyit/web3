import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("=".repeat(60));
    console.log("🚀 BẮT ĐẦU TEST TÍNH NĂNG ƯỚC LƯỢNG SWAP");
    console.log("=".repeat(60));

    // Đọc thông tin đã deploy
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    const dexInfoPath = path.join(__dirname, "../info/SimpleDEXAddress.json");
    
    if (!fs.existsSync(tokenInfoPath) || !fs.existsSync(dexInfoPath)) {
        console.log("❌ Không tìm thấy thông tin deployment. Vui lòng chạy script deployment trước.");
        return;
    }

    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    const dexInfo = JSON.parse(fs.readFileSync(dexInfoPath, "utf8"));

    console.log("📋 Thông tin tokens:");
    console.log(`   BTC: ${tokenInfo.BTC}`);
    console.log(`   ETH: ${tokenInfo.ETH}`);
    console.log(`   USDT: ${tokenInfo.USDT}`);
    console.log(`   SimpleDEX: ${dexInfo.SimpleDEX}`);

    // Lấy signer
    const [deployer] = await ethers.getSigners();
    console.log(`\n👤 Deployer: ${deployer.address}`);

    // Lấy contract instances
    const btcToken = await ethers.getContractAt("Token", tokenInfo.BTC);
    const ethToken = await ethers.getContractAt("Token", tokenInfo.ETH);
    const usdtToken = await ethers.getContractAt("Token", tokenInfo.USDT);
    const simpleDEX = await ethers.getContractAt("SimpleDEX", dexInfo.SimpleDEX);

    console.log("\n" + "=".repeat(60));
    console.log("🔍 KIỂM TRA THÔNG TIN POOL");
    console.log("=".repeat(60));

    // Kiểm tra thông tin pool BTC-ETH
    console.log("\n📊 Pool BTC-ETH:");
    try {
        const poolInfo = await simpleDEX.getPoolInfo(tokenInfo.BTC, tokenInfo.ETH);
        console.log(`   Reserve BTC: ${ethers.formatUnits(poolInfo.reserve0, 18)} BTC`);
        console.log(`   Reserve ETH: ${ethers.formatUnits(poolInfo.reserve1, 18)} ETH`);
        console.log(`   Total LP Supply: ${ethers.formatUnits(poolInfo.totalSupply, 18)} LP`);
        console.log(`   Giá ETH/BTC: ${ethers.formatUnits(poolInfo.price0to1, 18)} ETH/BTC`);
        console.log(`   Giá BTC/ETH: ${ethers.formatUnits(poolInfo.price1to0, 18)} BTC/ETH`);
    } catch (error) {
        console.log("   ❌ Pool BTC-ETH chưa có thanh khoản");
    }

    // Kiểm tra thông tin pool ETH-USDT
    console.log("\n📊 Pool ETH-USDT:");
    try {
        const poolInfo = await simpleDEX.getPoolInfo(tokenInfo.ETH, tokenInfo.USDT);
        console.log(`   Reserve ETH: ${ethers.formatUnits(poolInfo.reserve0, 18)} ETH`);
        console.log(`   Reserve USDT: ${ethers.formatUnits(poolInfo.reserve1, 6)} USDT`);
        console.log(`   Total LP Supply: ${ethers.formatUnits(poolInfo.totalSupply, 18)} LP`);
        console.log(`   Giá USDT/ETH: ${ethers.formatUnits(poolInfo.price0to1, 12)} USDT/ETH`);
        console.log(`   Giá ETH/USDT: ${ethers.formatUnits(poolInfo.price1to0, 6)} ETH/USDT`);
    } catch (error) {
        console.log("   ❌ Pool ETH-USDT chưa có thanh khoản");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🧮 TEST ƯỚC LƯỢNG SWAP");
    console.log("=".repeat(60));

    const estimationResults: any = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // Test 1: Ước lượng swap BTC -> ETH
    console.log("\n🔄 Test 1: Ước lượng swap BTC -> ETH");
    try {
        const amountIn = ethers.parseUnits("1", 18); // 1 BTC
        const amountOut = await simpleDEX.getAmountOut(tokenInfo.BTC, tokenInfo.ETH, amountIn);
        
        console.log(`   Input: ${ethers.formatUnits(amountIn, 18)} BTC`);
        console.log(`   Output: ${ethers.formatUnits(amountOut, 18)} ETH`);
        console.log(`   Tỷ lệ: 1 BTC = ${ethers.formatUnits(amountOut, 18)} ETH`);
        
        estimationResults.tests.push({
            test: "BTC -> ETH",
            input: {
                token: "BTC",
                amount: ethers.formatUnits(amountIn, 18)
            },
            output: {
                token: "ETH",
                amount: ethers.formatUnits(amountOut, 18)
            },
            ratio: `${ethers.formatUnits(amountOut, 18)} ETH/BTC`
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap BTC -> ETH");
        estimationResults.tests.push({
            test: "BTC -> ETH",
            error: "Không thể ước lượng"
        });
    }

    // Test 2: Ước lượng swap ETH -> BTC
    console.log("\n🔄 Test 2: Ước lượng swap ETH -> BTC");
    try {
        const amountIn = ethers.parseUnits("10", 18); // 10 ETH
        const amountOut = await simpleDEX.getAmountOut(tokenInfo.ETH, tokenInfo.BTC, amountIn);
        
        console.log(`   Input: ${ethers.formatUnits(amountIn, 18)} ETH`);
        console.log(`   Output: ${ethers.formatUnits(amountOut, 18)} BTC`);
        console.log(`   Tỷ lệ: 10 ETH = ${ethers.formatUnits(amountOut, 18)} BTC`);
        
        estimationResults.tests.push({
            test: "ETH -> BTC",
            input: {
                token: "ETH",
                amount: ethers.formatUnits(amountIn, 18)
            },
            output: {
                token: "BTC",
                amount: ethers.formatUnits(amountOut, 18)
            },
            ratio: `${ethers.formatUnits(amountOut, 18)} BTC/10 ETH`
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap ETH -> BTC");
        estimationResults.tests.push({
            test: "ETH -> BTC",
            error: "Không thể ước lượng"
        });
    }

    // Test 3: Ước lượng swap ETH -> USDT
    console.log("\n🔄 Test 3: Ước lượng swap ETH -> USDT");
    try {
        const amountIn = ethers.parseUnits("1", 18); // 1 ETH
        const amountOut = await simpleDEX.getAmountOut(tokenInfo.ETH, tokenInfo.USDT, amountIn);
        
        console.log(`   Input: ${ethers.formatUnits(amountIn, 18)} ETH`);
        console.log(`   Output: ${ethers.formatUnits(amountOut, 6)} USDT`);
        console.log(`   Tỷ lệ: 1 ETH = ${ethers.formatUnits(amountOut, 6)} USDT`);
        
        estimationResults.tests.push({
            test: "ETH -> USDT",
            input: {
                token: "ETH",
                amount: ethers.formatUnits(amountIn, 18)
            },
            output: {
                token: "USDT",
                amount: ethers.formatUnits(amountOut, 6)
            },
            ratio: `${ethers.formatUnits(amountOut, 6)} USDT/ETH`
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap ETH -> USDT");
        estimationResults.tests.push({
            test: "ETH -> USDT",
            error: "Không thể ước lượng"
        });
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 TEST ƯỚC LƯỢNG INPUT CHO OUTPUT CỐ ĐỊNH");
    console.log("=".repeat(60));

    // Test 4: Ước lượng input để nhận 1 BTC
    console.log("\n🎯 Test 4: Ước lượng ETH cần bán để nhận 1 BTC");
    try {
        const amountOut = ethers.parseUnits("1", 18); // 1 BTC
        const amountIn = await simpleDEX.getAmountIn(tokenInfo.ETH, tokenInfo.BTC, amountOut);
        
        console.log(`   Output mong muốn: ${ethers.formatUnits(amountOut, 18)} BTC`);
        console.log(`   Input cần thiết: ${ethers.formatUnits(amountIn, 18)} ETH`);
        console.log(`   Tỷ lệ: ${ethers.formatUnits(amountIn, 18)} ETH = 1 BTC`);
        
        estimationResults.tests.push({
            test: "ETH -> BTC (exact output)",
            output: {
                token: "BTC",
                amount: ethers.formatUnits(amountOut, 18)
            },
            input: {
                token: "ETH",
                amount: ethers.formatUnits(amountIn, 18)
            },
            ratio: `${ethers.formatUnits(amountIn, 18)} ETH/BTC`
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng input cho 1 BTC");
        estimationResults.tests.push({
            test: "ETH -> BTC (exact output)",
            error: "Không thể ước lượng"
        });
    }

    // Test 5: Ước lượng input để nhận 1000 USDT
    console.log("\n🎯 Test 5: Ước lượng ETH cần bán để nhận 1000 USDT");
    try {
        const amountOut = ethers.parseUnits("1000", 6); // 1000 USDT
        const amountIn = await simpleDEX.getAmountIn(tokenInfo.ETH, tokenInfo.USDT, amountOut);
        
        console.log(`   Output mong muốn: ${ethers.formatUnits(amountOut, 6)} USDT`);
        console.log(`   Input cần thiết: ${ethers.formatUnits(amountIn, 18)} ETH`);
        console.log(`   Tỷ lệ: ${ethers.formatUnits(amountIn, 18)} ETH = 1000 USDT`);
        
        estimationResults.tests.push({
            test: "ETH -> USDT (exact output)",
            output: {
                token: "USDT",
                amount: ethers.formatUnits(amountOut, 6)
            },
            input: {
                token: "ETH",
                amount: ethers.formatUnits(amountIn, 18)
            },
            ratio: `${ethers.formatUnits(amountIn, 18)} ETH/1000 USDT`
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng input cho 1000 USDT");
        estimationResults.tests.push({
            test: "ETH -> USDT (exact output)",
            error: "Không thể ước lượng"
        });
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SO SÁNH ƯỚC LƯỢNG VỚI THỰC TẾ");
    console.log("=".repeat(60));

    // Test 6: So sánh ước lượng với swap thực tế
    console.log("\n🔄 Test 6: So sánh ước lượng với swap thực tế (ETH -> BTC)");
    try {
        const swapAmount = ethers.parseUnits("0.1", 18); // 0.1 ETH
        
        // Ước lượng trước
        const estimatedOut = await simpleDEX.getAmountOut(tokenInfo.ETH, tokenInfo.BTC, swapAmount);
        console.log(`   Ước lượng: ${ethers.formatUnits(swapAmount, 18)} ETH -> ${ethers.formatUnits(estimatedOut, 18)} BTC`);
        
        // Thực hiện swap thực tế
        console.log("   Thực hiện swap thực tế...");
        const tx = await simpleDEX.swapExactTokensForTokens(tokenInfo.ETH, tokenInfo.BTC, swapAmount);
        const receipt = await tx.wait();
        
        // Lấy event Swap
        const swapEvent = receipt?.logs.find(log => {
            try {
                const parsed = simpleDEX.interface.parseLog(log);
                return parsed?.name === "Swap";
            } catch {
                return false;
            }
        });
        
        if (swapEvent) {
            const parsed = simpleDEX.interface.parseLog(swapEvent);
            const actualOut = parsed?.args.amountOut;
            console.log(`   Thực tế: ${ethers.formatUnits(swapAmount, 18)} ETH -> ${ethers.formatUnits(actualOut, 18)} BTC`);
            console.log(`   Chênh lệch: ${ethers.formatUnits(estimatedOut - actualOut, 18)} BTC`);
            console.log(`   Độ chính xác: ${((Number(actualOut) / Number(estimatedOut)) * 100).toFixed(2)}%`);
            
            estimationResults.tests.push({
                test: "So sánh ước lượng vs thực tế",
                estimated: ethers.formatUnits(estimatedOut, 18),
                actual: ethers.formatUnits(actualOut, 18),
                difference: ethers.formatUnits(estimatedOut - actualOut, 18),
                accuracy: `${((Number(actualOut) / Number(estimatedOut)) * 100).toFixed(2)}%`
            });
        }
    } catch (error) {
        console.log("   ❌ Không thể thực hiện test so sánh");
        estimationResults.tests.push({
            test: "So sánh ước lượng vs thực tế",
            error: "Không thể thực hiện"
        });
    }

    // Lưu kết quả
    const infoDir = path.join(__dirname, "../info");
    if (!fs.existsSync(infoDir)) {
        fs.mkdirSync(infoDir, { recursive: true });
    }

    const resultsPath = path.join(infoDir, "SwapEstimationResults.json");
    fs.writeFileSync(resultsPath, JSON.stringify(estimationResults, null, 2));
    console.log(`\n💾 Đã lưu kết quả vào: ${resultsPath}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ HOÀN THÀNH TEST TÍNH NĂNG ƯỚC LƯỢNG SWAP");
    console.log("=".repeat(60));
    console.log("\n📋 Tóm tắt:");
    console.log("   ✅ Đã thêm hàm getAmountOut() để ước lượng output");
    console.log("   ✅ Đã thêm hàm getAmountIn() để ước lượng input");
    console.log("   ✅ Đã thêm hàm getPoolInfo() để lấy thông tin pool");
    console.log("   ✅ Đã test các tính năng ước lượng");
    console.log("   ✅ Đã so sánh ước lượng với swap thực tế");
    console.log("   ✅ Đã lưu kết quả test");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }); 