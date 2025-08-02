import { useState } from 'react';
import { Navbar, Footer, Welcome, Services } from "./component";
import TransactionHistory from './component/TransactionHistory';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from './component/NotFound'; 

function App() {

    const [theme, setTheme] = useState(
      () => {
        const temp = localStorage.getItem("theme");
        if (temp === "light-mode" || temp === "dark-mode") {
            return temp;
        }
        return "dark-mode"; 
        }
      )

  const saveTheme = (n) => {
    setTheme(n)
    localStorage.setItem("theme",n)
  }

  return (
    <BrowserRouter>
      <div className={`${theme === "dark-mode" ? "dark-mode" : "light-mode"} flex flex-col`}>
        <Navbar theme={theme} setTheme={saveTheme} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<><Welcome /><Services theme={theme}/></>} />
            <Route path="/history" element={<TransactionHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer theme={theme}/>
      </div>
    </BrowserRouter>
  );
}

export default App;
