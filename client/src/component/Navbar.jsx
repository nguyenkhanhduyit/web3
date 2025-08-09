import React, { useState } from 'react';
import { HiMenuAlt4 } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";
import LightModeIcon from '@mui/icons-material/LightMode';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import ModalMarket from './ModalMarket'
import ModalTransaction from './ModalTransaction';
import logo from "../../images/logo.png";

// Component cho từng item trong navbar
const NavBarItem = ({ title, to, onClick, classProps }) => (
  <li className={`mx-4 cursor-pointer ${classProps}`} onClick={onClick}>
    {onClick ? (
      <span>{title}</span> 
    ) : (
      <Link to={to}>{title}</Link>
    )}
  </li>
);

const Navbar = ({ theme, setTheme }) => {
  const [showModalMarket, setShowModalMarket] = useState(false);
  const [showModalTransaction, setShowModalTransaction] = useState(false);
  const [toggleMenu, setToggleMenu] = useState(false);

  const menu = [
    { title: 'Home', to: '/', onClick: () => { setToggleMenu(false);window.location.replace('/')} },
    { title: 'Market', to: '',  onClick: () => {setShowModalMarket(true); setToggleMenu(false) } },
    { title: 'Transaction', to: '',onClick: () => {setShowModalTransaction(true); setToggleMenu(false) } },
    { title: 'Enhanced Transactions', to: '/transactions', onClick:  () => {setToggleMenu(false);window.location.replace('/transactions')} },
    { title: 'Transaction History', to: '/history', onClick:  () => {setToggleMenu(false);window.location.replace('/history')} },
    { title: 'Faucet', to: '/faucet', onClick:  () => {window.location.replace('/faucet')} },
    { title: 'Tutorial', to: '/tutorial', onClick:  () => {window.location.replace('/tutorial')} },
  ];

  const toggleTheme = () => {
    const newTheme = theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    setToggleMenu(false)
    setTheme(newTheme);
  };

  return (
    <>
      <nav className='w-full flex md:justify-center justify-between items-center p-4'>
        <div className='md:flex-[0.5] flex-initial justify-center items-center'>
          <img src={logo} alt="logo" className='w-32 cursor-pointer' />
        </div>

        <ul className={`md:flex hidden list-none flex-row justify-between items-center flex-initial ${theme === 'dark-mode'?'text-white font-bold':'text-indigo-700 font-bold'}`}>
          {menu.map((item, index) => (
            <NavBarItem
              key={item.title + index}
              title={item.title}
              to={item.to}
              onClick={item.onClick}
            />
          ))}
          <li className="ml-4 cursor-pointer" onClick={toggleTheme}>
            {theme === "dark-mode" ? <LightModeIcon /> : <Brightness4Icon />}
          </li>
        </ul>

        <div className='flex relative'>
          {toggleMenu ? (
            <AiOutlineClose fontSize={28} className='text-white md:hidden cursor-pointer' onClick={() => setToggleMenu(false)} />
          ) : (
            <HiMenuAlt4 fontSize={28} className={`${theme==='dark-mode'?'text-white':'text-indigo-700'} md:hidden cursor-pointer`} onClick={() => setToggleMenu(true)} />
          )}

          {toggleMenu && (
            <ul className={`z-10 fixed top-0 -right-2 p-3 w-[70vw] h-screen shadow-2xl md:hidden list-none
              flex flex-col justify-start items-end rounded-md blue-glassmorphism  animate-slide-in ${theme === 'dark-mode'?'text-white':'text-indigo-700'}`}>
              <li className='text-xl w-full my-2'>
                <AiOutlineClose onClick={() => setToggleMenu(false)} />
              </li>
              {menu.map((item, index) => (
                <NavBarItem
                  key={item.title + index}
                  title={item.title}
                  to={item.to}
                  onClick={item.onClick}
                  classProps="my-2 text-lg"
                />
              ))}
              <li className="mt-4 cursor-pointer" onClick={toggleTheme}>
                {theme === "dark-mode" ? <LightModeIcon /> : <Brightness4Icon />}
              </li>
            </ul>
          )}
        </div>
      </nav>

      {showModalMarket && (
        <ModalMarket theme={theme} onClose={() => setShowModalMarket(false)} />
      )}
       {showModalTransaction && (
        <ModalTransaction theme={theme} onClose={() => setShowModalTransaction(false)}/>
      )}
    </>
  );
};

export default Navbar;
