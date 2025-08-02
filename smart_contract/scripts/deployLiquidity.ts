const hre = require("hardhat");

async function main() {
  const SimpleLiquidity = await hre.ethers.getContractFactory("SimpleLiquidity");
  const contract = await SimpleLiquidity.deploy();
  await contract.deployed();

  console.log("✅ SimpleLiquidity deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
