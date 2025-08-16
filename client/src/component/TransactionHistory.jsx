import React,{useContext,useState,useEffect} from 'react'
import { TransactionContext } from '../../context/TransactionContext'
import { shortenAddress } from '../../utils/shortenAddress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend'
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault'
import Loader from './Loader'

const TransactionHistory = ({theme}) => {

  const {currentAccount, getMyTransactions,transactions} = useContext(TransactionContext)

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
    const fetchTransactions = async () => {

      setTimeout(() => {
        setIsLoading(false)
      }, 2000);

      if (currentAccount) {
        try {
          await getMyTransactions();
        } catch (err) {
          console.error("Error fetching transactions:", err)
        }
      }
    }
    fetchTransactions()
  }, [currentAccount])

  const TransactionCard = ({transaction}) => {
    return (
      <div className='flex flex-col items-center w-full mt-3 border border-white rounded-lg shadow-md'>
        <div className='justify-start w-full mb-6 p-2'>
          <a href={`https://sepolia.etherscan.io/address/${transaction.addressTo}`} 
            target='_blank' rel='noopener noreferrer'>
            <p className='text-white text-base hover:text-yellow-300'>
              <span className='text-[#37c7da] font-bold'>To </span> {shortenAddress(transaction.addressTo)}
            </p>
          </a>

          <a href={`https://sepolia.etherscan.io/address/${transaction.addressFrom}`} 
            target='_blank' rel='noopener noreferrer'>
            <p className='text-white text-base hover:text-indigo-500'>
              <span className='text-[#37c7da] font-bold'>From </span> {shortenAddress(transaction.addressFrom)}
            </p>
          </a>

          <p className='text-white text-base'>
            <span className='text-[#37c7da] font-bold'>Value </span> {transaction.value} ETH
          </p>
          <p className='text-white text-base'>
            <span className='text-[#37c7da] font-bold'>Date </span> {transaction.timestamp}
          </p>
          <p className='text-white text-base'> 
            {
              transaction.state === 'Success' ? (
                <>
                  <CheckCircleIcon className='text-green-500'/>
                  <span className='p-2'>Success</span>
                </>
              ) : transaction.state === 'Pending' ? (
                <>
                  <ScheduleSendIcon className='text-blue-500'/>
                  <span className='p-2'>Pending</span>
                </>
              ) : transaction.state === 'Failed' ? (
                <>
                  <DisabledByDefaultIcon className='text-red-500'/>
                  <span className='p-2'>Failed</span>
                </>
              ) : (
                <span className='p-2'>Null</span>
              )
            }
          </p>
        </div>
      </div>
    )
  }

  const [currentPage, setCurrentPage] = useState(1);//number of current page
  const transactionsPerPage = 6;//number of transaction in a page

  const indexOfLastTx = currentPage * transactionsPerPage;//index of page last of transaction in page vd : 6
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;//index of first transaction vd 6 - 6 = 0
  const currentTransactions = [...transactions].reverse().slice(indexOfFirstTx, indexOfLastTx);

  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  return (
    <div className={`flex flex-col items-center justify-center gap-5
     ${windowSize.width < 1500 ? 'min-h-[60vh]' : 'min-h-[50vh]'}`}>
      
      {
        currentAccount && !isLoading ? 
        (
          <>
          <p className='text-white text-2xl'>Transaction History</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {currentTransactions.map((transaction, i) => (
                <TransactionCard key={i} transaction={transaction}/>
              ))}
            </div>

            {transactions.length > transactionsPerPage && (
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
          <p className='text-white text-2xl'>Please connect your wallet to get transaction history.</p>
        ):(<Loader/>)
      }
    </div>
  )
}

export default TransactionHistory
