import React,{useState,useEffect,useRef} from 'react'; 
import SearchIcon from '@mui/icons-material/Search';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

export default function ModalMarket({ theme,onClose }) {

    const [query, setQuery] = useState('');
    const [tokenList, setTokenList] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const hotToken = ['Bitcoin', 'Ethereum', 'BNB','Solana','USDT'];
    const timeoutRef = useRef(null);
    const [hasAlerted, setHasAlerted] = useState(false);

    const formatNumber = (num) => {
      if (!num || isNaN(num)) return '-';
      const abs = Math.abs(num);
      if (abs >= 1e12) return (num / 1e12).toFixed(2) + 'T';
      if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (abs >= 1e3) return (num / 1e3).toFixed(2) + 'K';
      return Number(num).toFixed(2);
    };

    const fetchTokenData = async (inputNameOrSymbol) => {
      try {
        const res = await fetch(`http://localhost:5000/api/token?symbol=${inputNameOrSymbol}`);
        const data = await res.json();
        if (res.status !== 200 || !data) throw new Error();
        const cache = JSON.parse(localStorage.getItem('tokenCache') || '{}');
        cache[inputNameOrSymbol.toLowerCase()] = data;
        localStorage.setItem('tokenCache', JSON.stringify(cache));
        return {
          name: data.name,
          symbol: data.symbol,
          price: Number(data.price).toFixed(4),
          icon: data.logo,
          percent_change_24h: Number(data.percent_change_24h).toFixed(2),
          market_cap: formatNumber(data.market_cap),
          volume_24h: formatNumber(data.volume_24h)
        };
      } catch (err) {
        const cache = JSON.parse(localStorage.getItem('tokenCache') || '{}');
        const cachedData = cache[inputNameOrSymbol.toLowerCase()];
        if (!cachedData) return null;
        return {
          name: cachedData.name,
          symbol: cachedData.symbol,
          price: Number(cachedData.price).toFixed(4),
          icon: cachedData.logo,
          percent_change_24h: Number(cachedData.percent_change_24h).toFixed(2),
          market_cap: formatNumber(cachedData.market_cap),
          volume_24h: formatNumber(cachedData.volume_24h)
        };
      }
    };

    const saveToRecentSearches = (token) => {
        let updated = [token, ...recentSearches.filter(t => t.symbol !== token.symbol)];
        if (updated.length > 3) {
            updated = updated.slice(0, 3);
        }
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleSearch = async (query) => {
        if (!query) return;
        const data = await fetchTokenData(query);
        if (data) {
          saveToRecentSearches(data);
          setTokenList([data]);
        } else {
          setTokenList([]);
        }
    };

    const onSearch = (value) => {
      setQuery(value);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => handleSearch(value), 2000);
    };

    const TokenCard = ({ name, symbol, price, icon, market_cap, volume_24h, percent_change_24h }) => {
      const priceColor =
        parseFloat(percent_change_24h) > 0
          ? 'text-green-500'
          : parseFloat(percent_change_24h) < 0
            ? 'text-red-500'
            : 'text-gray-500';

      return (
        <div className={`mr-10 flex flex-row justify-between items-center w-full h-auto rounded-[7px] m-2 overflow-auto p-1 ${theme === 'dark-mode' ? 'bg-[#373b49]' : 'bg-blue-200'}`}>
          <div className='flex flex-row gap-2 items-center'>
            <img src={icon} alt="icon" className='w-8 h-8' />
            <div className='flex flex-col'>
              <p className={`font-bold ${theme === 'dark-mode' ? 'text-white' : 'text-gray-600'}`}>{name}</p>
              <p className={`text-sm ${theme === 'dark-mode' ? 'text-gray-400' : 'text-gray-900'}`}>{symbol}</p>
            </div>
          </div>
          <div className='flex flex-col'>
            <span className='text-sm'>
              <span className={`text-sm ${theme === 'dark-mode' ? 'text-gray-400' : 'text-gray-900'}`}>MCap: </span>
              <span className={`font-bold ${theme === 'dark-mode' ? 'text-white' : 'text-gray-600'}`}>${market_cap}</span>
            </span>
            <span className='text-sm'>
              <span className={`text-sm ${theme === 'dark-mode' ? 'text-gray-400' : 'text-gray-900'}`}>Vol(24h): </span>
              <span className={`font-bold ${theme === 'dark-mode' ? 'text-white' : 'text-gray-600'}`}>${volume_24h}</span>
            </span>
          </div>
          <div className='flex flex-col items-end'>
            <span className={`font-bold text-[17px] ${theme === 'dark-mode' ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              ${price}
            </span>
            <p className={`text-sm font-bold ${priceColor}`}>{percent_change_24h}%</p>
          </div>
        </div>
      );
    };

    const RecentSearch = ({ symbol, icon, onClick }) => {
      return (
        <div
          onClick={onClick}
          className={`flex flex-row items-center gap-1 px-3 py-1 mt-3 mr-2 cursor-pointer ${theme === 'dark-mode' ? 'bg-gray-700' : 'bg-blue-300'}`}
          style={{ borderRadius: '32px' }}
        >
          <img src={icon} alt="." className='w-5 h-5' />
          <span className={`font-bold ${theme === 'dark-mode' ? 'text-white' : 'text-gray-600'}`}>{symbol}</span>
        </div>
      );
    };

    useEffect(() => {
      const loadHotTokens = async () => {
        const results = await Promise.all(hotToken.map(fetchTokenData));
        const valid = results.filter(Boolean);
        setTokenList(valid);
      };
      loadHotTokens();
    }, []);

    useEffect(() => {
      const interval = setInterval(() => {
        tokenList.forEach(async (token) => {
          const latest = await fetchTokenData(token.symbol);
          if (latest) {
            setTokenList(prev =>
              prev.map(t =>
                t.symbol === token.symbol
                  ? { ...latest, prevPrice: t.price }
                  : t
              )
            );
          }
        });
      }, 90 * 1000);

      return () => clearInterval(interval);
    }, [tokenList]);

    const LoadingTokenCard = () => {
      return (
        <div className={`mr-10 flex flex-row justify-start items-center w-full h-auto rounded-[7px] m-2 overflow-auto p-1 ${theme === 'dark-mode' ? ' bg-[#eae6e800]' : ' bg-[#eae6e800]'}`}>
          <div className='flex flex-col'>
            <div className='w-[25px] h-[25px] bg-white rounded-full m-1' />
            <div className='w-[25px] h-[25px] bg-white rounded-full m-1' />
          </div>
          <div className='flex flex-col'>
            <div className='bg-white w-[20vw] h-[3vh] rounded-2xl m-1' />
            <div className='bg-white w-[12vw] h-[3vh] rounded-2xl m-1' />
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eae6e800]">
        <div className={`p-6 rounded-lg shadow-xl w-[90vw] max-w-[700px] min-h-[40vh] max-h-[80vh] overflow-y-auto relative ${theme === 'dark-mode' ? 'background-modal-dark-mode text-white' : 'bg-blue-100 text-gray-900'}`}>
          <div className={`sticky -top-6 z-20 flex justify-start items-center mb-4 ${theme === 'dark-mode' ? ' bg-[#eae6e800]' : 'bg-blue-100'}`}>
            <SearchIcon className={`size-14 flex-none ${theme === 'dark-mode' ? 'text-white' : 'text-indigo-700'}`} style={{ fontSize: '16px' }} />
            <input
              type="text"
              placeholder='What are you looking for?'
              onChange={(e) => onSearch(e.target.value)}
              className={`size-14 flex-grow  ${theme === 'dark-mode' ? 'text-gray-400 placeholder:text-gray-400' : 'text-indigo-700 placeholder:text-indigo-700'} placeholder:text-sm placeholder:font-normal rounded-full border-none text-[14px] pl-2 focus:outline-none`}
            />
            <div className={`flex justify-center items-center h-[17px] w-[17px] rounded-full ${theme === 'dark-mode' ? 'bg-gray-300' : 'bg-indigo-700'}`}>
              <button onClick={onClose} className={`text-[14px] font-bold ${theme === 'dark-mode' ? 'text-black' : 'text-white'}`}>
                ✕
              </button>
            </div>
          </div>

          <div>
            <p className={`text-sm font-bold mb-1 ${theme === 'dark-mode' ? 'text-[#A1A7BB]' : 'text-gray-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              Recent Searches
            </p>
            <div className='flex flex-row flex-wrap'>
              {recentSearches.map((item, index) => (
                <RecentSearch key={index} symbol={item.symbol} icon={item.icon} onClick={() => onSearch(item.symbol)} />
              ))}
            </div>
          </div>

          <div className='flex flex-col mt-4'>
            <p className={`text-sm font-bold ${theme === 'dark-mode' ? 'text-[#A1A7BB]' : 'text-gray-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              Trending Coin
              <LocalFireDepartmentIcon className='text-red-600 ml-1' />
            </p>
          </div>

          <div className="flex flex-col">
            {tokenList.length === 0 ? (
              <>
                <LoadingTokenCard />
                <LoadingTokenCard />
              </>
            ) : (
              tokenList.map((token, idx) => (
                <TokenCard key={idx} {...token} />
              ))
            )}
          </div>
        </div>
      </div>
    );
}
