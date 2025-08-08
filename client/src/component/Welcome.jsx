import React, { useState, useContext } from 'react' 
import { SiEthereum } from 'react-icons/si'
import { BsInfoCircle } from 'react-icons/bs'
import LogoutIcon from '@mui/icons-material/Logout';

import { TransactionContext } from '../../context/TransactionContext'

import { shortenAddress } from '../../utils/shortenAddress'
//this is code for welcome 

const Welcome = () => {
  const theme = localStorage.getItem('theme')
  const { 
          handleLogin,handleLogout,
          currentAccount,
     } = useContext(TransactionContext)

  const commonStyles = "min-h-[70px] sm:px-0 px-2 sm:min-w-[120px] flex justify-center items-center border-[0.5px] border-gray-400 text-sm "


  return (
    <div className='flex w-full justify-center items-center'>
        <div className='flex md:flex-row flex-col items-start justify-between md:p-20 py-12 px-4'>
            <div className='flex flex-1 justify-start flex-col mf:mr-10'>
                <h1 className={`text-3xl sm:text-5xl py-1 ${theme === 'dark-mode' ? ' text-white text-gradient-dark' : 'text-gray-800' }`}>Send crypto <br /> across the world</h1>
            <p className={`text-left mt-5 md:9/12 w-11/12 text-base ${theme === 'dark-mode' ? 'text-white font-light ':'text-gray-700'}`}>
              Explore the crypto world. Buy and sell cryptocurrencies easily on DIT Web 3.
            </p>
           {
            !currentAccount &&  
            (
              <button type="button" onClick={handleLogin}
              className={`flex flex-row justify-center items-center my-5
                py-3 rounded-full cursor-pointer ${theme === 'dark-mode' ? 'bg-[#2952e3] hover:bg-[#2546bd]':'bg-indigo-500 hover:bg-indigo-400'}`}>
              <p className='text-white text-base font-semibold'>
                Connect Wallet
                </p>
            </button>
            )
           }

            <div className='grid sm:grid-cols-3 grid-cols-2 w-full mt-10'>
                <div className={`rounded-tl-2xl ${commonStyles} ${theme === 'dark-mode'? 'font-light text-white':'text-black'}`}>
                  Reliability
                </div>
                <div className={`${commonStyles} ${theme === 'dark-mode'? 'font-light text-white':'text-black'}` }>
                    Security
                </div>
                 <div className={`rounded-tr-2xl ${commonStyles} ${theme === 'dark-mode'? 'font-light text-white':'text-black'} `}>
                    Ethereum
                </div>
                 <div className={`rounded-bl-2xl ${commonStyles} ${theme === 'dark-mode'? 'font-light text-white':'text-black'}`}>
                  Web 3.0
                </div>
                 <div className={` ${commonStyles} ${theme === 'dark-mode'? 'font-light text-white':'text-black'}` }>
                  Low fee
                </div>
                 <div className={`rounded-br-2xl ${commonStyles} ${theme === 'dark-mode'? 'font-light text-white':'text-black'}`}>
                  Blockchain
                </div>
            </div>
            </div>  

            <div className='flex flex-1 flex-col items-center justify-start w-full xl:ml-10 md:mt-0 mt-10'>
                <div className='p-3 justify-end items-start flex-col rounded-xl h-40 sm:w-72 w-full my-5 eth-card white-glassmorphism'>
                      <div className='flex justify-between flex-col w-full h-full'>
                          <div className='flex justify-between items-start '>
                                <div className='w-10 h-10 rounded-full border-2 border-white flex justify-center items-center'>
                                    <SiEthereum fontSize={21} color='#ffff'/>
                                </div>
                                    <BsInfoCircle fontSize={17} color='#ffff' className='cursor-pointer'/>
                          </div>
                                <div>
                                  <p className='text-white font-bold text-sm '>
                                       {currentAccount?
                                       (<>{shortenAddress(currentAccount)} <LogoutIcon onClick={handleLogout}/> </>):
                                       (<><span>No address yet</span></>)}
                                  </p>
                                   <p className='text-white font-bold text-lg mt-1'>
                                        Ethereum 
                                  </p>
                                </div>
                      </div>
                </div>
                
            </div>
        </div>
    </div>
  )
}

export default Welcome