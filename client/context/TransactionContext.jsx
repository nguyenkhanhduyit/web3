import React, { useEffect, useState } from "react"
import { ethers } from 'ethers'
import { contractABI, contractAddress } from '../utils/Constants'
import axios from 'axios'
import { keccak256, defaultAbiCoder, getAddress, formatUnits } from "ethers/lib/utils";

import TokenAddress from '../../client/utils/swap/info/TokenAddress.json'

import SimpleDEXAddress from "../../client/utils/swap/info/SimpleDEXAddress.json";
import SimpleDEX from "../../client/utils/swap/info/SimpleDEX.json";
import PriceOracleAddress from "../../client/utils/swap/info/PriceOracleAddress.json";
import PriceOracle from "../../client/utils/swap/info/PriceOracle.json";

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



const estimateAmountOutViaQuoter = async (amount) => {
  try {
    const signer = await getSigner();
    const simpleDEX = await new ethers.Contract(SimpleDEXAddress.address, SimpleDEX.abi, signer)
    const priceOracle = await new ethers.Contract(PriceOracleAddress.address, PriceOracle.abi, signer)

    // Lấy địa chỉ USDT để làm base currency
    const usdAddress =  ethers.constants.AddressZero;

    const token_list = Object.values(TokenAddress)

    //lấy ra thông tin in và out
    const tokenInInfo = token_list.find((token) => token.tokenAddress === tokenInAddress);
    const tokenOutInfo = token_list.find((token) => token.tokenAddress === tokenOutAddress);

    if (!tokenInInfo || !tokenOutInfo) {
      console.error("Không tìm thấy thông tin token");
      return;
    }

    const tokenInName = tokenInInfo.symbol;
    const tokenOutName = tokenOutInfo.symbol;

    //decimals
    const tokenInDecimals = tokenInInfo.decimals;
    const tokenOutDecimals = tokenOutInfo.decimals;

    // Lấy giá từ PriceOracle
    const tokenInPriceInUSD = ethers.utils.formatUnits(await priceOracle.getPrice(tokenInAddress, usdAddress),18);
    const tokenOutPriceInUSD = ethers.utils.formatUnits(await priceOracle.getPrice(tokenOutAddress, usdAddress),18);

    const res = (amount*(tokenInPriceInUSD/tokenOutPriceInUSD)) // => vd :btc => eth
    const arrRes =`${amount} ${tokenInName} (${tokenInPriceInUSD} USD)
       ~ ${res} ${tokenOutName} (${tokenOutPriceInUSD} USD) `
       
    return {res,arrRes}
  } catch (error) {
    console.error("Lỗi khi ước lượng swap:", error);
    return null;
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
      setTokenInAddress,setTokenOutAddress,tokenInAddress,tokenOutAddress,setTokenBalance
      ,estimateAmountOutViaQuoter
    }}>
      {children}
    </TransactionContext.Provider>
  )
}
