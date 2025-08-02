import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { TransactionContext } from '../../context/TransactionContext'
import React, { useState,useEffect,useContext} from 'react';
import ModalTransaction from './ModalTransaction';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { swapTokens } from '../../utils/swap/excute/excute.js';
import SelectToken from './SelectToken';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import TOKENS  from '../../utils/swap/info/TokenAddress.json';
import AmountOut from './AmountOut';

const rpcUrl = import.meta.env.ALCHEMY_SEPOLIA_URL

const TOKEN_LIST = Object.values(TOKENS)

const ModalSwap = ({ theme, onClose }) => {

  const [showModalTransaction, setShowModalTransaction] = useState(false);

  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('')

  const [amountFrom, setAmountFrom] = useState(0);
  const [amountTo, setAmountTo] = useState(0);

  const [status, setStatus] = useState('');
  const [eslimateAmount,setEslimateAmount] = useState(0.1)
  const [showList, setShowList] = useState(false)
  
  const [isSwapIndex, setIsSwapIndex] = useState(false)
  const [error, setError] = useState('')

 const { 
         getTokenBalance,currentAccount,tokenBalance,
         findPoolIdFromTokens,setTokenInAddress,setTokenOutAddress,tokenInAddress,tokenOutAddress
     } = useContext(TransactionContext)


useEffect(() => {
  if (tokenInAddress.length>0 && currentAccount.length>0) 
      getTokenBalance()
}, [currentAccount,tokenInAddress])
  
const assignValueToTokenInAndTokenOut = async() => {
  if(tokenInAddress.length > 0 ){
      const token = TOKEN_LIST.filter(token => { if(token.tokenAddress == tokenInAddress) return token})
      setTokenIn(token[0].symbol)
  }else{
    setTokenIn('')
      getTokenBalance()
  }
  if(tokenOutAddress.length>0){
       const token = TOKEN_LIST.filter(token => { if(token.tokenAddress == tokenOutAddress) return token})
      setTokenOut(token[0].symbol)
  }else{
    setTokenOut('')
      getTokenBalance()
  }
}
useEffect(() => {
  assignValueToTokenInAndTokenOut()
}, [tokenInAddress,tokenOutAddress])

const handleSwapTokenIndex = async() => {
  const temp = tokenInAddress;
  setTokenInAddress(tokenOutAddress);
  setTokenOutAddress(temp);
  assignValueToTokenInAndTokenOut()
};

useEffect(() => {
     if(tokenInAddress && tokenOutAddress){
         const poolId =  findPoolIdFromTokens()
        if(poolId === null ) {
          setError('Couple swap not support')
        }
        else{
          console.log('Pool Id : ',poolId)
        }
     }
}, [tokenInAddress,tokenOutAddress])


  async function handleSwap() {
    try {
      if (amountFrom < 0.5 || amountFrom > 100 || isNaN(amount)) {
        setError('Số lượng không hợp lệ');
        return;
      }

      console.log('token in :', tokenIn);
      console.log('token out :', tokenOut);
      setStatus('Swapping...');

      const receipt = await swapTokens(tokenIn, tokenOut, [], amount.toString(), 0.03);
      setStatus(`Success! TX: ${receipt.transactionHash}`);
    } catch (err) {
      console.error(err);
      setStatus('Swap failed');
    }
  }

const handleInputValue = (e) => {
  const value = e.target.value;
  // Chỉ cho phép số và dấu chấm
  if (/^[0-9]*[.]?[0-9]*$/.test(value)) {
    setAmountFrom(value);
  }
};

const validateAmount = () => {
  let parsed = parseFloat(amountFrom);
  if (isNaN(parsed)) parsed = 0.5;
  if (parsed < 0.5) parsed = 0.5;
  if (parsed > 100) parsed = 100;
  setAmountFrom(parsed.toString());
};

useEffect(() => {
  setTimeout(() => {
    setError('')
  }, 3000);
}, [error])
      
  return (
    <>
      {!showModalTransaction ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eae6e800]">
          <div
            className={`p-6 rounded-lg shadow-xl w-[90vw] max-w-[700px] min-h-[40vh] max-h-[80vh] overflow-y-auto relative ${
              theme === 'dark-mode' ? 'bg-[#272a34] text-white' : 'bg-blue-100 text-gray-900'
            }`}
          >
            {/*phần đầu Modal */}
          <div className="flex flex-row justify-between">
                <SwapHorizIcon
                  className="hover:cursor-pointer animate-bounce"
                  style={{ fontSize: '40px' }}
                  onClick={() => {
                    setShowModalTransaction(true);
                  }}
                />
                <div
                  className={`flex justify-center items-center h-[17px] w-[17px] rounded-full ${
                    theme === 'dark-mode' ? 'bg-gray-300' : 'bg-indigo-700'
                  }`}
                >
                  <button
                    onClick={onClose}
                    className={`text-[14px] font-bold ${
                      theme === 'dark-mode' ? 'text-black' : 'text-white'
                    }`}
                  >
                    ✕
                  </button>
                </div>
          </div>
          {/*phần đầu Modal */}
{/*phần content Modal chứa input*/}
<div className="flex flex-col w-full items-center">
  <div className="flex flex-col w-full sticky top-15 z-20 my-5">
    <p className='text-white font-bold text-sm'>{tokenIn} available : {tokenBalance} </p>
        <div className="flex relative bg-[#2d2f36] border-[2px] border-gray-600 w-full h-auto p-4 rounded-2xl flex-row justify-between items-center shadow-md">
          <input
            name="amountIn"
            type="text"
            value={amountFrom}
            onChange={(e) => handleInputValue(e) }
            onBlur={validateAmount}
            className="bg-transparent text-[20px] font-semibold text-white focus:outline-none appearance-none grow size-14"
            placeholder="Min 0.5, Max 100"
            style={{
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
            }}
          />
         <SelectToken values={TOKEN_LIST} isTokenOut={false}/>
        </div>
  </div>
           <button  onClick={handleSwapTokenIndex} className='cursor-pointer'>
             <SwapVertIcon style={{fontSize:'40px'}} />
           </button>
  <div className="flex flex-col w-full sticky top-15 z-20 mt-4">
        <div className="relative bg-[#2d2f36] border-[2px] border-gray-600 w-full h-auto p-4 rounded-2xl flex flex-row justify-between items-center shadow-md">
          <input
            name="amountOut"
            disabled
            type="number"
            value={amountTo}
            className="bg-transparent text-[20px] font-semibold text-white focus:outline-none appearance-none grow size-14"
            style={{
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
            }}
          />
         <SelectToken values={TOKEN_LIST} isTokenOut={true} />
        </div>
  </div>
</div>
{/*phần content Modal */}
         {error.length > 0 ? (
          <>
          <Stack spacing={2} margin={'10px'} className='m-auto'>
            <Alert severity='error'>{error}</Alert>
          </Stack>
         </>):(<>
           {/* <Stack spacing={2} margin={'10px'} className='m-auto'>
            <Alert severity='success'>hihi</Alert>
          </Stack> */}
         </>)
         }
            <button onClick={handleSwap} className="bg-blue-500 w-full text-white px-4 py-2 rounded my-[10px]">
              Swap
            </button>
    </div>
</div>
      ) : (
        <ModalTransaction theme={theme} onClick={() => setShowModalTransaction(false)} />
      )}
    </>
  );
}

export default ModalSwap;
