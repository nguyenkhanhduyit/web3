import React,{useContext} from 'react'
import { TransactionContext } from '../../context/TransactionContext';

const ModalTransactionHistory = ({theme}) => {
const {makeTransaction,getMyTransactions} = useContext(TransactionContext)

  return (
    <div>
       Hihi
    </div>
  )
}

export default ModalTransactionHistory