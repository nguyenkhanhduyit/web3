import { ethers } from 'ethers';
import QRCode from 'qrcode.react';
import React, { useState, useContext } from 'react' 
import { TransactionContext } from '../../context/TransactionContext'

const QRCard = () => {
    const { 
            currentAccount,
        } = useContext(TransactionContext)

  const [showQR, setShowQR] = useState(true);



  return (
    <>
      {currentAccount && (
        <div>
          <p>Your Wallet Address</p>
          <p style={{ wordBreak: 'break-all', fontWeight: 'bold' }}>{address}</p>
          <button onClick={() => navigator.clipboard.writeText(address)}>
            Copy
          </button>
          <br /><br />
          <button onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Ẩn QR ❌' : 'Hiện QR Code 📷'}
          </button>
          <br /><br />
          {showQR && (
            <QRCode value={address} size={200} />
          )}
        </div>
      )}
    </>
  );
};

export default QRCard;
