import React, { useState, useEffect,useContext } from 'react';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Loader from './Loader';
import ModalSwap from './ModalSwap';
import { ethers } from 'ethers';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { TransactionContext } from '../../context/TransactionContext';

const ModalTransaction = ({ theme, onClose }) => {

  const [isLoading, setIsLoading] = useState(false);

  const [addressReceive, setAddressReceive] = useState('')
  const [amount, setAmount] = useState('')

  const [showModalSwap, setShowModalSwap] = useState(false);

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {makeTransaction} = useContext(TransactionContext)

  useEffect(() => {
      setTimeout(() => {
      setErrorMessage('')
      setSuccessMessage('')
      }, 5000);
  }, [errorMessage,successMessage])
  
  const handleAddressReceiveChange = async(e) => {
      setAddressReceive(e.target.value)
  }
  
  const handleAmountChange = async(e) => {
      setAmount(e.target.value)
  }
  
  const handleSend = async(e) => {
    try {
      setIsLoading(true)
      if (!ethers.utils.isAddress(addressReceive)) {
        setIsLoading(false)
        setErrorMessage('Receiver address invalid')
        return
      }

      if (!amount || isNaN(amount) || Number(amount) < 0.005 || Number(amount) > 0.01) {
        setIsLoading(false)
        setErrorMessage('Value of send between on 0.005 - 0.01 ETH')
        return
      }

      const tx = await makeTransaction(addressReceive,amount)

      if(tx && typeof tx === 'object' && "state" in tx){
          if(tx.state === 0){
            setIsLoading(false)
            setErrorMessage('Transaction failed')
            return
          }
          setIsLoading(false)
          setSuccessMessage('Transaction successfully')

      }

   } catch (error) {
      setIsLoading(false)
      setErrorMessage("Happened error")
      throw new Error(error.message);
   }
  }


  return (
        <>
            {
    !showModalSwap ? ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eae6e800]">
      <div
        className={`p-6 rounded-lg shadow-xl w-[90vw] max-w-[700px] min-h-[40vh] max-h-[80vh] 
          overflow-y-auto relative 
          ${theme === 'dark-mode' ? 'background-modal-dark-mode text-white' : 'background-modal-dark-mode text-gray-900'
        }`}
      >
        <div className="flex flex-row justify-between">
             <SwapHorizIcon
            className="hover:cursor-pointer animate-bounce"
            style={{ fontSize: '40px' }}
            onClick={() => {
                setShowModalSwap(true)
            }}
          />
        <div className={`flex justify-center items-center h-[17px] w-[17px] rounded-full 
          ${theme === 'dark-mode' ? 'bg-gray-300' : 'bg-indigo-700'}`}>
          <button onClick={onClose} className={`text-[14px] font-bold 
            ${theme === 'dark-mode' ? 'text-black' : 'text-white'}`}>
            ✕
          </button>
        </div>
        </div>

        <div className="flex flex-col">
          <input
            value={addressReceive}
            type="text"
            className="bg-transparent my-4 placeholder:text-white p-2 outline-none border-b text-sm font-light "
            placeholder="Enter ETH address"
            onChange={handleAddressReceiveChange}
          />
          <input
            value={amount}
            type="text"
            className="bg-transparent my-4 placeholder:text-white p-2 outline-none border-b text-sm font-light "
            placeholder="Enter value"
            onChange={handleAmountChange}
          />
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
        isLoading ? (<>
                <Loader/>
        </>) : (
            <button
            type="button"
            onClick={handleSend}
            className="relative w-full h-[7vh] 
            my-4 border border-[#3d4f7c] rounded-full bg-white overflow-hidden
            cursor-pointer
            text-black
            font-light
            "
          >
           Make Transaction
          </button>
        )
     }
        </div>
      </div>
      
    </div>) : (
        <ModalSwap theme={theme} onClose={onClose}  onClick={()=>setShowModalSwap(false)}/>
    )
            }
        </>
    
  );
};

export default ModalTransaction;
