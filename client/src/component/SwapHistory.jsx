// import React,{useContext,useEffect,useState} from 'react'
// import { TransactionContext } from '../../context/TransactionContext';

// const SwapHistory = ({theme}) => {
// const {makeTransaction,getMySwapHistory,currentAccount,swaps,swapCount} = useContext(TransactionContext)

// useEffect(() => {
//   const getSwapHistory = async () => {
//       if(currentAccount) return
//       await getMySwapHistory()
//   }
//   getSwapHistory()
// }, [])

// const SwapHistoryCard = ({history}) => {
//   return (
//     <>
//       {/* <p>token in : {history.tokenIn}</p>
//       <p>token out : {history.tokenOut}</p> */}
//       <p>trader : {history.trader}</p>
//       <p>From : {history.amountIn} {history.tokenIn}</p>
//       <p>To : {history.amountOut} {history.tokenOut}</p>
//       {/* <p>blocknumber : {history.blockNumber}</p> */}
//       <p>{history.timestamp}</p>
//     </>
//   )
// }
//   return (
//     <div className='text-white text-center min-h-screen'>
//        {
//         swaps && swaps.length > 0 && swapCount > 0 ? 
//         (<>
//               {swaps.map((history,index)=><SwapHistoryCard key={index} history={history}/>)}
//         </>) : (<><h1>No have swap history yet.</h1></>)
//        }
//     </div>
//   )
// }

// export default SwapHistory


import React,{useContext,useState,useEffect} from 'react'
import { TransactionContext } from '../../context/TransactionContext'
import { shortenAddress } from '../../utils/shortenAddress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend'
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault'
import Loader from './Loader'

const SwapHistory = ({theme}) => {

  const {getMySwapHistory,currentAccount,swaps,swapCount} = useContext(TransactionContext)

  const [isLoading, setIsLoading] = useState(true)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchSwapsHistory = async () => {

      setTimeout(() => {
        setIsLoading(false)
      }, 2000);

      if (currentAccount) {
        try {
          await getMySwapHistory();
        } catch (err) {
          console.error("Error fetching swaps history:", err)
        }
      }
    }
    fetchSwapsHistory()
  }, [currentAccount])

  const SwapHistoryCard = ({swapHistory}) => {
    return (
      <div className='flex flex-col items-center w-full mt-3 border border-white rounded-lg shadow-md'>
        <div className='justify-start w-full mb-6 p-2'>
          <a href={`https://sepolia.etherscan.io/address/${swapHistory.trader}`} 
            target='_blank' rel='noopener noreferrer'>
            <p className='text-white text-base hover:text-yellow-300'>
              <span className='text-[#37c7da] font-bold'>Trader </span> {shortenAddress(swapHistory.trader)}
            </p>
          </a>

          {/* <a href={`https://sepolia.etherscan.io/address/${transaction.addressFrom}`} 
            target='_blank' rel='noopener noreferrer'> */}
            <p className='text-white text-base hover:text-indigo-500'>
              <span className='text-[#37c7da] font-bold'>From </span> {swapHistory.amountIn} {swapHistory.tokenIn}
            </p>
          {/* </a> */}
            <p className='text-white text-base hover:text-indigo-500'>
              <span className='text-[#37c7da] font-bold'>To </span> {swapHistory.amountOut} {swapHistory.tokenOut}
            </p>

          {/* <p className='text-white text-base'>
            <span className='text-[#37c7da] font-bold'>Value </span> {transaction.value} ETH
          </p> */}
          <p className='text-white text-base'>
            <span className='text-[#37c7da] font-bold'>Date </span> {swapHistory.timestamp}
          </p>
          
        </div>
      </div>
    )
  }

  const [currentPage, setCurrentPage] = useState(1);//number of current page
  const swapsPerPage = 6;//number of transaction in a page

  const indexOfLastTx = currentPage * swapsPerPage;//index of page last of transaction in page vd : 6
  const indexOfFirstTx = indexOfLastTx - swapsPerPage;//index of first transaction vd 6 - 6 = 0
  const currentSwaps = [...swaps].reverse().slice(indexOfFirstTx, indexOfLastTx);

  const totalPages = Math.ceil(swaps.length / swapsPerPage);

  return (
    <div className={`flex flex-col items-center justify-center gap-5
     ${windowSize.width < 1500 ? 'min-h-[60vh]' : 'min-h-[50vh]'}`}>
      
      {
        currentAccount && !isLoading ? 
        (
          <>
          <p className='text-white text-2xl'>Swap History</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {currentSwaps.map((history, i) => (
                <SwapHistoryCard key={i} swapHistory={history}/>
              ))}
            </div>

            {swaps.length > swapsPerPage && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button 
                  className="px-3 py-1 border-1 border-white text-white rounded disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={currentPage === 1}
                >
                  Previous Page
                </button>
                <span className="text-white">{currentPage} / {totalPages}</span>
                <button 
                  className="px-3 py-1 border-1 border-white text-white rounded disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next Page
                </button>
              </div>
            )}
          </>
        ) : !currentAccount && !isLoading ?
        (
          <p className='text-white text-2xl'>Please connect your wallet to get swaps history.</p>
        ):(<Loader/>)
      }
    </div>
  )
}

export default SwapHistory
