import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Script master để deploy toàn bộ hệ thống SimpleDEX
 * Bao gồm:
 * 1. Deploy tokens (BTC, ETH, USDT)
 * 2. Deploy SimpleDEX
 * 3. Approve tokens cho SimpleDEX
 * 4. Thêm thanh khoản ban đầu
 * 5. Test các tính năng DEX
 * 6. Deploy advanced features (PriceOracle, LiquidityMining)
 * 7. Deploy Faucet
 * 8. Test swap tokens
 */
async function main() {
    console.log("🚀 Bắt đầu deploy toàn bộ hệ thống SimpleDEX...");
    console.log("=".repeat(60));
    
    const startTime = Date.now();
    const deploymentResults: any = {
        startTime: new Date().toISOString(),
        steps: [],
        totalTime: 0,
        status: "completed"
    };
    
    try {
        // Bước 1: Deploy tokens
        console.log("\n📋 Bước 1: Deploy tokens (BTC, ETH, USDT)...");
        deploymentResults.steps.push({
            step: 1,
            name: "Deploy Tokens",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/01-deploy-tokens.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 1 hoàn thành!");
        
        // Bước 2: Deploy SimpleDEX
        console.log("\n🏦 Bước 2: Deploy SimpleDEX contract...");
        deploymentResults.steps.push({
            step: 2,
            name: "Deploy SimpleDEX",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/02-deploy-simple-dex.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 2 hoàn thành!");
        
        // Bước 3: Approve tokens
        console.log("\n🔐 Bước 3: Approve tokens cho SimpleDEX...");
        deploymentResults.steps.push({
            step: 3,
            name: "Approve Tokens",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/03-approve-tokens.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 3 hoàn thành!");
        
        // Bước 4: Thêm thanh khoản ban đầu
        console.log("\n💧 Bước 4: Thêm thanh khoản ban đầu...");
        deploymentResults.steps.push({
            step: 4,
            name: "Add Initial Liquidity",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/04-add-initial-liquidity.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 4 hoàn thành!");
        
        // Bước 5: Test các tính năng DEX
        console.log("\n🧪 Bước 5: Test các tính năng DEX...");
        deploymentResults.steps.push({
            step: 5,
            name: "Test DEX Features",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/05-test-dex-features.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 5 hoàn thành!");
        
        // Bước 6: Deploy advanced features
        console.log("\n🚀 Bước 6: Deploy advanced features (PriceOracle, LiquidityMining)...");
        deploymentResults.steps.push({
            step: 6,
            name: "Deploy Advanced Features",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/06-deploy-advanced-features.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 6 hoàn thành!");
        
        // Bước 7: Deploy Faucet
        console.log("\n🚰 Bước 7: Deploy Faucet contract...");
        deploymentResults.steps.push({
            step: 7,
            name: "Deploy Faucet",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/07-deploy-faucet.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 7 hoàn thành!");
        
        // Bước 8: Test swap tokens
        console.log("\n🔄 Bước 8: Test swap tokens...");
        deploymentResults.steps.push({
            step: 8,
            name: "Test Swap Tokens",
            startTime: new Date().toISOString()
        });
        
        execSync("npx hardhat run scripts/08-swap-tokens.ts --network sepolia", { 
            stdio: "inherit",
            cwd: process.cwd()
        });
        
        deploymentResults.steps[deploymentResults.steps.length - 1].endTime = new Date().toISOString();
        deploymentResults.steps[deploymentResults.steps.length - 1].status = "success";
        console.log("✅ Bước 8 hoàn thành!");
        
        // Đọc thông tin deployment để tạo báo cáo
        console.log("\n📊 Tạo báo cáo deployment...");
        
        const tokenInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "../info/TokenAddress.json"), "utf8"));
        const dexInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "../info/SimpleDEXAddress.json"), "utf8"));
        
        let faucetInfo = null;
        try {
            faucetInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "../info/FaucetInfo.json"), "utf8"));
        } catch (error) {
            console.log("⚠️  Không tìm thấy thông tin Faucet");
        }
        
        let advancedFeaturesInfo = null;
        try {
            advancedFeaturesInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "../info/AdvancedFeatures.json"), "utf8"));
        } catch (error) {
            console.log("⚠️  Không tìm thấy thông tin Advanced Features");
        }
        
        // Tạo báo cáo tổng hợp
        const finalReport = {
            deploymentSummary: {
                startTime: deploymentResults.startTime,
                endTime: new Date().toISOString(),
                totalTime: Date.now() - startTime,
                status: "completed",
                totalSteps: deploymentResults.steps.length,
                successfulSteps: deploymentResults.steps.filter((s: any) => s.status === "success").length
            },
            deployedContracts: {
                tokens: Object.keys(tokenInfo).map(name => ({
                    name: name,
                    symbol: tokenInfo[name].symbol,
                    address: tokenInfo[name].tokenAddress,
                    decimals: tokenInfo[name].decimals
                })),
                simpleDEX: {
                    address: dexInfo.address,
                    name: "SimpleDEX"
                },
                faucet: faucetInfo ? {
                    address: faucetInfo.faucetAddress,
                    name: "Faucet",
                    supportedTokens: faucetInfo.supportedTokens,
                    cooldownPeriod: faucetInfo.cooldownPeriod
                } : null,
                advancedFeatures: advancedFeaturesInfo ? {
                    priceOracle: advancedFeaturesInfo.priceOracle?.address,
                    liquidityMining: advancedFeaturesInfo.liquidityMining?.address
                } : null
            },
            features: [
                "Token Creation (BTC, ETH, USDT)",
                "SimpleDEX with AMM",
                "Liquidity Management",
                "Token Swapping (Exact Input/Output)",
                "Price Oracle",
                "Liquidity Mining",
                "Faucet System (24h cooldown)",
                "Modular Script Architecture"
            ],
            usage: {
                deployTokens: "npx hardhat run scripts/01-deploy-tokens.ts --network sepolia",
                deployDEX: "npx hardhat run scripts/02-deploy-simple-dex.ts --network sepolia",
                approveTokens: "npx hardhat run scripts/03-approve-tokens.ts --network sepolia",
                addLiquidity: "npx hardhat run scripts/04-add-initial-liquidity.ts --network sepolia",
                testFeatures: "npx hardhat run scripts/05-test-dex-features.ts --network sepolia",
                deployAdvanced: "npx hardhat run scripts/06-deploy-advanced-features.ts --network sepolia",
                deployFaucet: "npx hardhat run scripts/07-deploy-faucet.ts --network sepolia",
                swapTokens: "npx hardhat run scripts/08-swap-tokens.ts --network sepolia",
                deployAll: "npx hardhat run scripts/00-deploy-everything.ts --network sepolia"
            }
        };
        
        // Lưu báo cáo
        const reportPath = path.join(__dirname, "../info/DeploymentReport.json");
        fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
        
        deploymentResults.endTime = new Date().toISOString();
        deploymentResults.totalTime = Date.now() - startTime;
        
        // Lưu kết quả deployment
        const resultsPath = path.join(__dirname, "../info/DeploymentResults.json");
        fs.writeFileSync(resultsPath, JSON.stringify(deploymentResults, null, 2));
        
        console.log("\n" + "=".repeat(60));
        console.log("🎉 DEPLOYMENT HOÀN THÀNH THÀNH CÔNG!");
        console.log("=".repeat(60));
        console.log("📋 Tóm tắt:");
        console.log(`   ⏱️  Tổng thời gian: ${Math.round((Date.now() - startTime) / 1000)} giây`);
        console.log(`   ✅ Số bước hoàn thành: ${deploymentResults.steps.filter((s: any) => s.status === "success").length}/${deploymentResults.steps.length}`);
        console.log(`   🏦 SimpleDEX: ${dexInfo.address}`);
        console.log(`   🚰 Faucet: ${faucetInfo?.faucetAddress || "N/A"}`);
        console.log(`   📊 Báo cáo chi tiết: info/DeploymentReport.json`);
        console.log("\n🚀 Hệ thống SimpleDEX đã sẵn sàng sử dụng!");
        
    } catch (error: any) {
        console.error("❌ Deployment failed:", error);
        deploymentResults.status = "failed";
        deploymentResults.error = error.message;
        deploymentResults.endTime = new Date().toISOString();
        deploymentResults.totalTime = Date.now() - startTime;
        
        const resultsPath = path.join(__dirname, "../info/DeploymentResults.json");
        fs.writeFileSync(resultsPath, JSON.stringify(deploymentResults, null, 2));
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 