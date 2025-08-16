import { useEffect, useState } from 'react';
import { Navbar, Footer, Welcome, Services } from "./component";
import TransactionHistory from './component/TransactionHistory';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from './component/NotFound'; 
import Faucet from './component/Faucet';
import SwapHistory from './component/SwapHistory';

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

useEffect(() => {
  document.body.classList.remove("dark-mode", "light-mode");
  document.body.classList.add(theme);
}, [theme]);

return (
<BrowserRouter>
  <div className={`flex flex-col`}>
    <Navbar theme={theme} setTheme={saveTheme} />
    <main className="flex-grow">
      <Routes>
        <Route path="/" element={
          <>
          <Welcome theme={theme}/>
          <Services theme={theme}/>
          </>
        } />
        <Route path='/faucet' element={<Faucet theme={theme}/>}/>
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer theme={theme}/>
  </div>
</BrowserRouter>
);
}

export default App;
