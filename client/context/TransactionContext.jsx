import React, { useEffect, useState } from "react"
import { ethers } from 'ethers'
import axios from 'axios'
import { keccak256, defaultAbiCoder, getAddress, formatUnits } from "ethers/lib/utils";

import TokenAddress from '../../client/utils/swap/info/address/TokenAddress.json'
import FaucetAddress from '../../client/utils/swap/info/address/FaucetAddress.json'
import Faucet from '../../client/utils/swap/info/abi/Faucet.json'

import TransactionDex from '../utils/swap/info/abi/TransactionDex.json'
import TransactionDexAddress from '../utils/swap/info/address/TransactionDexAddress.json'

import SwapDexAddress from "../../client/utils/swap/info/address/SwapDexAddress.json";
import SwapDex from "../../client/utils/swap/info/abi/SwapDex.json";

import PriceOracleAddress from "../../client/utils/swap/info/address/PriceOracleAddress.json";
import PriceOracle from "../../client/utils/swap/info/abi/PriceOracle.json";

import TokenABI from "../../client/utils/swap/info/abi/Token.json"



export const TransactionContext = React.createContext()

export const TransactionsProvider = ({ children }) => {
  
  const [currentAccount, setCurrentAccount] = useState('')

  const [transactions, setTransactions] = useState([])

  const [tokenBalance, setTokenBalance] = useState("0")

  const [tokenInAddress, setTokenInAddress] = useState('')
  const [tokenOutAddress, setTokenOutAddress] = useState('')

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

  const createTransactionDexContract = async () => {
    const signer = await getSigner()
    return new ethers.Contract(TransactionDexAddress.TransactionsAddress, TransactionDex.abi, signer)
  }

    const createSwapDexContract = async () => {
    const signer = await getSigner()
    return new ethers.Contract(SwapDexAddress.address,SwapDex.abi,signer)
  }

  const getMyTransactionCount = async () => {
    const contract = await createTransactionDexContract()
    const count = await contract.getMyTransactionCount()
    console.log('Số giao dịch:', count.toNumber())
  }

  const getMyTransactions = async (start = 0) => {
    const states = ["Pending", "Success", "Failed"]
    try {
      const contract = await createTransactionDexContract()
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
        state: states[tx.state],
      }))
      setTransactions(structured)
    } catch (error) {
      console.error("Error when get transaction history :", error)
    }
  }

  const getMySwapCount = async () => {
      const signer = await getSigner()
      const contract = await createSwapDexContract()
      const count = await contract.getUserSwapCount(signer.getAddress())
      return count
  }

 const getMySwapHistory = async (start = 0) => {
  try {
    const signer = await getSigner();
    const userAddress = await signer.getAddress();
    const contract = await createSwapDexContract();
    // lấy số lượng swap đã thực hiện
    const count = await getMySwapCount();
    console.log("Swap History Count:", count.toString());

    // nếu chưa có swap nào thì dừng
    if (count.eq(0)) return;

    const total = count.toNumber();
    if (start >= total) return;

    // lấy danh sách swap từ start -> total
    const history = await contract.getUserSwapHistory(
      userAddress,
      start,
      total
    );
await history
   console.log("Swap History : ",history)
  } catch (error) {
    console.error("Error when get swap history:", error);
  }
};



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
      alert("User refused login request.");
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/auth/logout', {}, {
        withCredentials: true,
      })
      setCurrentAccount('')
      setTransactions([])
      window.location.reload()
    } catch (err) {
      alert("Error when logout.");
    }
  }

  const makeTransaction = async (addressTo,value) => {
    try {
      if(!currentAccount) return{state:0,tx:'Please login first.'}
      const parsedValue = ethers.utils.parseEther(value)
      if (!ethers.utils.isAddress(addressTo)) {
        return{state:1,tx:'Receiver address invalid'}
      }

      if (!value || isNaN(value) || Number(value) < 0.005 || Number(value) > 0.01 || !isFinite(value) ) {
        return{state:0 ,tx: 'Value must between on 0.005 - 0.01 ETH'}
      }

      const contract = await createTransactionDexContract()
      
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

      await tx.wait()
      console.log("Transaction Successfully:", tx.hash)
      return {state: 1, tx: "Transaction successfully"}

    } catch (error) {
      console.log(`Transaction failed: ${error.reason || error.message}`)
      return {state: 0,tx:"Transaction failed"}
    }
  }

  const handleWithdrawFailed = async () => {
    try {
      const contract = await createTransactionDexContract()
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

  const handleFormDataChange = (e, name) => {
    setFormData((prev) => ({ ...prev, [name]: e.target.value }))
  }


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


const estimateAmountOut = async (amount) => {
  try {

    const signer = await getSigner();
    const swapDex = await new ethers.Contract(SwapDexAddress.address, SwapDex.abi, signer)
    const priceOracle = await new ethers.Contract(PriceOracleAddress.address, PriceOracle.abi, signer)

    // Lấy địa chỉ USD 
    const usdAddress = ethers.constants.AddressZero;

    const token_list = Object.values(TokenAddress)

    //lấy ra thông tin in và out
    const tokenInInfo = token_list.find((token) => token.tokenAddress === tokenInAddress);
    const tokenOutInfo = token_list.find((token) => token.tokenAddress === tokenOutAddress);

    if (!tokenInInfo || !tokenOutInfo) {
      console.error("Không tìm thấy thông tin token");
      return;
    }
    if ((tokenInAddress || '').toLowerCase() === (tokenOutAddress || '').toLowerCase()) return null;


    const tokenInName = tokenInInfo.symbol;
    const tokenOutName = tokenOutInfo.symbol;

    //decimals
    const tokenInDecimals = tokenInInfo.decimals;
    const tokenOutDecimals = tokenOutInfo.decimals;

    // Lấy giá từ PriceOracle (USD prices, luôn 18 decimals để cho giá là nhất quán)
    const tokenInPriceInUSD = ethers.utils.formatUnits(
      await priceOracle.getPrice(tokenInAddress, usdAddress),
      18
    );
    const tokenOutPriceInUSD = ethers.utils.formatUnits(
      await priceOracle.getPrice(tokenOutAddress, usdAddress),
      18
    );

    // Chuyển đổi amount input sang đơn vị nhỏ nhất, bỏ qua khi người dùng đang gõ dở (ví dụ: "0.") hoặc amount = 0
    const amountStr = (amount ?? '').toString().trim();
    if (!amountStr || amountStr === '.' || amountStr.endsWith('.')) return null;
    let amountInSmallestUnits;
    try {
      amountInSmallestUnits = ethers.utils.parseUnits(amountStr, tokenInDecimals);
    } catch (_) {
      return null;
    }
    if (amountInSmallestUnits.isZero()) return null;

    // Ước lượng output dựa trên AMM (dùng hàm trong contract để tránh sai số/overflow)
    let outBN;
    try {
      outBN = await swapDex.getAmountOut(
        tokenInAddress,
        tokenOutAddress,
        amountInSmallestUnits
      );
    } catch (_) {
      return null;
    }
    const amountOutFormatted = ethers.utils.formatUnits(outBN, tokenOutDecimals);

    // Tính toán giá từ PriceOracle (USD-based estimation)
    const oracleEstimate = (parseFloat(amount) * parseFloat(tokenInPriceInUSD)) / parseFloat(tokenOutPriceInUSD);

    const oracleEstimateFormatted = oracleEstimate.toFixed(6);

    const arrRes = `${amount} ${tokenInName} ($${tokenInPriceInUSD})
       ~ ${amountOutFormatted} ${tokenOutName} ($${tokenOutPriceInUSD} )`;

    return {
      res: amountOutFormatted,
      arrRes,
      ammEstimate: amountOutFormatted,
      oracleEstimate: oracleEstimateFormatted,
      tokenInPriceUSD: tokenInPriceInUSD,
      tokenOutPriceUSD: tokenOutPriceInUSD
    }
  } catch (error) {
    return null;
  }
};


const swapToken = async (amount) => {

  try {
    if(!currentAccount) return{state:0,tx:'Please login first.'}
    const numericAmount = Number(amount);
    if (!isFinite(numericAmount) || numericAmount > 0.5) {
      return {state:0,tx:"Value must exact than 0.5"}
    }
    if (!isFinite(numericAmount) || numericAmount < 0.5) {
      return {state:0,tx:"Value must exact that 0.5"}
    }

    const signer = await getSigner();
    const SwapDex = new ethers.Contract(SwapDexAddress.address, SwapDex.abi, signer);

    const tokens = Object.values(TokenAddress);
    const tokenSwapIn = tokens.find((t) => t.tokenAddress === tokenInAddress);
    const tokenSwapOut = tokens.find((t) => t.tokenAddress === tokenOutAddress);

    if (!tokenSwapIn || !tokenSwapOut) {
      return {state:0,tx:"Not found token necessary to make swap transaction"}
    }

    const ERC20_WRITE_ABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function allowance(address,address) view returns (uint256)",
      "function approve(address,uint256) external returns (bool)"
    ];

    const tokenInContract = new ethers.Contract(tokenSwapIn.tokenAddress, ERC20_WRITE_ABI, signer);
    const tokenOutContract = new ethers.Contract(tokenSwapOut.tokenAddress, ERC20_WRITE_ABI, signer);

    const userAddress = await signer.getAddress();

    const amountInBN = ethers.utils.parseUnits(numericAmount.toString(), tokenSwapIn.decimals);

    const [balanceInBefore, balanceOutBefore] = await Promise.all([
      tokenInContract.balanceOf(userAddress),
      tokenOutContract.balanceOf(userAddress)
    ]);

    if (balanceInBefore.lt(amountInBN)) {
      return {state:0,tx:`Balance ${tokenSwapIn.symbol} not enough`}
    }

    const currentAllowance = await tokenInContract.allowance(userAddress, SwapDexAddress.address);
    if (currentAllowance.lt(amountInBN)) {
      const approveTx = await tokenInContract.approve(SwapDexAddress.address, amountInBN);
      await approveTx.wait();
    }

    const tx = await SwapDex.swapExactTokensForTokens(
      tokenSwapIn.tokenAddress,
      tokenSwapOut.tokenAddress,
      amountInBN
    );
    await tx.wait();

    const [balanceInAfter, balanceOutAfter] = await Promise.all([
      tokenInContract.balanceOf(userAddress),
      tokenOutContract.balanceOf(userAddress)
    ]);

    const receivedOut = balanceOutAfter.sub(balanceOutBefore);

    await getTokenBalance();

    return {
      state:1,
      txHash: tx.hash,
      amountIn: ethers.utils.formatUnits(amountInBN, tokenSwapIn.decimals),
      amountOut: ethers.utils.formatUnits(receivedOut, tokenSwapOut.decimals),
      tokenIn: tokenSwapIn.symbol,
      tokenOut: tokenSwapOut.symbol,
      tx: 'Swap successfully'
    }

  } catch (err) {
    return {state:0,tx:"Swap failed."}
  }
};

const faucetToken = async (tokenNameRequestFaucet) => {
  
  const signer = await getSigner();
  const faucet = new ethers.Contract(FaucetAddress.faucetAddress, Faucet.abi, signer);
  const userAddress = await signer.getAddress();

  if (!tokenNameRequestFaucet || tokenNameRequestFaucet.length === 0) {
    console.log('Name token to faucet invalid');
    return null;
  }

  const timeUntilNext = await faucet.getTimeUntilNextFaucet(userAddress);
  if (!timeUntilNext.eq(0)) 
    return {state:0, cooldownRemaining: timeUntilNext.toString() };

  const initialBalances = {};
  for (const [tokenName, tokenData] of Object.entries(TokenAddress)) {
    const tokenContract = new ethers.Contract(
      tokenData.tokenAddress,
      ['function balanceOf(address account) external view returns (uint256)'],
      signer
    );
    const balance = await tokenContract.balanceOf(userAddress);
    initialBalances[tokenName] = balance;
    // console.log(`${tokenName} (${tokenData.symbol}): ${ethers.utils.formatUnits(balance, tokenData.decimals)}`);
  }

  const resolveSelectedToken = (display) => {
    const match = /^(.+?)\s*\((.+?)\)$/.exec(display);
    const desiredName = match ? match[1] : display;
    const desiredSymbol = match ? match[2] : null;
    return Object.entries(TokenAddress).find(([nameKey, data]) =>
      nameKey === desiredName || (desiredSymbol && data.symbol === desiredSymbol)
    );
  };

  if (tokenNameRequestFaucet === 'All') {
    try {
      const requestTx = await faucet.requestAllFaucets();
      // console.log(`Transaction hash: ${requestTx.hash}`);
      const receipt = await requestTx.wait();
      // console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      for (const [tokenName, tokenData] of Object.entries(TokenAddress)) {
        const tokenContract = new ethers.Contract(
          tokenData.tokenAddress,
          ['function balanceOf(address account) external view returns (uint256)'],
          signer
        );
        const newBalance = await tokenContract.balanceOf(userAddress);
        const faucetAmount = await faucet.faucetAmounts(tokenData.tokenAddress);

        // console.log(`Balance before: ${ethers.utils.formatUnits(initialBalances[tokenName], tokenData.decimals)} ${tokenData.symbol}`);
        // console.log(`Balance after: ${ethers.utils.formatUnits(newBalance, tokenData.decimals)} ${tokenData.symbol}`);
        // console.log(`Faucet amount received: ${ethers.utils.formatUnits(faucetAmount, tokenData.decimals)} ${tokenData.symbol}`);

        const expectedIncrease = faucetAmount;
        const actualIncrease = newBalance.sub(initialBalances[tokenName]);
        if (actualIncrease.eq(expectedIncrease)) {
          return {state:0, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'all' };
          // console.log(`SUCCESS: Received correct amount for ${tokenName}`);
        } else {
          return {state:0, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'all' };
          // console.log(`ERROR: Expected ${ethers.utils.formatUnits(expectedIncrease, tokenData.decimals)}, got ${ethers.utils.formatUnits(actualIncrease, tokenData.decimals)}`);
        }
      }
      return {state:1, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'all' };
    } catch (error) {
      return {state:0, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'all' };
    }
  }

  const selected = resolveSelectedToken(tokenNameRequestFaucet);
  if (!selected) {
    console.log(`Không tìm thấy token: ${tokenNameRequestFaucet}`);
    return null;
  }

  const [selectedName, selectedData] = selected;
  try {
    const requestTx = await faucet.requestFaucet(selectedData.tokenAddress);
    // console.log(`Transaction hash: ${requestTx.hash}`);
    const receipt = await requestTx.wait();
    // console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    const tokenContract = new ethers.Contract(
      selectedData.tokenAddress,
      ['function balanceOf(address account) external view returns (uint256)'],
      signer
    );
    const newBalance = await tokenContract.balanceOf(userAddress);
    const faucetAmount = await faucet.faucetAmounts(selectedData.tokenAddress);

    // console.log(`Balance before: ${ethers.utils.formatUnits(initialBalances[selectedName], selectedData.decimals)} ${selectedData.symbol}`);
    // console.log(`Balance after: ${ethers.utils.formatUnits(newBalance, selectedData.decimals)} ${selectedData.symbol}`);
    // console.log(`Faucet amount received: ${ethers.utils.formatUnits(faucetAmount, selectedData.decimals)} ${selectedData.symbol}`);

    const expectedIncrease = faucetAmount;
    const actualIncrease = newBalance.sub(initialBalances[selectedName]);
    if (actualIncrease.eq(expectedIncrease)) {
      return {state:1, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'one' };
      // console.log(`SUCCESS: Received correct amount for ${selectedName}`);
    } else {
      return {state:0, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'one' };
      // console.log(`ERROR: Expected ${ethers.utils.formatUnits(expectedIncrease, selectedData.decimals)}, got ${ethers.utils.formatUnits(actualIncrease, selectedData.decimals)}`);
    }

    // return {state:1, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'one' };
  } catch (error) {
    return {state:0, txHash: requestTx.hash, blockNumber: receipt.blockNumber, mode: 'one' };
    // console.log(`Error requesting ${selectedName}: ${error.message}`);
    // throw error;
  }
}


  return (
    <TransactionContext.Provider value={{
      handleLogin,
      handleLogout,
      currentAccount,
      handleFormDataChange,
      makeTransaction,
      transactions,
      getMyTransactions,
      getMyTransactionCount,
      handleWithdrawFailed,
      getTokenBalance,tokenBalance,
      setTokenInAddress,setTokenOutAddress,tokenInAddress,tokenOutAddress,setTokenBalance
      ,estimateAmountOut,swapToken,faucetToken,getMySwapHistory,
    }}>
      {children}
    </TransactionContext.Provider>
  )
}
