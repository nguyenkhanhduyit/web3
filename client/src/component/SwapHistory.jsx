import React,{useContext,useEffect} from 'react'
import { TransactionContext } from '../../context/TransactionContext';

const SwapHistory = ({theme}) => {
const {makeTransaction,getMySwapCount} = useContext(TransactionContext)

useEffect(() => {
  const getSwapCount = async () => {
      const count = await getMySwapCount()
      await count
  }
  getSwapCount()
}, [])

  return (
    <div className='text-white'>
       Hihi
    </div>
  )
}

export default SwapHistory