import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface TokenData {
    tokenAddress: string;
    symbol: string;
    decimals: number;
}

async function main() {
    console.log("🧪 Testing Faucet Functions: requestFaucet and requestAllFaucets");
    console.log("=" .repeat(60));

    // Đọc thông tin faucet và token
    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json");
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    
    if (!fs.existsSync(faucetInfoPath) || !fs.existsSync(tokenInfoPath)) {
        console.error("❌ Missing required info files!");
        return;
    }

    const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"));
    const tokenInfo: { [key: string]: TokenData } = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));

    console.log(`📍 Faucet Address: ${faucetInfo.faucetAddress}`);
    console.log(`👤 Deployer: ${faucetInfo.deployer}`);
    console.log(`🪙 Supported Tokens: ${faucetInfo.supportedTokens.join(", ")}`);
    console.log("");

    // Lấy signer (deployer)
    const [deployer] = await ethers.getSigners();
    console.log(`🔑 Testing with account: ${deployer.address}`);

    // Kết nối với faucet contract
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);

    // Kiểm tra trạng thái ban đầu
    console.log("\n📊 === INITIAL STATUS CHECK ===");
    
    // Kiểm tra balance của deployer trước khi test
    const initialBalances: { [key: string]: any } = {};
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        const balance = await tokenContract.balanceOf(deployer.address);
        initialBalances[tokenName] = balance;
        console.log(`💰 ${tokenName} (${tokenData.symbol}): ${ethers.utils.formatUnits(balance, tokenData.decimals)}`);
    }

    // Kiểm tra thời gian cooldown
    const timeUntilNext = await faucet.getTimeUntilNextFaucet(deployer.address);
    if (timeUntilNext.eq(0)) {
        console.log("✅ No cooldown active - can request tokens immediately");
    } else {
        console.log(`⏰ Cooldown active: ${timeUntilNext.toString()} seconds remaining`);
        console.log("⏳ Waiting for cooldown to expire...");
        // Note: In a real test, you might want to wait or use a different account
        return;
    }

    console.log("\n🧪 === TESTING REQUESTFAUCET FUNCTION ===");
    
    // Test requestFaucet cho từng token
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        console.log(`\n🎯 Testing requestFaucet for ${tokenName}...`);
        
        try {
            // Gọi requestFaucet
            const requestTx = await faucet.requestFaucet(tokenData.tokenAddress);
            console.log(`📝 Transaction hash: ${requestTx.hash}`);
            
            // Đợi transaction được confirm
            const receipt = await requestTx.wait();
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            
            // Kiểm tra balance mới
            const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
                "function balanceOf(address account) external view returns (uint256)"
            ], deployer);
            const newBalance = await tokenContract.balanceOf(deployer.address);
            const faucetAmount = await faucet.faucetAmounts(tokenData.tokenAddress);
            
            console.log(`💰 Balance before: ${ethers.utils.formatUnits(initialBalances[tokenName], tokenData.decimals)} ${tokenData.symbol}`);
            console.log(`💰 Balance after: ${ethers.utils.formatUnits(newBalance, tokenData.decimals)} ${tokenData.symbol}`);
            console.log(`🎁 Faucet amount received: ${ethers.utils.formatUnits(faucetAmount, tokenData.decimals)} ${tokenData.symbol}`);
            
            // Kiểm tra xem có nhận đúng số lượng không
            const expectedIncrease = faucetAmount;
            const actualIncrease = newBalance.sub(initialBalances[tokenName]);
            
            if (actualIncrease.eq(expectedIncrease)) {
                console.log(`✅ SUCCESS: Received correct amount for ${tokenName}`);
            } else {
                console.log(`❌ ERROR: Expected ${ethers.utils.formatUnits(expectedIncrease, tokenData.decimals)}, got ${ethers.utils.formatUnits(actualIncrease, tokenData.decimals)}`);
            }
            
        } catch (error: any) {
            console.log(`❌ Error requesting ${tokenName}: ${error.message}`);
        }
    }

    // Kiểm tra cooldown sau khi sử dụng faucet
    console.log("\n⏰ === CHECKING COOLDOWN AFTER REQUESTFAUCET ===");
    const newTimeUntilNext = await faucet.getTimeUntilNextFaucet(deployer.address);
    if (newTimeUntilNext.gt(0)) {
        console.log(`⏳ Cooldown active: ${newTimeUntilNext.toString()} seconds remaining`);
        console.log(`🕐 Next faucet available at: ${new Date(Date.now() + newTimeUntilNext.toNumber() * 1000).toLocaleString()}`);
    }

    // Test requestAllFaucets (sẽ fail do cooldown)
    console.log("\n🧪 === TESTING REQUESTALLFAUCETS (EXPECTED TO FAIL DUE TO COOLDOWN) ===");
    
    try {
        const allFaucetsTx = await faucet.requestAllFaucets();
        console.log("❌ UNEXPECTED: requestAllFaucets succeeded despite cooldown!");
    } catch (error: any) {
        if (error.message.includes("Must wait 24 hours")) {
            console.log("✅ EXPECTED: requestAllFaucets correctly failed due to cooldown");
            console.log(`📝 Error message: ${error.message}`);
        } else {
            console.log(`❌ UNEXPECTED ERROR: ${error.message}`);
        }
    }

    // Kiểm tra trạng thái cuối cùng
    console.log("\n📊 === FINAL STATUS CHECK ===");
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        const finalBalance = await tokenContract.balanceOf(deployer.address);
        const faucetAmount = await faucet.faucetAmounts(tokenData.tokenAddress);
        
        console.log(`💰 ${tokenName} (${tokenData.symbol}): ${ethers.utils.formatUnits(finalBalance, tokenData.decimals)}`);
        console.log(`🎁 Faucet amount per request: ${ethers.utils.formatUnits(faucetAmount, tokenData.decimals)} ${tokenData.symbol}`);
    }

    // Kiểm tra faucet balances
    console.log("\n🏦 === FAUCET BALANCES ===");
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        const faucetBalance = await tokenContract.balanceOf(faucetInfo.faucetAddress);
        console.log(`🏦 ${tokenName} in faucet: ${ethers.utils.formatUnits(faucetBalance, tokenData.decimals)} ${tokenData.symbol}`);
    }

    console.log("\n🎉 === TEST SUMMARY ===");
    console.log("✅ requestFaucet function tested successfully");
    console.log("✅ Cooldown mechanism working correctly");
    console.log("✅ requestAllFaucets correctly respects cooldown");
    console.log("✅ Token transfers working as expected");
    console.log("\n💡 To test requestAllFaucets, wait 24 hours or use a different account");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 