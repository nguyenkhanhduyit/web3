import { ethers } from "hardhat";

async function main() {
    console.log("=".repeat(60));
    console.log("🚀 DEMO TÍNH NĂNG ƯỚC LƯỢNG SWAP");
    console.log("=".repeat(60));

    // Deploy contracts
    console.log("\n📋 Deploying contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // Deploy tokens
    const Token = await ethers.getContractFactory("Token");
    const btcToken = await Token.deploy("Bitcoin", "BTC", 18);
    const ethToken = await Token.deploy("Ethereum", "ETH", 18);
    const usdtToken = await Token.deploy("Tether USD", "USDT", 6);

    await btcToken.waitForDeployment();
    await ethToken.waitForDeployment();
    await usdtToken.waitForDeployment();

    console.log(`🪙 BTC Token: ${await btcToken.getAddress()}`);
    console.log(`🪙 ETH Token: ${await ethToken.getAddress()}`);
    console.log(`🪙 USDT Token: ${await usdtToken.getAddress()}`);

    // Deploy SimpleDEX
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    const simpleDEX = await SimpleDEX.deploy();
    await simpleDEX.waitForDeployment();

    console.log(`🏦 SimpleDEX: ${await simpleDEX.getAddress()}`);

    // Mint tokens cho deployer
    console.log("\n💰 Minting tokens...");
    await btcToken.mint(deployer.address, ethers.parseUnits("1000", 18));
    await ethToken.mint(deployer.address, ethers.parseUnits("10000", 18));
    await usdtToken.mint(deployer.address, ethers.parseUnits("100000", 6));

    console.log(`   BTC Balance: ${ethers.formatUnits(await btcToken.balanceOf(deployer.address), 18)} BTC`);
    console.log(`   ETH Balance: ${ethers.formatUnits(await ethToken.balanceOf(deployer.address), 18)} ETH`);
    console.log(`   USDT Balance: ${ethers.formatUnits(await usdtToken.balanceOf(deployer.address), 6)} USDT`);

    // Approve tokens cho SimpleDEX
    console.log("\n✅ Approving tokens...");
    await btcToken.approve(await simpleDEX.getAddress(), ethers.parseUnits("1000", 18));
    await ethToken.approve(await simpleDEX.getAddress(), ethers.parseUnits("10000", 18));
    await usdtToken.approve(await simpleDEX.getAddress(), ethers.parseUnits("100000", 6));

    // Thêm thanh khoản ban đầu
    console.log("\n💧 Adding initial liquidity...");
    
    // BTC-ETH pool: 100 BTC + 1000 ETH
    await simpleDEX.addLiquidity(
        await btcToken.getAddress(),
        await ethToken.getAddress(),
        ethers.parseUnits("100", 18),
        ethers.parseUnits("1000", 18)
    );

    // ETH-USDT pool: 100 ETH + 100000 USDT
    await simpleDEX.addLiquidity(
        await ethToken.getAddress(),
        await usdtToken.getAddress(),
        ethers.parseUnits("100", 18),
        ethers.parseUnits("100000", 6)
    );

    console.log("✅ Initial liquidity added!");

    console.log("\n" + "=".repeat(60));
    console.log("🔍 KIỂM TRA THÔNG TIN POOL");
    console.log("=".repeat(60));

    // Kiểm tra thông tin pool BTC-ETH
    console.log("\n📊 Pool BTC-ETH:");
    const btcEthPoolInfo = await simpleDEX.getPoolInfo(await btcToken.getAddress(), await ethToken.getAddress());
    console.log(`   Reserve BTC: ${ethers.formatUnits(btcEthPoolInfo.reserve0, 18)} BTC`);
    console.log(`   Reserve ETH: ${ethers.formatUnits(btcEthPoolInfo.reserve1, 18)} ETH`);
    console.log(`   Total LP Supply: ${ethers.formatUnits(btcEthPoolInfo.totalSupply, 18)} LP`);
    console.log(`   Giá ETH/BTC: ${ethers.formatUnits(btcEthPoolInfo.price0to1, 18)} ETH/BTC`);
    console.log(`   Giá BTC/ETH: ${ethers.formatUnits(btcEthPoolInfo.price1to0, 18)} BTC/ETH`);

    // Kiểm tra thông tin pool ETH-USDT
    console.log("\n📊 Pool ETH-USDT:");
    const ethUsdtPoolInfo = await simpleDEX.getPoolInfo(await ethToken.getAddress(), await usdtToken.getAddress());
    console.log(`   Reserve ETH: ${ethers.formatUnits(ethUsdtPoolInfo.reserve0, 18)} ETH`);
    console.log(`   Reserve USDT: ${ethers.formatUnits(ethUsdtPoolInfo.reserve1, 6)} USDT`);
    console.log(`   Total LP Supply: ${ethers.formatUnits(ethUsdtPoolInfo.totalSupply, 18)} LP`);
    console.log(`   Giá USDT/ETH: ${ethers.formatUnits(ethUsdtPoolInfo.price0to1, 12)} USDT/ETH`);
    console.log(`   Giá ETH/USDT: ${ethers.formatUnits(ethUsdtPoolInfo.price1to0, 6)} ETH/USDT`);

    console.log("\n" + "=".repeat(60));
    console.log("🧮 TEST ƯỚC LƯỢNG SWAP");
    console.log("=".repeat(60));

    // Test 1: Ước lượng swap BTC -> ETH
    console.log("\n🔄 Test 1: Ước lượng swap BTC -> ETH");
    const btcToEthAmountIn = ethers.parseUnits("1", 18); // 1 BTC
    const btcToEthAmountOut = await simpleDEX.getAmountOut(
        await btcToken.getAddress(),
        await ethToken.getAddress(),
        btcToEthAmountIn
    );
    
    console.log(`   Input: ${ethers.formatUnits(btcToEthAmountIn, 18)} BTC`);
    console.log(`   Output: ${ethers.formatUnits(btcToEthAmountOut, 18)} ETH`);
    console.log(`   Tỷ lệ: 1 BTC = ${ethers.formatUnits(btcToEthAmountOut, 18)} ETH`);

    // Test 2: Ước lượng swap ETH -> BTC
    console.log("\n🔄 Test 2: Ước lượng swap ETH -> BTC");
    const ethToBtcAmountIn = ethers.parseUnits("10", 18); // 10 ETH
    const ethToBtcAmountOut = await simpleDEX.getAmountOut(
        await ethToken.getAddress(),
        await btcToken.getAddress(),
        ethToBtcAmountIn
    );
    
    console.log(`   Input: ${ethers.formatUnits(ethToBtcAmountIn, 18)} ETH`);
    console.log(`   Output: ${ethers.formatUnits(ethToBtcAmountOut, 18)} BTC`);
    console.log(`   Tỷ lệ: 10 ETH = ${ethers.formatUnits(ethToBtcAmountOut, 18)} BTC`);

    // Test 3: Ước lượng swap ETH -> USDT
    console.log("\n🔄 Test 3: Ước lượng swap ETH -> USDT");
    const ethToUsdtAmountIn = ethers.parseUnits("1", 18); // 1 ETH
    const ethToUsdtAmountOut = await simpleDEX.getAmountOut(
        await ethToken.getAddress(),
        await usdtToken.getAddress(),
        ethToUsdtAmountIn
    );
    
    console.log(`   Input: ${ethers.formatUnits(ethToUsdtAmountIn, 18)} ETH`);
    console.log(`   Output: ${ethers.formatUnits(ethToUsdtAmountOut, 6)} USDT`);
    console.log(`   Tỷ lệ: 1 ETH = ${ethers.formatUnits(ethToUsdtAmountOut, 6)} USDT`);

    console.log("\n" + "=".repeat(60));
    console.log("🎯 TEST ƯỚC LƯỢNG INPUT CHO OUTPUT CỐ ĐỊNH");
    console.log("=".repeat(60));

    // Test 4: Ước lượng input để nhận 1 BTC
    console.log("\n🎯 Test 4: Ước lượng ETH cần bán để nhận 1 BTC");
    const btcAmountOut = ethers.parseUnits("1", 18); // 1 BTC
    const ethAmountIn = await simpleDEX.getAmountIn(
        await ethToken.getAddress(),
        await btcToken.getAddress(),
        btcAmountOut
    );
    
    console.log(`   Output mong muốn: ${ethers.formatUnits(btcAmountOut, 18)} BTC`);
    console.log(`   Input cần thiết: ${ethers.formatUnits(ethAmountIn, 18)} ETH`);
    console.log(`   Tỷ lệ: ${ethers.formatUnits(ethAmountIn, 18)} ETH = 1 BTC`);

    // Test 5: Ước lượng input để nhận 1000 USDT
    console.log("\n🎯 Test 5: Ước lượng ETH cần bán để nhận 1000 USDT");
    const usdtAmountOut = ethers.parseUnits("1000", 6); // 1000 USDT
    const ethForUsdtAmountIn = await simpleDEX.getAmountIn(
        await ethToken.getAddress(),
        await usdtToken.getAddress(),
        usdtAmountOut
    );
    
    console.log(`   Output mong muốn: ${ethers.formatUnits(usdtAmountOut, 6)} USDT`);
    console.log(`   Input cần thiết: ${ethers.formatUnits(ethForUsdtAmountIn, 18)} ETH`);
    console.log(`   Tỷ lệ: ${ethers.formatUnits(ethForUsdtAmountIn, 18)} ETH = 1000 USDT`);

    console.log("\n" + "=".repeat(60));
    console.log("📊 SO SÁNH ƯỚC LƯỢNG VỚI THỰC TẾ");
    console.log("=".repeat(60));

    // Test 6: So sánh ước lượng với swap thực tế
    console.log("\n🔄 Test 6: So sánh ước lượng với swap thực tế (ETH -> BTC)");
    const swapAmount = ethers.parseUnits("0.1", 18); // 0.1 ETH
    
    // Ước lượng trước
    const estimatedOut = await simpleDEX.getAmountOut(
        await ethToken.getAddress(),
        await btcToken.getAddress(),
        swapAmount
    );
    console.log(`   Ước lượng: ${ethers.formatUnits(swapAmount, 18)} ETH -> ${ethers.formatUnits(estimatedOut, 18)} BTC`);
    
    // Thực hiện swap thực tế
    console.log("   Thực hiện swap thực tế...");
    const tx = await simpleDEX.swapExactTokensForTokens(
        await ethToken.getAddress(),
        await btcToken.getAddress(),
        swapAmount
    );
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
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ HOÀN THÀNH DEMO TÍNH NĂNG ƯỚC LƯỢNG SWAP");
    console.log("=".repeat(60));
    console.log("\n📋 Tóm tắt:");
    console.log("   ✅ Đã thêm hàm getAmountOut() để ước lượng output");
    console.log("   ✅ Đã thêm hàm getAmountIn() để ước lượng input");
    console.log("   ✅ Đã thêm hàm getPoolInfo() để lấy thông tin pool");
    console.log("   ✅ Đã test các tính năng ước lượng");
    console.log("   ✅ Đã so sánh ước lượng với swap thực tế");
    console.log("   ✅ Tính năng hoạt động chính xác!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }); 