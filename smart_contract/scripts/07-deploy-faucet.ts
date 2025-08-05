import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script deploy Faucet contract và thiết lập các token có sẵn
 * Mỗi người dùng có thể nhận token mỗi 24 giờ
 */
async function main() {
    console.log("🚀 Bắt đầu deploy Faucet contract...");
    
    // Lấy deployer account
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer address:", deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(await deployer.provider!.getBalance(deployer.address)), "ETH");
    
    // Đọc thông tin token đã deploy
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    if (!fs.existsSync(tokenInfoPath)) {
        throw new Error("❌ TokenAddress.json không tồn tại. Hãy chạy 01-deploy-tokens.ts trước!");
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    console.log("📋 Thông tin token đã deploy:", Object.keys(tokenInfo));
    
    // Deploy Faucet contract
    console.log("\n🔨 Deploying Faucet contract...");
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy();
    await faucet.waitForDeployment();
    
    const faucetAddress = await faucet.getAddress();
    console.log("✅ Faucet deployed tại:", faucetAddress);
    
    // Thiết lập số lượng faucet cho mỗi token
    console.log("\n💰 Thiết lập số lượng faucet cho các token...");
    
    const faucetAmounts = {
        "Bitcoin": ethers.parseUnits("10", 8),    // 10 BTC
        "Ethereum": ethers.parseUnits("100", 18), // 100 ETH
        "Tether": ethers.parseUnits("1000", 6)    // 1000 USDT
    };
    
    // Thêm các token vào faucet
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        const faucetAmount = faucetAmounts[tokenName as keyof typeof faucetAmounts];
        
        console.log(`🔧 Thêm ${tokenName} vào faucet...`);
        console.log(`   - Token address: ${tokenAddress}`);
        console.log(`   - Faucet amount: ${ethers.formatUnits(faucetAmount, tokenData.decimals)} ${tokenData.symbol}`);
        
        // Thêm token vào faucet
        const addTokenTx = await faucet.addToken(tokenAddress, faucetAmount);
        await addTokenTx.wait();
        console.log(`   ✅ ${tokenName} đã được thêm vào faucet`);
    }
    
    // Chuyển token vào faucet để người dùng có thể nhận
    console.log("\n💸 Chuyển token vào faucet contract...");
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        const faucetAmount = faucetAmounts[tokenName as keyof typeof faucetAmounts];
        
        // Tạo contract instance cho token
        const tokenContract = new ethers.Contract(tokenAddress, [
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        
        // Kiểm tra balance của deployer
        const deployerBalance = await tokenContract.balanceOf(deployer.address);
        console.log(`   📊 Deployer ${tokenName} balance: ${ethers.formatUnits(deployerBalance, tokenData.decimals)} ${tokenData.symbol}`);
        
        if (deployerBalance >= faucetAmount) {
            // Chuyển token vào faucet
            const transferTx = await tokenContract.transfer(faucetAddress, faucetAmount);
            await transferTx.wait();
            console.log(`   ✅ Đã chuyển ${ethers.formatUnits(faucetAmount, tokenData.decimals)} ${tokenData.symbol} vào faucet`);
        } else {
            console.log(`   ⚠️  Không đủ ${tokenName} để chuyển vào faucet`);
        }
    }
    
    // Lưu thông tin faucet
    const faucetInfo = {
        faucetAddress: faucetAddress,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider!.getBlockNumber(),
        deployer: deployer.address,
        supportedTokens: Object.keys(tokenInfo),
        faucetAmounts: faucetAmounts,
        cooldownPeriod: "24 hours"
    };
    
    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json");
    fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2));
    console.log("\n💾 Thông tin faucet đã được lưu vào:", faucetInfoPath);
    
    // Test faucet functionality
    console.log("\n🧪 Testing faucet functionality...");
    
    // Tạo một test account khác
    const testAccounts = await ethers.getSigners();
    const testUser = testAccounts[1]; // Sử dụng account thứ 2 để test
    
    console.log(`👤 Test user address: ${testUser.address}`);
    
    // Test nhận tất cả token từ faucet
    try {
        console.log("🔄 Test user đang nhận tất cả token từ faucet...");
        const requestAllTx = await faucet.connect(testUser).requestAllFaucets();
        await requestAllTx.wait();
        console.log("✅ Test user đã nhận thành công tất cả token từ faucet");
        
        // Kiểm tra balance của test user
        for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
            const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
                "function balanceOf(address account) external view returns (uint256)"
            ], testUser);
            
            const userBalance = await tokenContract.balanceOf(testUser.address);
            console.log(`   📊 Test user ${tokenName} balance: ${ethers.formatUnits(userBalance, tokenData.decimals)} ${tokenData.symbol}`);
        }
        
    } catch (error) {
        console.log("❌ Test faucet failed:", error);
    }
    
    // Test thời gian chờ
    console.log("\n⏰ Testing cooldown period...");
    try {
        const timeUntilNext = await faucet.getTimeUntilNextFaucet(testUser.address);
        console.log(`   ⏱️  Thời gian chờ còn lại: ${timeUntilNext} giây`);
        
        if (timeUntilNext > 0) {
            const hours = Math.floor(timeUntilNext / 3600);
            const minutes = Math.floor((timeUntilNext % 3600) / 60);
            console.log(`   📅 Có thể faucet lại sau: ${hours} giờ ${minutes} phút`);
        }
    } catch (error) {
        console.log("❌ Test cooldown failed:", error);
    }
    
    console.log("\n🎉 Faucet deployment hoàn thành!");
    console.log("📋 Tóm tắt:");
    console.log(`   - Faucet address: ${faucetAddress}`);
    console.log(`   - Supported tokens: ${Object.keys(tokenInfo).join(", ")}`);
    console.log(`   - Cooldown period: 24 hours`);
    console.log(`   - Deployer: ${deployer.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 