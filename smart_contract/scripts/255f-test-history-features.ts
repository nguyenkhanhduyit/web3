import { ethers } from "hardhat";
import { expect } from "chai";

describe("History Tracking Features", function () {
  let simpleDEX: any;
  let faucet: any;
  let token1: any;
  let token2: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy tokens
    const Token = await ethers.getContractFactory("Token");
    token1 = await Token.deploy("Test Token 1", "TT1", 18);
    token2 = await Token.deploy("Test Token 2", "TT2", 18);

    // Deploy SimpleDEX
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    simpleDEX = await SimpleDEX.deploy();

    // Deploy Faucet
    const Faucet = await ethers.getContractFactory("Faucet");
    faucet = await Faucet.deploy();

    // Add tokens to faucet
    await faucet.addToken(token1.address);
    await faucet.addToken(token2.address);

    // Mint tokens to users for testing
    await token1.mint(user1.address, ethers.utils.parseEther("1000"));
    await token2.mint(user1.address, ethers.utils.parseEther("1000"));
    await token1.mint(user2.address, ethers.utils.parseEther("1000"));
    await token2.mint(user2.address, ethers.utils.parseEther("1000"));

    // Add initial liquidity to DEX
    await token1.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("100"));
    await token2.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("100"));
    await simpleDEX.connect(user1).addLiquidity(
      token1.address,
      token2.address,
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("100")
    );
  });

  describe("SimpleDEX History Tracking", function () {
    it("Should track swap history correctly", async function () {
      // Approve tokens for swap
      await token1.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("10"));
      await token2.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("10"));

      // Perform swap
      await simpleDEX.connect(user1).swapExactTokensForTokens(
        token1.address,
        token2.address,
        ethers.utils.parseEther("10")
      );

      // Check total swap count
      const totalSwaps = await simpleDEX.getTotalSwapCount();
      expect(totalSwaps).to.equal(1);

      // Check user swap count
      const userSwapCount = await simpleDEX.getUserSwapCount(user1.address);
      expect(userSwapCount).to.equal(1);

      // Get user swap history
      const swapHistory = await simpleDEX.getUserSwapHistory(user1.address, 0, 10);
      expect(swapHistory.length).to.equal(1);
      expect(swapHistory[0].tokenIn).to.equal(token1.address);
      expect(swapHistory[0].tokenOut).to.equal(token2.address);
      expect(swapHistory[0].trader).to.equal(user1.address);
      expect(swapHistory[0].amountIn).to.equal(ethers.utils.parseEther("10"));
      expect(swapHistory[0].amountOut).to.be.gt(0);
      expect(swapHistory[0].timestamp).to.be.gt(0);
      expect(swapHistory[0].blockNumber).to.be.gt(0);
    });

    it("Should track multiple swaps for same user", async function () {
      // Approve tokens
      await token1.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("20"));
      await token2.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("20"));

      // Perform multiple swaps
      await simpleDEX.connect(user1).swapExactTokensForTokens(
        token1.address,
        token2.address,
        ethers.utils.parseEther("5")
      );

      await simpleDEX.connect(user1).swapExactTokensForTokens(
        token2.address,
        token1.address,
        ethers.utils.parseEther("5")
      );

      // Check counts
      const totalSwaps = await simpleDEX.getTotalSwapCount();
      expect(totalSwaps).to.equal(2);

      const userSwapCount = await simpleDEX.getUserSwapCount(user1.address);
      expect(userSwapCount).to.equal(2);

      // Get all user history
      const allHistory = await simpleDEX.getAllUserSwapHistory(user1.address);
      expect(allHistory.length).to.equal(2);
    });

    it("Should track swaps for different users", async function () {
      // User 1 swap
      await token1.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("10"));
      await simpleDEX.connect(user1).swapExactTokensForTokens(
        token1.address,
        token2.address,
        ethers.utils.parseEther("5")
      );

      // User 2 swap
      await token1.connect(user2).approve(simpleDEX.address, ethers.utils.parseEther("10"));
      await simpleDEX.connect(user2).swapExactTokensForTokens(
        token1.address,
        token2.address,
        ethers.utils.parseEther("5")
      );

      // Check individual counts
      const user1Count = await simpleDEX.getUserSwapCount(user1.address);
      const user2Count = await simpleDEX.getUserSwapCount(user2.address);
      expect(user1Count).to.equal(1);
      expect(user2Count).to.equal(1);

      // Check total count
      const totalCount = await simpleDEX.getTotalSwapCount();
      expect(totalCount).to.equal(2);
    });
  });

  describe("Faucet History Tracking", function () {
    it("Should track single token faucet history", async function () {
      // Request single token
      await faucet.connect(user1).requestFaucet(token1.address);

      // Check counts
      const totalFaucets = await faucet.getTotalFaucetCount();
      expect(totalFaucets).to.equal(1);

      const userFaucetCount = await faucet.getUserFaucetCount(user1.address);
      expect(userFaucetCount).to.equal(1);

      // Get user faucet history
      const faucetHistory = await faucet.getUserFaucetHistory(user1.address, 0, 10);
      expect(faucetHistory.length).to.equal(1);
      expect(faucetHistory[0].user).to.equal(user1.address);
      expect(faucetHistory[0].token).to.equal(token1.address);
      expect(faucetHistory[0].amount).to.be.gt(0);
      expect(faucetHistory[0].timestamp).to.be.gt(0);
      expect(faucetHistory[0].blockNumber).to.be.gt(0);
    });

    it("Should track all tokens faucet history", async function () {
      // Request all tokens
      await faucet.connect(user1).requestAllFaucets();

      // Check counts (should be 2 because we added 2 tokens)
      const totalFaucets = await faucet.getTotalFaucetCount();
      expect(totalFaucets).to.equal(2);

      const userFaucetCount = await faucet.getUserFaucetCount(user1.address);
      expect(userFaucetCount).to.equal(2);

      // Get all user history
      const allHistory = await faucet.getAllUserFaucetHistory(user1.address);
      expect(allHistory.length).to.equal(2);

      // Check that both tokens are in history
      const token1InHistory = allHistory.some(h => h.token === token1.address);
      const token2InHistory = allHistory.some(h => h.token === token2.address);
      expect(token1InHistory).to.be.true;
      expect(token2InHistory).to.be.true;
    });

    it("Should track faucets for different users", async function () {
      // User 1 faucet
      await faucet.connect(user1).requestFaucet(token1.address);

      // User 2 faucet
      await faucet.connect(user2).requestFaucet(token1.address);

      // Check individual counts
      const user1Count = await faucet.getUserFaucetCount(user1.address);
      const user2Count = await faucet.getUserFaucetCount(user2.address);
      expect(user1Count).to.equal(1);
      expect(user2Count).to.equal(1);

      // Check total count
      const totalCount = await faucet.getTotalFaucetCount();
      expect(totalCount).to.equal(2);
    });

    it("Should get faucet details by index", async function () {
      await faucet.connect(user1).requestFaucet(token1.address);

      const faucetDetails = await faucet.getFaucetDetails(0);
      expect(faucetDetails.user).to.equal(user1.address);
      expect(faucetDetails.token).to.equal(token1.address);
      expect(faucetDetails.amount).to.be.gt(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty history gracefully", async function () {
      const userSwapCount = await simpleDEX.getUserSwapCount(user1.address);
      expect(userSwapCount).to.equal(0);

      const userFaucetCount = await faucet.getUserFaucetCount(user1.address);
      expect(userFaucetCount).to.equal(0);

      const allSwapHistory = await simpleDEX.getAllUserSwapHistory(user1.address);
      expect(allSwapHistory.length).to.equal(0);

      const allFaucetHistory = await faucet.getAllUserFaucetHistory(user1.address);
      expect(allFaucetHistory.length).to.equal(0);
    });

    it("Should handle pagination correctly", async function () {
      // Add multiple swaps
      await token1.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("30"));
      await token2.connect(user1).approve(simpleDEX.address, ethers.utils.parseEther("30"));

      for (let i = 0; i < 3; i++) {
        await simpleDEX.connect(user1).swapExactTokensForTokens(
          token1.address,
          token2.address,
          ethers.utils.parseEther("5")
        );
      }

      // Test pagination
      const page1 = await simpleDEX.getUserSwapHistory(user1.address, 0, 2);
      const page2 = await simpleDEX.getUserSwapHistory(user1.address, 2, 2);
      
      expect(page1.length).to.equal(2);
      expect(page2.length).to.equal(1);
    });
  });
}); 