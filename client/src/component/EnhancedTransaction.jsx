import React, { useState, useContext } from 'react';
import { TransactionContext } from '../../context/TransactionContext';
import Loader from './Loader';

const EnhancedTransaction = () => {
  const { 
    formData, 
    handleFormDataChange,
    makeTransaction,
    isLoading,
    transactions,
    getMyTransactions,
    handleWithdrawFailed,
    tokenBalance,
    swapToken
  } = useContext(TransactionContext);

  const [activeTab, setActiveTab] = useState('transaction');
  const [swapAmount, setSwapAmount] = useState('');

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    const { addressTo, value } = formData;
    if (!addressTo || !value) return;
    makeTransaction();
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      await swapToken(swapAmount);
      setSwapAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-4">
      <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'transaction' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
          onClick={() => setActiveTab('transaction')}
        >
          ETH Transaction
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'dex' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
          onClick={() => setActiveTab('dex')}
        >
          Token Swap (DEX)
        </button>
      </div>

      {activeTab === 'transaction' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Send ETH Transaction</h3>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter recipient address"
                name="addressTo"
                value={formData.addressTo}
                onChange={(e) => handleFormDataChange(e, "addressTo")}
                className="w-full rounded-md p-3 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              
              <input
                type="number"
                min="0.005"
                max="0.01"
                step="0.0001"
                placeholder="Enter amount between 0.005 - 0.01"
                name="value"
                value={formData.value}
                onChange={(e) => handleFormDataChange(e, "value")}
                className="w-full rounded-md p-3 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                {isLoading ? <Loader /> : 'Send Transaction'}
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Transaction History</h3>
            <button
              onClick={getMyTransactions}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors mb-4"
            >
              Refresh
            </button>
            
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map((tx, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-medium">To: {tx.addressTo}</p>
                        <p className="text-gray-300 text-sm">Amount: {tx.value} ETH</p>
                        <p className="text-gray-300 text-sm">Time: {tx.timestamp}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tx.state === 'Success' ? 'bg-green-600 text-white' :
                        tx.state === 'Failed' ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {tx.state}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No transactions found</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Failed Transaction Withdrawal</h3>
            <button
              onClick={handleWithdrawFailed}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-md transition-colors"
            >
              {isLoading ? <Loader /> : 'Withdraw Failed Funds'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'dex' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Token Balance</h3>
            <p className="text-gray-300">
              Current Token Balance: <span className="text-white font-medium">{tokenBalance}</span>
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Swap Tokens</h3>
            <form onSubmit={handleSwapSubmit} className="space-y-4">
              <input
                type="number"
                placeholder="Enter amount to swap"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                className="w-full rounded-md p-3 bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                {isLoading ? <Loader /> : 'Swap Tokens'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTransaction; 