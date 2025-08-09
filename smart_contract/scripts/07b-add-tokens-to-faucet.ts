import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Adding tokens to faucet...");
    
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
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);
    
    console.log("\nThêm các token vào faucet...");
    const addedTokens = [];
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        
        console.log(`\nThêm ${tokenName} vào faucet...`);
        console.log(`- Token address: ${tokenAddress}`);
        console.log(`- Symbol: ${tokenData.symbol}`);
        console.log(`- Decimals: ${tokenData.decimals}`);
        console.log(`- User sẽ nhận : 0.5 ${tokenData.symbol} / request`);
        
        try {
            const addTokenTx = await faucet.addToken(tokenAddress);
            await addTokenTx.wait();
            console.log(`${tokenName} đã được thêm vào faucet`);
            
            addedTokens.push({
                name: tokenName,
                address: tokenAddress,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals
            });
            
        } catch (error) {
            console.log(`Error adding ${tokenName}:`, error.message);
        }
    }
    
    // Cập nhật thông tin faucet với danh sách token đã thêm
    faucetInfo.supportedTokens = addedTokens.map(token => token.name);
    faucetInfo.addedTokens = addedTokens;
    faucetInfo.tokensAddedAt = new Date().toISOString();
    
    fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2));
    console.log("\nFaucet info updated with added tokens");
    
    console.log("\n=== Token Addition Complete ===");
    console.log("Summary:");
    console.log(`- Total tokens added: ${addedTokens.length}`);
    console.log(`- Supported tokens: ${addedTokens.map(t => t.name).join(", ")}`);
    console.log(`- User faucet amount: 0.5 tokens per request`);
    console.log(`- Cooldown period: 24 hours`);
    
    console.log("\nNext steps:");
    console.log("1. Run 07c-fund-faucet.ts to fund the faucet with tokens");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    }); 