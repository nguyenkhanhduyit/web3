import React, { useState, useRef, useEffect } from 'react';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Loader from './Loader';
import ModalSwap from './ModalSwap';

const ModalTransaction = ({ theme, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef(null);
  const iconRef = useRef(null);
  const [distance, setDistance] = useState(0);
  const [showModalSwap, setShowModalSwap] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    if (buttonRef.current && iconRef.current) {
      const buttonWidth = buttonRef.current.offsetWidth;
      const iconWidth = iconRef.current.offsetWidth;
      const paddingLeft = 16; 
      const paddingRight = 16;
      const target = buttonWidth - iconWidth - paddingLeft - paddingRight;
      setDistance(target);
    }

    setTimeout(() =>{ setIsSending(false), setIsLoading(true)}, 2000);
  };

  return (
        <>
            {
                !showModalSwap ? ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eae6e800]">
      <div
        className={`p-6 rounded-lg shadow-xl w-[90vw] max-w-[700px] min-h-[40vh] max-h-[80vh] overflow-y-auto relative ${
          theme === 'dark-mode' ? 'bg-[#272a34] text-white' : 'bg-blue-100 text-gray-900'
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
            <div className={`flex justify-center items-center h-[17px] w-[17px] rounded-full ${theme === 'dark-mode' ? 'bg-gray-300' : 'bg-indigo-700'}`}>
              <button onClick={onClose} className={`text-[14px] font-bold ${theme === 'dark-mode' ? 'text-black' : 'text-white'}`}>
                ✕
              </button>
            </div>
        </div>

        <div className="flex flex-col">
          <input
            type="text"
            className="bg-transparent my-4 placeholder:text-white p-2 outline-none border-b text-sm font-sans focus:text-center"
            placeholder="Enter ETH address"
          />
          <input
            type="text"
            className="bg-transparent my-4 placeholder:text-white p-2 outline-none border-b text-sm font-sans focus:text-center"
            placeholder="Enter value"
          />

     {
        isLoading ? (<>
                <Loader/>
        </>) : (
                 <button
            ref={buttonRef}
            type="button"
            onClick={handleSend}
            className="relative text-white w-full h-[7vh] my-4 border border-[#3d4f7c] rounded-full bg-green-400 overflow-hidden"
          >
           
            <div
              ref={iconRef}
              className="m-4 absolute top-1/2 left-4 transform -translate-y-1/2 transition-transform duration-1000 ease-in-out"
              style={{
                transform: `translateY(-50%) translateX(${isSending ? `${distance}px` : '0px'})`,
              }}
            >
              <LocalShippingIcon className="text-white" style={{ fontSize: '35px' }} />
            </div>
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
