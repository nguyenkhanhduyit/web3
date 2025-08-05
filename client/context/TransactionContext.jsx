import React, { useEffect, useState } from "react"
import { ethers } from 'ethers'
import { contractABI, contractAddress } from '../utils/Constants'
import axios from 'axios'
import { keccak256, defaultAbiCoder, getAddress, formatUnits } from "ethers/lib/utils";
import PoolAddress from '../../client/utils/swap/info/PoolAddress.json'
import TokenAddress from '../../client/utils/swap/info/TokenAddress.json'
import { UNISWAP_V4_ADDRESSES } from "../../client/utils/swap/info/UniswapV4Constants"
import  QUOTER_ABI  from "../../client/utils/swap/info/QuoterABI.json"

export const TransactionContext = React.createContext()

export const TransactionsProvider = ({ children }) => {
  
  const [currentAccount, setCurrentAccount] = useState('')
  const [formData, setFormData] = useState({ addressTo: '', value: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState([])

  // const [tokenAddress,setTokenAddress] = useState('')
  const [tokenBalance, setTokenBalance] = useState("0")

  const [tokenInAddress, setTokenInAddress] = useState('')
  const [tokenOutAddress, setTokenOutAddress] = useState('')

  // ---------------- Utils ----------------
  const getEthereumProvider = () => {
    const { ethereum } = window
    if (!ethereum)
      throw new Error('MetaMask chưa được cài đặt.')
   return new ethers.providers.Web3Provider(ethereum)
  }

  const getSigner = async () => {
    const provider = getEthereumProvider()
    await provider.send("eth_requestAccounts", [])
    return provider.getSigner()
  }

  const createEthereumContract = async () => {
    const signer = await getSigner()
    return new ethers.Contract(contractAddress, contractABI, signer)
  }

  // ---------------- Lịch sử giao dịch ----------------
  const getMyTransactions = async (start = 0) => {
    const states = ["Pending", "Success", "Failed"]
    try {
      const contract = await createEthereumContract()
      const count = await contract.getMyTransactionCount()

      if (count.eq(0)) return

      const total = count.toNumber()
      if (start >= total) return

      const txs = await contract.getMyTransactions(start, total)
      const structured = txs.map((tx) => ({
        addressTo: tx.receiver,
        addressFrom: tx.sender,
        value: ethers.utils.formatEther(tx.value),
        timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
        state: states[tx.state.toNumber()],
      }))
      setTransactions(structured)
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử giao dịch:", error)
    }
  }

  // ---------------- Đăng nhập ----------------
  const handleLogin = async () => {
    try {
      const signer = await getSigner()
      const address = await signer.getAddress()

      const { data } = await axios.post('http://localhost:3001/auth/message', {
        accountAddress: address,
      })

      const signature = await signer.signMessage(data.message)

      await axios.post('http://localhost:3001/auth/verify', {
        address,
        message: data.message,
        signature,
      }, { withCredentials: true })

      setCurrentAccount(address)
    } catch (err) {
      console.error("Đăng nhập lỗi:", err)
      alert(err.message || "Lỗi đăng nhập")
    }
  }

  // ---------------- Đăng xuất ----------------
  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/auth/logout', {}, {
        withCredentials: true,
      })
      setCurrentAccount('')
      setTransactions([])
      window.location.reload()
    } catch (err) {
      console.error('Lỗi đăng xuất:', err)
    }
  }

  // ---------------- Giao dịch ----------------
  const makeTransaction = async () => {
    try {
      const { addressTo, value } = formData
      const parsedValue = ethers.utils.parseEther(value)

      if (!ethers.utils.isAddress(addressTo)) {
        alert('Địa chỉ người nhận không hợp lệ')
        return
      }

      if (!value || isNaN(value) || Number(value) < 0.005 || Number(value) > 0.01) {
        alert('Giá trị phải trong khoảng 0.005 - 0.01 ETH')
        return
      }

      const contract = await createEthereumContract()

      let gasLimit
      try {
        const estimated = await contract.estimateGas.makeTransaction(addressTo, parsedValue, {
          value: parsedValue,
        })
        gasLimit = estimated.mul(12).div(10) // +20%
      } catch (err) {
        gasLimit = ethers.BigNumber.from("21000")
      }

      const tx = await contract.makeTransaction(addressTo, parsedValue, {
        value: parsedValue,
        gasLimit,
      })

      setIsLoading(true)
      await tx.wait()
      setIsLoading(false)

      console.log("Giao dịch thành công:", tx.hash)
    } catch (error) {
      console.error("Lỗi giao dịch:", error)
      alert(`Giao dịch thất bại: ${error.reason || error.message}`)
    }
  }

  // ---------------- Rút tiền khi thất bại ----------------
  const handleWithdrawFailed = async () => {
    try {
      const contract = await createEthereumContract()
      const tx = await contract.withdrawFailed()
      setIsLoading(true)
      await tx.wait()
      setIsLoading(false)
      alert("Rút tiền thành công!")
    } catch (err) {
      console.error(err)
      alert("Không thể rút tiền: " + err.message)
    }
  }

  // ---------------- Đếm số giao dịch ----------------
  const getMyTransactionCount = async () => {
    const contract = await createEthereumContract()
    const count = await contract.getMyTransactionCount()
    console.log('Số giao dịch:', count.toNumber())
  }

  // ---------------- Xử lý form ----------------
  const handleFormDataChange = (e, name) => {
    setFormData((prev) => ({ ...prev, [name]: e.target.value }))
  }

  // ---------------- Check login từ cookie ----------------
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get('http://localhost:3001/auth/me', {
          withCredentials: true,
        })
        setCurrentAccount(res.data.address)
      } catch (err) {
        console.log(err.response?.data?.error || err.message)
      }
    }
    checkLogin()
  }, [])


  
// ERC20 ABI tối giản
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

/**
 * Lấy số dư của token ERC20 cho một địa chỉ cụ thể
 * @param {string} rpcUrl - Sepolia RPC URL (VD: từ Alchemy hoặc Infura)
 * @param {string} tokenInAddress - Địa chỉ contract của token
 * @param {string} userAddress - Địa chỉ ví người dùng
 * @returns {Promise<string>} - Số lượng token (đã format)
 */
const getTokenBalance = async () => {
    try {
      const provider = getEthereumProvider()
      const signer = provider.getSigner()
      const userAddress = await signer.getAddress()
      if (!tokenInAddress || !ethers.utils.isAddress(tokenInAddress)) {
          console.warn("Token address không hợp lệ:", tokenInAddress)
          setTokenBalance("0")
          return
       }
      const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, signer)
      const [rawBalance, decimals] = await Promise.all([
            tokenContract.balanceOf(userAddress),
            tokenContract.decimals()])
      const formatted = ethers.utils.formatUnits(rawBalance, decimals)
      const AfterFormatted = Number.parseFloat(formatted).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        });
      setTokenBalance(AfterFormatted)
    }catch(err){
      console.error("Lỗi khi lấy balance:", err)
      setTokenBalance("0")
    }
}


//ước lượng token out
// Address zero cho hooks (nếu không sử dụng hooks custom)
const HOOKS_ADDRESS = "0x0000000000000000000000000000000000000000";

// Hàm tính poolId từ PoolKey
function computePoolId(token0, token1, fee, tickSpacing, hooks) {
  //return về pool id
  return keccak256(
    defaultAbiCoder.encode(
      ["address", "address", "uint24", "int24", "address"],
      [
        getAddress(token0),
        getAddress(token1),
        fee,
        tickSpacing,
        getAddress(hooks),
      ]
    )
  );
}

function findPoolIdFromTokens() {
  console.log("Finding pool for tokens:", {
    tokenInAddress,
    tokenOutAddress
  });
  
  for (const [name, pool] of Object.entries(PoolAddress)) {
    const tokenA = getAddress(tokenInAddress);
    const tokenB = getAddress(tokenOutAddress);
    const token0 = getAddress(pool.token0);
    const token1 = getAddress(pool.token1);
    
    console.log(`Checking pool ${name}:`, {
      tokenA,
      tokenB,
      token0,
      token1,
      isMatch: (tokenA === token0 && tokenB === token1) || (tokenA === token1 && tokenB === token0)
    });
    
    if (
       (tokenA === token0 && tokenB === token1) ||
      (tokenA === token1 && tokenB === token0)
    ) {

      const [finalToken0, finalToken1] =
        tokenA.toLowerCase() < tokenB.toLowerCase()
          ? [tokenA, tokenB]
          : [tokenB, tokenA];
      const fee = pool.fee;
      const tickSpacing = pool.tickSpacing;
      const poolId = computePoolId(finalToken0, finalToken1, fee, tickSpacing, HOOKS_ADDRESS);

      console.log("Found matching pool:", {
        name,
        poolId,
        finalToken0,
        finalToken1,
        fee,
        tickSpacing
      });

      return {
        name,
        poolId,
        info: pool,
      };
    }
  }

  console.log("No matching pool found");
  return null;
}


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";


// Helper function to check if pool has liquidity
const checkPoolLiquidity = async (poolManager, poolId) => {
  try {
    console.log("Checking liquidity for pool:", poolId);
    
    // Check pool state slot
    const poolStateSlot = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "uint256"],
        [poolId, 0] // slot 0 for pool state
      )
    );
    
    const poolState = await poolManager.extsload(poolStateSlot);
    console.log("Pool state:", poolState);
    
    // If pool state is all zeros, the pool is not initialized
    if (poolState === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("Pool is not initialized (pool state is zero)");
      return false;
    }
    
    // Check liquidity slot
    const liquiditySlot = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "uint256"],
        [poolId, 1] // slot 1 for liquidity
      )
    );
    
    const liquidity = await poolManager.extsload(liquiditySlot);
    console.log("Pool liquidity:", liquidity);
    
    // If liquidity is zero, the pool has no liquidity
    if (liquidity === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("Pool has no liquidity (liquidity is zero)");
      return false;
    }
    
    // Parse liquidity value (it's stored as a uint128)
    const liquidityValue = ethers.BigNumber.from(liquidity);
    console.log("Parsed liquidity value:", liquidityValue.toString());
    
    if (liquidityValue.isZero()) {
      console.log("Pool has zero liquidity");
      return false;
    }
    
    console.log("Pool has liquidity:", liquidityValue.toString());
    return true;
  } catch (error) {
    console.log("Error checking pool liquidity:", error.message);
    return false;
  }
};

// Helper function to decode Uniswap V4 error messages
const decodeUniswapV4Error = (errorData) => {
  if (!errorData) return "Unknown error";
  
  // Common Uniswap V4 error signatures
  const errorSignatures = {
    "0x6190b2b0": "NotEnoughLiquidity",
    "0x486aa307": "CustomUniswapV4Error", // This is the one we're seeing
    "0x4e487b71": "ArithmeticError",
    "0x4d2301cc": "PoolNotInitialized"
  };
  
  for (const [signature, errorName] of Object.entries(errorSignatures)) {
    if (errorData.includes(signature)) {
      return errorName;
    }
  }
  
  return "Unknown error";
};



const estimateAmountOutViaQuoter = async (amountInBigNumber) => {
  try {
    if (
      !tokenInAddress ||
      !tokenOutAddress ||
      tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()
    ) {
      return "0";
    }

     if (!amountInBigNumber || amountInBigNumber.isZero()) {
      console.log("Amount is zero or invalid");
      return "0";
    }

     // Check if amount is reasonable (less than 1000 ETH)
    const maxAmount = ethers.utils.parseEther("1000");
    if (amountInBigNumber.gt(maxAmount)) {
      console.log("Amount is too large for quote");
      return "0";
    }

    // Try different amounts if the initial amount fails
    const amountsToTry = [
      amountInBigNumber,
      amountInBigNumber.div(10),
      amountInBigNumber.div(100),
      amountInBigNumber.div(1000)
    ].filter(amount => amount.gt(0));

    console.log("Estimating amount out for:", {
      tokenInAddress,
      tokenOutAddress,
      amountIn: amountInBigNumber.toString(),
      amountsToTry: amountsToTry.map(a => a.toString())
    });

    const signer = await getSigner();
    const tokenIn = getAddress(tokenInAddress);
    const tokenOut = getAddress(tokenOutAddress);

    // Log token information for debugging
    console.log("Token information:");
    for (const [tokenName, tokenInfo] of Object.entries(TokenAddress)) {
      if (getAddress(tokenInfo.tokenAddress) === tokenIn) {
        console.log(`Token In: ${tokenName} (${tokenIn})`);
      }
      if (getAddress(tokenInfo.tokenAddress) === tokenOut) {
        console.log(`Token Out: ${tokenName} (${tokenOut})`);
      }
    }

    // Check if pool exists and has liquidity
    const poolManager = new ethers.Contract(
      UNISWAP_V4_ADDRESSES.PoolManager,
      ["function extsload(bytes32 slot) view returns (bytes32)"],
      signer
    );

  for (const [, pool] of Object.entries(PoolAddress)) {
      const token0 = getAddress(pool.token0);
      const token1 = getAddress(pool.token1);
      const isMatch =
        (tokenIn === token0 && tokenOut === token1) ||
        (tokenIn === token1 && tokenOut === token0);

      if (!isMatch) continue;

      console.log("Found matching pool:", pool.name || "Unknown", "with poolId:", pool.poolId);

      // Check if pool has liquidity before attempting to quote
      const hasLiquidity = await checkPoolLiquidity(poolManager, pool.poolId);
      if (!hasLiquidity) {
        console.log("Pool has no liquidity, skipping quote for pool:", pool.poolId);
        console.log("This pool needs to be initialized with liquidity before swaps can be performed");
        continue;
      }

      console.log("Pool has liquidity, proceeding with quote");

      const quoter = new ethers.Contract(
        UNISWAP_V4_ADDRESSES.Quoter,
        QUOTER_ABI.abi,
        signer
      );

      // Calculate zeroForOne based on the pool's token order
      // If tokenIn is token0, then zeroForOne is true (token0 -> token1)
      // If tokenIn is token1, then zeroForOne is false (token1 -> token0)
      const zeroForOne = tokenIn === token0;
      const fee = pool.fee;
      const tickSpacing = pool.tickSpacing;

      console.log("Pool found:", pool);
      console.log("TokenIn:", tokenIn, "TokenOut:", tokenOut);
      console.log("Token0:", token0, "Token1:", token1);
      console.log("ZeroForOne:", zeroForOne);

      // Try different amounts for this pool
      for (const tryAmount of amountsToTry) {
        try {
          const params = {
            poolKey: {
              currency0: token0,
              currency1: token1,
              fee: fee,
              tickSpacing: tickSpacing,
              hooks: ZERO_ADDRESS
            },
            zeroForOne: zeroForOne,
            exactAmount: tryAmount,
            hookData: "0x"
          };

          console.log(`Trying quote with amount ${tryAmount.toString()} for pool ${pool.poolId}`);

          const result = await quoter.quoteExactInputSingle(params);

          const amountOut = result.amountOut || result[0]; // fallback cho các provider
          let decimalsOut = 18;

          for (const tokenName in TokenAddress) {
            const info = TokenAddress[tokenName];
            if (getAddress(info.tokenAddress) === tokenOut) {
              decimalsOut = info.decimals;
              break;
            }
          }
          
          console.log("Quote result:", {
            amountOut: amountOut.toString(),
            decimalsOut,
            formattedAmount: formatUnits(amountOut, decimalsOut),
            usedAmount: tryAmount.toString()
          });

          return formatUnits(amountOut, decimalsOut);
        } catch (quoteError) {
          console.log(`Quote failed for pool ${pool.poolId} with amount ${tryAmount.toString()}:`, quoteError.message);
          
          // Check for specific error types
          if (quoteError.error?.data) {
            const errorData = quoteError.error.data;
            const errorType = decodeUniswapV4Error(errorData);
            console.log("Decoded error type:", errorType);
            
            if (errorType === "NotEnoughLiquidity") {
              console.log("Pool does not have enough liquidity for this swap");
              break; // Try next amount
            }
            if (errorType === "PoolNotInitialized") {
              console.log("Pool is not initialized");
              break; // Try next pool
            }
            if (errorType === "CustomUniswapV4Error") {
              console.log("Custom Uniswap V4 error - likely insufficient liquidity or invalid parameters");
              break; // Try next amount
            }
          }
          
          // If it's the last amount to try, continue to next pool
          if (tryAmount === amountsToTry[amountsToTry.length - 1]) {
            console.log("All amounts failed for this pool, trying next pool");
            break; // Try next pool
          }
          
          // Otherwise, continue to next amount
          continue;
        }
      }
    }

    // Check if any pools exist for this token pair
    let poolsExist = false;
    for (const [, pool] of Object.entries(PoolAddress)) {
      const token0 = getAddress(pool.token0);
      const token1 = getAddress(pool.token1);
      const isMatch =
        (tokenIn === token0 && tokenOut === token1) ||
        (tokenIn === token1 && tokenOut === token0);
      
      if (isMatch) {
        poolsExist = true;
        break;
      }
    }
    
    if (!poolsExist) {
      console.log("No pools exist for this token pair");
      return "0";
    } else {
      console.log("Pools exist but none have liquidity");
      console.log("To enable swaps, liquidity needs to be added to one of the pools");
      return "0";
    }
  } catch (err) {
    console.error("Quoter estimate failed:", err);
    console.error("Error details:", {
      tokenInAddress,
      tokenOutAddress,
      amountInBigNumber: amountInBigNumber?.toString(),
      error: err.message,
      errorData: err.error?.data
    });
    
    // Check for specific error types
    if (err.error?.data) {
      const errorData = err.error.data;
      const errorType = decodeUniswapV4Error(errorData);
      console.error("Decoded error type:", errorType);
      
      if (errorType === "NotEnoughLiquidity") {
        console.error("Pool does not have enough liquidity for this swap");
        return "0";
      }
      if (errorType === "PoolNotInitialized") {
        console.error("Pool is not initialized");
        return "0";
      }
      if (errorType === "CustomUniswapV4Error") {
        console.error("Custom Uniswap V4 error - likely insufficient liquidity or invalid parameters");
        return "0";
      }
    }
    
    console.error("No valid pools found or all pools failed to quote");
    return "0";
  }
};



  return (
    <TransactionContext.Provider value={{
      handleLogin,
      handleLogout,
      currentAccount,
      formData,
      setFormData,
      handleFormDataChange,
      makeTransaction,
      isLoading,
      transactions,
      getMyTransactions,
      getMyTransactionCount,
      handleWithdrawFailed,
      getTokenBalance,tokenBalance,
      findPoolIdFromTokens,setTokenInAddress,setTokenOutAddress,tokenInAddress,tokenOutAddress,setTokenBalance
      ,estimateAmountOutViaQuoter
    }}>
      {children}
    </TransactionContext.Provider>
  )
}
