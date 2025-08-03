import React, { useEffect, useState } from "react"
import { ethers } from 'ethers'
import { contractABI, contractAddress } from '../utils/Constants'
import axios from 'axios'
import { keccak256, defaultAbiCoder, getAddress } from "ethers/lib/utils";
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
  for (const [name, pool] of Object.entries(PoolAddress)) {
    const tokenA = getAddress(tokenInAddress);
    const tokenB = getAddress(tokenOutAddress);
    const token0 = getAddress(pool.token0);
    const token1 = getAddress(pool.token1);
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

      return {
        name,
        poolId,
        info: pool,
      };
    }
  }

  return null;
}



const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const estimateAmountOutViaQuoter = async (amountInBigNumber) => {
  try {
    if (
      !tokenInAddress ||
      !tokenOutAddress ||
      tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()
    ) {
      return "0";
    }

    const signer = await getSigner();
    const tokenIn = getAddress(tokenInAddress);
    const tokenOut = getAddress(tokenOutAddress);

    for (const [, pool] of Object.entries(PoolAddress)) {
      const token0 = getAddress(pool.token0);
      const token1 = getAddress(pool.token1);
      const isMatch =
        (tokenIn === token0 && tokenOut === token1) ||
        (tokenIn === token1 && tokenOut === token0);

      if (!isMatch) continue;

      const quoter = new ethers.Contract(
        UNISWAP_V4_ADDRESSES.Quoter,
        QUOTER_ABI.abi,
        signer
      );

      const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();
      const fee = pool.fee;
      const tickSpacing = pool.tickSpacing;

      // Đây là phần params đúng format
      const params = {
        poolKey: {
          currency0: token0,
          currency1: token1,
          fee: fee,
          tickSpacing: tickSpacing,
          hooks: ZERO_ADDRESS
        },
        zeroForOne: zeroForOne,
        exactAmount: amountInBigNumber,
        hookData: "0x"
      };

      console.log("quoteExactInputSingle params", params);

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

      return formatUnits(amountOut, decimalsOut);
    }

    return "0";
  } catch (err) {
    console.error("Quoter estimate failed:", err);
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
