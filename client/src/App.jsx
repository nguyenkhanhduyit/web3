import { useEffect, useState } from 'react';
import { Navbar, Footer, Welcome, Services } from "./component";
import TransactionHistory from './component/TransactionHistory';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from './component/NotFound'; 
import Faucet from './component/Faucet';

function App() {

    const [theme, setTheme] = useState(
      () => {
        const temp = localStorage.getItem("theme");
        if (temp === "light-mode" || temp === "dark-mode") 
            return temp;
        return "dark-mode"; 
        }
      )

  const saveTheme = (n) => {
    setTheme(n)
    localStorage.setItem("theme",n)
  }

useEffect(()=>{
  const checkTheme = localStorage.getItem('theme')
  if(!checkTheme) localStorage.setItem("theme","dark-mode")
},[])

  return (
    <BrowserRouter>
      <div className={`${theme === "dark-mode" ? "dark-mode" : "light-mode"} flex flex-col`}>
        <Navbar theme={theme} setTheme={saveTheme} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <>
              <Welcome theme={theme}/>
              <Services theme={theme}/>
              </>
            } />
            <Route path="/history" element={<TransactionHistory theme={theme}/>} />
            <Route path='/faucet' element={<Faucet theme={theme}/>}/>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer theme={theme}/>
      </div>
    </BrowserRouter>
  );
}

export default App;
