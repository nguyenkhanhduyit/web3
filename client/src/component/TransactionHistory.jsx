import React,{useContext} from 'react'
import { TransactionContext } from '../../context/TransactionContext'
import { shortenAddress } from '../../utils/shortenAddress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend'
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault'

const TransactionHistory = ({theme}) => {

  const TransactionCard = ({addressTo,addressFrom, timestamp, state,value}) => {
    return (
        <div className='bg-[#181918] border-1 border-white m-4 flex flex-1 flex-col p-3 rounded-md hover:shadow-2xl 2xl:min-w-[450px] 2xl:max-w-[500px] sm:min-w-[270px] sm:max-w-[300px]'>
            <div className='flex flex-col items-center w-full mt-3 '>
                <div className='justify-start w-full mb-6 p-2'>
                   <a href={`https://sepolia.etherscan.io/address/${addressFrom}`} 
                   target='_blank' rel='noopener noopener'>
                      <p className='text-white text-base hover:text-yellow-300'>
                        <span className='text-[#37c7da] font-bold'>From : </span> {shortenAddress(addressFrom)}
                      </p>
                   </a>

                    <a href={`https://sepolia.etherscan.io/address/${addressTo}`} 
                   target='_blank' rel='noopener noopener'>
                      <p className='text-white text-base hover:text-indigo-500'>
                        <span className='text-[#37c7da] font-bold'>To : </span> {shortenAddress(addressTo)}
                      </p>
                   </a>
                    <p className='text-white text-base'>
                        <span className='text-[#37c7da] font-bold'>Value : </span>  {value} ETH
                      </p>
                       <p className='text-white text-base'>
                         <span className='text-[#37c7da] font-bold'>Date : </span>  {timestamp} 
                      </p>
                       <p className='text-white text-base'>

                          <span>
                            {
                              state === 'Success' ? (
                                <>
                                  <CheckCircleIcon className='text-green-500'/>
                                  <span className='p-2'>Success</span>
                                </>
                              ) : state === 'Pending' ? (
                               <>
                                   <ScheduleSendIcon className='text-blue-500'/>
                                  <span className='p-2'>Pending</span>
                                </>
                              ) : state === 'Failed' ?(
                              <>
                                    <DisabledByDefaultIcon className='text-red-500'/>
                                    <span className='p-2'>Failed</span>
                              </>) : (
                                <>
                                <span className='p-2'>Null</span>
                                </>
                              )
                            }
                          </span>
                      </p>
                     
                      {/* <div className='bg-black p-3 px-5 w-max rounded-3xl -mt-5 shadow-2xl'>
                          <p className='text-[#37c7da] font-bold'>{timestamp}</p>
                      </div> */}

                </div>
            </div>
        </div>
    )
  }
  //take current account
  const {currentAccount, transactions} = useContext(TransactionContext)
  return (
    <div className='flex w-full justify-center items-center 2xl:px-20 '>
      <div className='flex flex-col md:p-12 py-12 px-4 '>
        {
          currentAccount ? 
          (<>
            <h3 className='text-white text-center text-3xl my-2 '>
                Transaction History
            </h3>

             <div className='flex flex-wrap justify-center items-center mt-10'>
            {
             transactions.reverse().map((transaction,i) => ( <TransactionCard key={i} {...transaction}/>))
            }
        </div>

          </>):
          (
          <>
           <h3 className='text-white text-center text-3xl my-2 '>
               Connect your account to see latest transaction
            </h3>
          </>
          )
        }
      </div>
    </div>
  )
}

export default TransactionHistory