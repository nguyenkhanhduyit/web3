import React, { useEffect, useRef, useContext, useState } from 'react';
import QRCode from 'qrcode';
import { TransactionContext } from '../../context/TransactionContext';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

const QRCard = ({ show, theme, onClose }) => {

  const { currentAccount } = useContext(TransactionContext);
  const [showQR, setShowQR] = useState(show);
  const canvasRef = useRef(null);
  const modalRef = useRef(null); 
  const [isCopy,setIsCopy] = useState(false)

  useEffect(() => {
    setShowQR(show);
  }, [show]);

  useEffect(() => {
    if (showQR && currentAccount && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, currentAccount, { width: 200 }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [showQR, currentAccount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowQR(false)
        setIsCopy(false)
        if (onClose) onClose();
      }
    };

    if (showQR)
      document.addEventListener('mousedown', handleClickOutside);

    return () => {
      setIsCopy(false)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQR, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eae6e800]">
      <div
        ref={modalRef}
        className={`p-3 max-h-[370px] max-w-[250px] min-h-[310px] min-w-[250px] rounded-lg shadow-xl
          ${theme === 'dark-mode' ? 'qr-dark-mode-background text-white' : 'bg-blue-100 text-gray-900'}`}
      >
        <div className="flex-col justify-center items-center ">
          <div className="flex justify-end my-2">
          </div>
          <div className="flex justify-center mb-4">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-wrap break-words font-bold text-sm">{currentAccount}
             <span className='p-2'>
                <button  onClick={() => {navigator.clipboard.writeText(currentAccount);setIsCopy(true)}}>
                        <ContentCopyIcon />
                </button>
                {
                  isCopy && <span>Copied</span> 
                }
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCard;
