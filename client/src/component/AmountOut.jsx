// ✅ AmountOut.jsx
import React, { useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const AmountOut = ({ onChange, listToken }) => {
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState('ETH');

  const handleSelect = (tokenSymbol) => {
    setSelected(tokenSymbol);
    setShowList(false);
    onChange(tokenSymbol);
  };

  return (
    <div className="flex flex-col">
      <div className="bg-gray-700 p-3 rounded-[15px] w-[30vw] flex flex-row justify-between">
        <input
          type="number"
          className="w-[50%] bg-gray-700 placeholder:font-bold placeholder:text-gray-100"
          placeholder="0.0"
          onChange={() => {}}
        />
        <div className="relative rounded-2xl bg-gray-600 p-2" onClick={() => setShowList((prev) => !prev)}>
          <button className="font-bold">
            {selected}
            <KeyboardArrowDownIcon
              className={`w-4 h-4 object-center ml-2 ${showList ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>
          {showList && (
            <ul className="absolute bg-white text-black p-2 rounded mt-1 z-10">
              {listToken.map(({ symbol }) => (
                <li key={symbol} className="cursor-pointer" onClick={() => handleSelect(symbol)}>
                  {symbol}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmountOut;