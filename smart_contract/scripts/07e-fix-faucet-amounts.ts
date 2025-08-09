import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Fixing faucet amounts for different token decimals...");
    
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    if (!fs.existsSync(tokenInfoPath)) {
        throw new Error("TokenAddress.json không tồn tại. Hãy chạy 01-deploy-tokens.ts trước!");
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    console.log("Thông tin token đã deploy:", Object.keys(tokenInfo));

    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json");
    if (!fs.existsSync(faucetInfoPath)) {
        throw new Error("FaucetInfo.json không tồn tại. Hãy chạy 07a-deploy-faucet-contract.ts trước!");
    }
    
    const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"));
    console.log("Faucet address:", faucetInfo.faucetAddress);

    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);

    console.log("\n=== Fixing Faucet Amounts ===");
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        const decimals = tokenData.decimals;
        
        // Calculate correct amount: 0.5 * 10^decimals
        const correctAmount = ethers.utils.parseUnits("0.5", decimals);
        
        console.log(`\nFixing ${tokenName}...`);
        console.log(`- Token address: ${tokenAddress}`);
        console.log(`- Symbol: ${tokenData.symbol}`);
        console.log(`- Decimals: ${decimals}`);
        console.log(`- Current amount: ${ethers.utils.formatUnits(correctAmount, decimals)} ${tokenData.symbol}`);
        
        try {
            const updateTx = await faucet.updateFaucetAmount(tokenAddress, correctAmount);
            await updateTx.wait();
            console.log(`✅ ${tokenName} faucet amount updated successfully`);
            
        } catch (error) {
            console.log(`❌ Error updating ${tokenName}:`, error.message);
        }
    }

    console.log("\n=== Faucet Amount Fix Complete ===");
    console.log("All token amounts have been corrected to 0.5 tokens per request");
    console.log("\nNext steps:");
    console.log("1. Run 07d-test-faucet.ts to test the corrected faucet functionality");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    }); 