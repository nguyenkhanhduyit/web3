import React,{useContext} from 'react'
import Loader from './Loader'
import { TransactionContext } from '../../context/TransactionContext'

const MakeTransaction = () => {
     const { 
               formData, 
               setFormData,
               handleFormDataChange,
               makeTransaction,isLoading
          } = useContext(TransactionContext)

    const handleSubmit = (e) => {
          const {addressTo,value} = formData
          console.log(formData)
          e.preventDefault()
          if(!addressTo || !value) return
          makeTransaction();
      }
  return (
            <div className='p-5 sm:w-96 w-full xl:mt-5 flex flex-col justify-start items-center blue-glassmorphism'>
                  <input type="text" placeholder='Enter address' name='addressTo' onChange={(e) =>handleFormDataChange(e,"addressTo")}  className='my-2 w-full rounded-sm p-2 outline-none bg-transparent text-white border-none text-sm white-glassmorphism' />
                  <input type="number" min={0.005} max={0.01} step='0.0001' placeholder='Enter value between 0.005 - 0.01' name='value' onChange={(e)=>handleFormDataChange(e,"value")}  className='my-2 w-full rounded-sm p-2 outline-none bg-transparent text-white border-none text-sm white-glassmorphism' />
                 
                  <div className='h-[1px] w-full bg-gray-400 my-2'/>
                  {
                    isLoading ? (
                      <>
                      <Loader/>
                      </>
                    ) : (
                      <button type='button' onClick={handleSubmit}
                      className='text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] rounded-full cursor-pointer hover:bg-blue-500'>
                          Send now
                      </button>
                    )
                  }
                </div>
  )
}

export default MakeTransaction