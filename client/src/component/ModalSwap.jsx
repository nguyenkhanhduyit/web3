import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { TransactionContext } from '../../context/TransactionContext'
import React, { useState,useEffect,useContext,useRef} from 'react';
import ModalTransaction from './ModalTransaction';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SelectToken from './SelectToken';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { ethers } from 'ethers'
import DescriptionIcon from '@mui/icons-material/Description';
import TOKENS  from '../../utils/swap/info/address/TokenAddress.json';
import Loader from './Loader';


const TOKEN_LIST = Object.values(TOKENS)

const ModalSwap = ({ theme, onClose,isShowSwap,isHiddenModalSwap }) => {

const [amountFrom, setAmountFrom] = useState(0);
const [amountTo, setAmountTo] = useState(0);

const [eslimateAmount,setEslimateAmount] = useState(0.1)

const [showList, setShowList] = useState(false)

const [arrAmountTo,setArrAmountTo] = useState('')

const [isSwapIndex, setIsSwapIndex] = useState(false)

const [errorMessage, setErrorMessage] = useState('')
const [successMessage, setSuccessMessage] = useState('')

const modalRef = useRef(null)

const [isLoading, setIsLoading] = useState(false)

const { 
  getTokenBalance,currentAccount,tokenBalance,setTokenInAddress
  ,setTokenOutAddress,tokenInAddress,tokenOutAddress,setTokenBalance,
  estimateAmountOut,swapToken
} = useContext(TransactionContext)

useEffect(() => {
  const fetchEstimate = async () => {
    try {
      if (!amountFrom || isNaN(amountFrom)) {
        setAmountTo("0");
        return;
      }
      if (typeof amountFrom === 'string' && (amountFrom === '.' || amountFrom.endsWith('.'))) {
        setAmountTo("0");
        return;
      }
      const decimals = TOKEN_LIST.find((token)=> token.tokenAddress === tokenInAddress)?.decimals
      const estimate = await estimateAmountOut(amountFrom);
      if (estimate) {
        const fixed = estimate.res
        setAmountTo(fixed);
        setArrAmountTo(estimate.arrRes)
      } else {
        setAmountTo(0);
      }
    } catch (err) {
      setAmountTo(0);
    }
  };
  fetchEstimate();
}, [amountFrom, tokenInAddress, tokenOutAddress]);

useEffect(() => {
  if (tokenInAddress && currentAccount && (tokenInAddress !== tokenOutAddress)) 
    getTokenBalance()
  else if(tokenInAddress && currentAccount && (tokenInAddress === tokenOutAddress)){
    setTokenInAddress('')
    setTokenOutAddress('')
    setTokenBalance('0')
  }
}, [currentAccount,tokenInAddress,tokenOutAddress,tokenBalance])

const handleSwapTokenIndex = async() => {
  const temp = tokenInAddress
  setTokenInAddress(tokenOutAddress)
  setTokenOutAddress(temp)
}

async function handleSwap() {
  // try {
    if (amountFrom != 0.5 || isNaN(amountFrom)) {
      setErrorMessage('Amount invalid');
      return;
    }
    setIsLoading(true)
    const tx = await swapToken(amountFrom);
    await tx
    if(tx && typeof tx === 'object' && 'state' in tx){
      if(tx.state === 0){
        setIsLoading(false)
        setErrorMessage(tx.tx)
      }
      else{
        setIsLoading(false)
        setSuccessMessage(tx.tx)
       }
    } 
  // } catch (err) {
  //     setIsLoading(false)
  //     setErrorMessage('Swap failed');
  // }
}

const handleInputValue = (e) => {
      let value = e.target.value
      if (/^[0-9]*[.]?[0-9]*$/.test(value)) {
      if(value.startsWith('0') && !value.startsWith('0.') && value.length>1){
          value = value.replace(/^0+/, '')
      }
        setAmountFrom(value)
      }
}

const validateAmount = () => {
      let parsed = parseFloat(amountFrom)
      if (isNaN(parsed)) parsed = 0.5
      if (parsed !== 0.5) parsed = 0.5
      setAmountFrom(parsed.toString())
};

useEffect(() => {
  setTimeout(() => {
  setErrorMessage('')
  setSuccessMessage('')
  }, 5000);
}, [errorMessage,successMessage])

useEffect(() => {
  const handleClickOutSide = (e) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(e.target) &&
      !e.target.closest('.MuiPopover-root') && 
      !e.target.closest('.MuiMenu-root')   
    ) {
      onClose();
    }
  };

  document.addEventListener('mousedown', handleClickOutSide);

  return () => {
    document.removeEventListener('mousedown', handleClickOutSide); 
  };
}, [onClose]);


      
return (
<>
  {
  isShowSwap ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eae6e800]">
  <div
    ref={modalRef}
    className={`p-6 rounded-lg shadow-xl w-[90vw] max-w-[700px] min-h-[40vh]
      max-h-[80vh] overflow-y-auto relative 
      ${theme === 'dark-mode' ? 'background-modal-dark-mode text-white' : 'background-modal-light-mode text-gray-700'
    }`}
  >
    <div className="flex flex-row justify-between">
      <SwapHorizIcon
        className="hover:cursor-pointer animate-bounce"
        style={{ fontSize: '40px' }}
        onClick={
          ()=> isHiddenModalSwap()
        }
      />
      <div
        className={` flex justify-center items-center h-[17px] w-[17px] rounded-full 
         bg-[#eae6e800] border-[1px] p-3 ${theme === 'dark-mode' ? 'border-white' : 'border-black'}`}
      >
        <button
          onClick={onClose}
          className={`cursor-pointer text-[14px] font-bold ${theme === 'dark-mode' ? 'text-white' : 'text-black'}`}
        >
          ✕
        </button>
      </div>
    </div>
    <div className="flex flex-col w-full gap-3">
      {
        tokenInAddress.length > 0 ?
        (
          <p className={`${theme === 'dark-mode' ? ' text-white' : ' text-gray-700'} font-sans text-sm ml-4`}>
            {
                TOKEN_LIST.find((token)=> token.tokenAddress === tokenInAddress)?.symbol
            }
            <span> available : {tokenBalance} </span>
          </p>
        ) 
        : 
        (
        <p className={`${theme === 'dark-mode' ? ' text-white' : ' text-gray-700'} font-sans text-sm ml-4 text-left`}>
            No token selecting
        </p>
        )
              
      } 

      <div className={`
      ${theme === 'dark-mode' ? ' border-white' : ' border-gray-700'}
        flex relative  border-[2px]
      w-full h-auto p-4 rounded-2xl flex-row justify-between items-center shadow-md
        `}>
        <input
          name="amountIn"
          type="text"
          autoComplete="off"
          value={amountFrom}
          onChange={handleInputValue}
          onBlur={validateAmount}
          className={`
            ${theme === 'dark-mode' ? ' text-white' : ' text-gray-700'}
            bg-transparent text-[20px] font-semibold focus:background-modal-dark-mode
          focus:outline-none appearance-none grow size-14
            `}
          placeholder="Min 0.5, Max 100"
          style={{
            MozAppearance: 'textfield',
            WebkitAppearance: 'none',
          }}
        />
        <SelectToken values={TOKEN_LIST} isTokenOut={false} theme={theme}/>
      </div>
      
        <div className='flex flex-col items-center'>
          <button  onClick={handleSwapTokenIndex} className='cursor-pointer items-center w-[10vw]'>
           <SwapVertIcon style={{fontSize:'40px'}} />
          </button>
        </div>
              
      <div className="flex flex-col w-full sticky top-15 z-20 mt-4">
        <div className={`
         ${theme === 'dark-mode' ? ' border-white' : ' border-gray-700'}
          relative  border-[2px]  w-full h-auto p-4 rounded-2xl flex flex-row justify-between items-center shadow-md
          `}>
          <input
            name="amountOut"
            disabled
            type="number"
            value={amountTo}
            className={`
               ${theme === 'dark-mode' ? ' text-white' : ' text-gray-700'}
              bg-transparent text-[20px] font-semibold focus:outline-none appearance-none grow size-14
              `}
            style={{
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
            }}
          />
            <SelectToken values={TOKEN_LIST} isTokenOut={true} theme={theme} />
        </div>
      </div>

      {
        arrAmountTo && (
          <p className='text-sm text-white font-sans p-4'>{arrAmountTo}</p>
        )
      }

      {
      errorMessage && (
        <Stack spacing={2} margin={'10px'} className='m-auto'>
          <Alert severity='error'>{errorMessage}</Alert>
        </Stack>
      )
      }

      {
      successMessage && (
        <Stack spacing={2} margin={'10px'} className='m-auto'>
          <Alert severity='success'>{successMessage}</Alert>
        </Stack>
      )
      }

      {
        isLoading ? (<Loader/>) : 
        (
          <button onClick={handleSwap}
            className={` w-full  ${theme === 'dark-mode' ? ' text-black bg-white' : ' bg-gray-700 text-white'} rounded-full h-[7vh] cursor-pointer my-3`}>
                  Swap
          </button>
        )
      }
      <div className='flex flex-col items-end'>
        <DescriptionIcon className={`cursor-pointer ${theme === 'dark-mode' ? 'text-white' : 'text-gray-700 '}`} onClick={()=>window.location.replace('/swap-history')}/>
      </div>
    </div>
  </div>
</div>
  ) : 
  (
    <ModalTransaction theme={theme} onClick={() => setShowModalTransaction(false)} />
  )}
</>
  );
}

export default ModalSwap;
