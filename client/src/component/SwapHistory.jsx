import React,{useContext,useEffect,useState} from 'react'
import { TransactionContext } from '../../context/TransactionContext';

const SwapHistory = ({theme}) => {
const {makeTransaction,getMySwapHistory,currentAccount} = useContext(TransactionContext)
const [swapHistory, setSwapHistory] = useState([])
useEffect(() => {
  const getSwapHistory = async () => {
      if(currentAccount) alert("Current Account = ''")
      setSwapHistory(await getMySwapHistory())
  }
  getSwapHistory()
}, [])

  return (
    <div className='text-white text-center min-h-screen'>
       {
        swapHistory ? (<></>) : (<><h1>No have swap history yet.</h1></>)
       }
    </div>
  )
}

export default SwapHistory