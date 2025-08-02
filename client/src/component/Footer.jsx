import React from 'react'
import EmailIcon from '@mui/icons-material/Email';

//this is code for Footer
const Footer = ({theme}) => {
  return (
   <div className="pb-10  w-full flex md:justify-center justify-between items-center flex-col p-4">
    <div className="sm:w-[90%] w-full h-[0.25px] bg-gray-400 mt-5 " />
   <div className="sm:w-[90%] w-full flex justify-between items-center mt-3 pt-10">
  <p className={`text-right text-xs ${theme === 'dark-mode'? 'text-white':'text-pink-600'}`}>All rights reserved</p>
 <a
  href="https://mail.google.com/mail/?view=cm&to=nguyenkhanhduy.dev@gmail.com&su=Contact from Web3 Blockchain&body=Hi you, I see your contact in Web3 Blokchain, I want to chat with you."
  target="_blank"
  rel="noopener noreferrer"
  className={`text-left text-xs mr-10 flex items-center gap-1 ${theme === 'dark-mode'? 'text-white':'text-pink-600'}`}
>
  <EmailIcon fontSize="small" />
  nguyenkhanhduy.dev@gmail.com
</a>

</div>

  </div>
  )
}

export default Footer