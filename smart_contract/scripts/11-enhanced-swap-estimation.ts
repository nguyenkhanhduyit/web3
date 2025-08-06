import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("=".repeat(60));
    console.log("🚀 ENHANCED SWAP ESTIMATION WITH PRICE ORACLE");
    console.log("=".repeat(60));

    // Đọc thông tin đã deploy
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    const dexInfoPath = path.join(__dirname, "../info/SimpleDEXAddress.json");
    const priceOraclePath = path.join(__dirname, "../info/PriceOracleAddress.json");
    
    if (!fs.existsSync(tokenInfoPath) || !fs.existsSync(dexInfoPath) || !fs.existsSync(priceOraclePath)) {
        console.log("❌ Không tìm thấy thông tin deployment. Vui lòng chạy script deployment trước.");
        return;
    }

    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    const dexInfo = JSON.parse(fs.readFileSync(dexInfoPath, "utf8"));
    const priceOracleInfo = JSON.parse(fs.readFileSync(priceOraclePath, "utf8"));

    console.log("📋 Thông tin contracts:");
    console.log(`   SimpleDEX: ${dexInfo.address}`);
    console.log(`   PriceOracle: ${priceOracleInfo.address}`);

    // Lấy signer
    const [deployer] = await ethers.getSigners();
    console.log(`\n👤 Deployer: ${deployer.address}`);

    // Lấy contract instances
    const simpleDEX = await ethers.getContractAt("SimpleDEX", dexInfo.address);
    const priceOracle = await ethers.getContractAt("PriceOracle", priceOracleInfo.address);

    // Lấy địa chỉ USDT để làm base currency
    const usdtAddress = tokenInfo["Tether USD"].tokenAddress;

    console.log("\n" + "=".repeat(60));
    console.log("🧮 ENHANCED SWAP ESTIMATION");
    console.log("=".repeat(60));

    const estimationResults: any = {
        timestamp: new Date().toISOString(),
        priceOracleAddress: priceOracleInfo.address,
        estimations: []
    };

    // Test 1: Ước lượng swap BTC -> ETH
    console.log("\n🔄 Test 1: Ước lượng swap BTC -> ETH");
    try {
        const btcAddress = tokenInfo["Bitcoin"].tokenAddress;
        const ethAddress = tokenInfo["Ethereum"].tokenAddress;
        const amountIn = ethers.utils.parseUnits("1", 18); // 1 BTC

        // Ước lượng số lượng ETH sẽ nhận được
        const amountOut = await simpleDEX.getAmountOut(btcAddress, ethAddress, amountIn);
        
        // Lấy giá BTC và ETH so với USDT từ PriceOracle
        const btcPriceInUSDT = await priceOracle.getPrice(btcAddress, usdtAddress);
        const ethPriceInUSDT = await priceOracle.getPrice(ethAddress, usdtAddress);
        
        // Tính giá trị USDT của input và output
        // Giá từ PriceOracle đã có 18 decimals
        const inputValueInUSDT = amountIn.mul(btcPriceInUSDT).div(ethers.utils.parseUnits("1", 18));
        const outputValueInUSDT = amountOut.mul(ethPriceInUSDT).div(ethers.utils.parseUnits("1", 18));
        
        console.log(`   Input: ${ethers.utils.formatUnits(amountIn, 18)} BTC`);
        console.log(`   Input Value: $${ethers.utils.formatUnits(inputValueInUSDT, 18)} USDT`);
        console.log(`   Output: ${ethers.utils.formatUnits(amountOut, 18)} ETH`);
        console.log(`   Output Value: $${ethers.utils.formatUnits(outputValueInUSDT, 18)} USDT`);
        console.log(`   Tỷ lệ: 1 BTC = ${ethers.utils.formatUnits(amountOut, 18)} ETH`);
        console.log(`   Giá trị chênh lệch: $${ethers.utils.formatUnits(inputValueInUSDT.sub(outputValueInUSDT), 18)} USDT`);
        
        estimationResults.estimations.push({
            test: "BTC -> ETH",
            input: {
                token: "BTC",
                amount: ethers.utils.formatUnits(amountIn, 18),
                valueInUSDT: ethers.utils.formatUnits(inputValueInUSDT, 18)
            },
            output: {
                token: "ETH",
                amount: ethers.utils.formatUnits(amountOut, 18),
                valueInUSDT: ethers.utils.formatUnits(outputValueInUSDT, 18)
            },
            ratio: `${ethers.utils.formatUnits(amountOut, 18)} ETH/BTC`,
            valueDifference: ethers.utils.formatUnits(inputValueInUSDT.sub(outputValueInUSDT), 18)
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap BTC -> ETH:", error.message);
    }

    // Test 2: Ước lượng swap ETH -> BTC
    console.log("\n🔄 Test 2: Ước lượng swap ETH -> BTC");
    try {
        const btcAddress = tokenInfo["Bitcoin"].tokenAddress;
        const ethAddress = tokenInfo["Ethereum"].tokenAddress;
        const amountIn = ethers.utils.parseUnits("10", 18); // 10 ETH

        // Ước lượng số lượng BTC sẽ nhận được
        const amountOut = await simpleDEX.getAmountOut(ethAddress, btcAddress, amountIn);
        
        // Lấy giá ETH và BTC so với USDT từ PriceOracle
        const ethPriceInUSDT = await priceOracle.getPrice(ethAddress, usdtAddress);
        const btcPriceInUSDT = await priceOracle.getPrice(btcAddress, usdtAddress);
        
        // Tính giá trị USDT của input và output
        const inputValueInUSDT = amountIn.mul(ethPriceInUSDT).div(ethers.utils.parseUnits("1", 18));
        const outputValueInUSDT = amountOut.mul(btcPriceInUSDT).div(ethers.utils.parseUnits("1", 18));
        
        console.log(`   Input: ${ethers.utils.formatUnits(amountIn, 18)} ETH`);
        console.log(`   Input Value: $${ethers.utils.formatUnits(inputValueInUSDT, 18)} USDT`);
        console.log(`   Output: ${ethers.utils.formatUnits(amountOut, 18)} BTC`);
        console.log(`   Output Value: $${ethers.utils.formatUnits(outputValueInUSDT, 18)} USDT`);
        console.log(`   Tỷ lệ: 10 ETH = ${ethers.utils.formatUnits(amountOut, 18)} BTC`);
        console.log(`   Giá trị chênh lệch: $${ethers.utils.formatUnits(inputValueInUSDT.sub(outputValueInUSDT), 18)} USDT`);
        
        estimationResults.estimations.push({
            test: "ETH -> BTC",
            input: {
                token: "ETH",
                amount: ethers.utils.formatUnits(amountIn, 18),
                valueInUSDT: ethers.utils.formatUnits(inputValueInUSDT, 18)
            },
            output: {
                token: "BTC",
                amount: ethers.utils.formatUnits(amountOut, 18),
                valueInUSDT: ethers.utils.formatUnits(outputValueInUSDT, 18)
            },
            ratio: `${ethers.utils.formatUnits(amountOut, 18)} BTC/10 ETH`,
            valueDifference: ethers.utils.formatUnits(inputValueInUSDT.sub(outputValueInUSDT), 18)
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap ETH -> BTC:", error.message);
    }

    // Test 3: Ước lượng swap ETH -> USDT
    console.log("\n🔄 Test 3: Ước lượng swap ETH -> USDT");
    try {
        const ethAddress = tokenInfo["Ethereum"].tokenAddress;
        const usdtToken = tokenInfo["Tether USD"];
        const amountIn = ethers.utils.parseUnits("5", 18); // 5 ETH

        // Ước lượng số lượng USDT sẽ nhận được
        const amountOut = await simpleDEX.getAmountOut(ethAddress, usdtAddress, amountIn);
        
        // Lấy giá ETH so với USDT từ PriceOracle
        const ethPriceInUSDT = await priceOracle.getPrice(ethAddress, usdtAddress);
        
        // Tính giá trị USDT của input và output
        const inputValueInUSDT = amountIn.mul(ethPriceInUSDT).div(ethers.utils.parseUnits("1", 18));
        const outputValueInUSDT = amountOut; // USDT có 6 decimals, giá trị trực tiếp
        
        console.log(`   Input: ${ethers.utils.formatUnits(amountIn, 18)} ETH`);
        console.log(`   Input Value: $${ethers.utils.formatUnits(inputValueInUSDT, 18)} USDT`);
        console.log(`   Output: ${ethers.utils.formatUnits(amountOut, usdtToken.decimals)} USDT`);
        console.log(`   Output Value: $${ethers.utils.formatUnits(amountOut, usdtToken.decimals)} USDT`);
        console.log(`   Tỷ lệ: 5 ETH = ${ethers.utils.formatUnits(amountOut, usdtToken.decimals)} USDT`);
        const valueDifference = inputValueInUSDT.sub(amountOut);
        console.log(`   Giá trị chênh lệch: $${ethers.utils.formatUnits(valueDifference, usdtToken.decimals)} USDT`);
        
        estimationResults.estimations.push({
            test: "ETH -> USDT",
            input: {
                token: "ETH",
                amount: ethers.utils.formatUnits(amountIn, 18),
                valueInUSDT: ethers.utils.formatUnits(inputValueInUSDT, 18)
            },
            output: {
                token: "USDT",
                amount: ethers.utils.formatUnits(amountOut, usdtToken.decimals),
                valueInUSDT: ethers.utils.formatUnits(amountOut, usdtToken.decimals)
            },
            ratio: `${ethers.utils.formatUnits(amountOut, usdtToken.decimals)} USDT/5 ETH`,
            valueDifference: ethers.utils.formatUnits(valueDifference, usdtToken.decimals)
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap ETH -> USDT:", error.message);
    }

    // Test 4: Ước lượng swap USDT -> ETH
    console.log("\n🔄 Test 4: Ước lượng swap USDT -> ETH");
    try {
        const ethAddress = tokenInfo["Ethereum"].tokenAddress;
        const usdtToken = tokenInfo["Tether USD"];
        const amountIn = ethers.utils.parseUnits("1000", usdtToken.decimals); // 1000 USDT

        // Ước lượng số lượng ETH sẽ nhận được
        const amountOut = await simpleDEX.getAmountOut(usdtAddress, ethAddress, amountIn);
        
        // Lấy giá ETH so với USDT từ PriceOracle
        const ethPriceInUSDT = await priceOracle.getPrice(ethAddress, usdtAddress);
        
        // Tính giá trị USDT của input và output
        const inputValueInUSDT = amountIn; // USDT có 6 decimals
        const outputValueInUSDT = amountOut.mul(ethPriceInUSDT).div(ethers.utils.parseUnits("1", 18));
        
        console.log(`   Input: ${ethers.utils.formatUnits(amountIn, usdtToken.decimals)} USDT`);
        console.log(`   Input Value: $${ethers.utils.formatUnits(amountIn, usdtToken.decimals)} USDT`);
        console.log(`   Output: ${ethers.utils.formatUnits(amountOut, 18)} ETH`);
        console.log(`   Output Value: $${ethers.utils.formatUnits(outputValueInUSDT, 18)} USDT`);
        console.log(`   Tỷ lệ: 1000 USDT = ${ethers.utils.formatUnits(amountOut, 18)} ETH`);
        const valueDifference = inputValueInUSDT.sub(outputValueInUSDT);
        console.log(`   Giá trị chênh lệch: $${ethers.utils.formatUnits(valueDifference, usdtToken.decimals)} USDT`);
        
        estimationResults.estimations.push({
            test: "USDT -> ETH",
            input: {
                token: "USDT",
                amount: ethers.utils.formatUnits(amountIn, usdtToken.decimals),
                valueInUSDT: ethers.utils.formatUnits(amountIn, usdtToken.decimals)
            },
            output: {
                token: "ETH",
                amount: ethers.utils.formatUnits(amountOut, 18),
                valueInUSDT: ethers.utils.formatUnits(outputValueInUSDT, 18)
            },
            ratio: `${ethers.utils.formatUnits(amountOut, 18)} ETH/1000 USDT`,
            valueDifference: ethers.utils.formatUnits(valueDifference, usdtToken.decimals)
        });
    } catch (error) {
        console.log("   ❌ Không thể ước lượng swap USDT -> ETH:", error.message);
    }

    // Lưu kết quả
    const infoDir = path.resolve(__dirname, "../info");
    if (!fs.existsSync(infoDir)) {
        fs.mkdirSync(infoDir, { recursive: true });
    }

    fs.writeFileSync(
        path.resolve(infoDir, "enhanced-swap-estimation.json"),
        JSON.stringify(estimationResults, null, 2)
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ ENHANCED SWAP ESTIMATION COMPLETED");
    console.log("📊 Kết quả đã lưu vào: info/enhanced-swap-estimation.json");
    console.log("=".repeat(60));
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}); 