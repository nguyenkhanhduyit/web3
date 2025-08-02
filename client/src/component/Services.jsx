import React from 'react'
import {BsShieldFillCheck} from 'react-icons/bs'
import {BiSearchAlt} from 'react-icons/bi'
import {RiHeart2Fill} from 'react-icons/ri'

const ServiceCard = ({theme,color,title,icon,subtitle}) => {
 
   return(
     <div className={`flex flex-row justify-start items-center p-3 m-2 cursor-pointer hover:shadow-xl ${theme === 'dark-mode'? 'white-glassmorphism-dark-mode ':'bg-slate-300 white-glassmorphism-light-mode'}`}>
        <div className={`w-10 h-10 rounded-full flex justify-center items-center ${color}`}>
            {icon}
        </div>
        <div className='ml-5 flex flex-col flex-1'>
            <h1 className={`mt-2 text-lg ${theme === 'dark-mode'? 'text-white':'text-indigo-700'}`}>{title}</h1>
            <p className={`mt-2 text-sm md:w-9/12 ${theme === 'dark-mode'? 'text-white':'text-gray-500'}`}>{subtitle}</p>
        </div>
    </div>
   )
}

const Services = ({theme}) => {
  return (
    <div className='flex flex-col md:flex-row w-full justify-center items-center'>
      <div className='flex mf:flex-row flex-col items-center justify-between md:p-20 py-12 px-4'>
        <div className='flex-1 flex flex-col justify-start items-start '>
            <h1 className={`text-3xl md:text-5xl py-2 text-gradient ${theme === 'dark-mode'? 'text-white':'text-indigo-700'}`}>
              Services that we <br />
              continue to improve
            </h1>
        </div>
      </div>
      <div className='flex-1 flex flex-col justify-start items-center'>
        <ServiceCard theme={theme} color="bg-[#2952e3]" title="Security Guaranteed"
         icon={<BsShieldFillCheck fontSize={21} className='text-white'/>}
        subtitle="Security guaranteed. We always maintain privacy and maintain quality of our products." 
        />
         <ServiceCard theme={theme} color="bg-[#8945f8]" title="Best exchange rates"
         icon={<BiSearchAlt fontSize={21} className='text-white'/>}
        subtitle="Security guaranteed. We always maintain privacy and maintain quality of our products." 
        />
         <ServiceCard theme={theme} color="bg-[#f84550]" title="Fastest transaction"
         icon={<RiHeart2Fill fontSize={21} className='text-white'/>}
        subtitle="Security guaranteed. We always maintain privacy and maintain quality of our products." 
        />
      </div>
    </div>
  )
}

export default Services