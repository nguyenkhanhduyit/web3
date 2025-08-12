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
function formatPrice(price) {
      if (price === null || price === undefined || isNaN(price)) return '-';

      const num = Number(price);
      const parts = num.toFixed(4).split('.');
      const intPart = Number(parts[0]).toLocaleString('en-US');
      return `${intPart}.${parts[1]}`;
    }
    // Fetch tất cả token và lưu vào cache
    const fetchAllTokens = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/tokens/all');
        const data = await res.json();
        if (res.status !== 200 || !data.success) throw new Error();
        
        // Lưu vào localStorage với timestamp
        const cacheData = {
          data: data.data,
          timestamp: data.timestamp,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('allTokensCache', JSON.stringify(cacheData));
        
        console.log(`Cached ${Object.keys(data.data).length} tokens`);
        return data.data;
      } catch (err) {
        console.error('Error fetching all tokens:', err);
        return null;
      }
    };

const getTokenFromCache = (inputNameOrSymbol) => {
  try {
    const cacheData = JSON.parse(localStorage.getItem('allTokensCache') || '{}');
    const tokens = cacheData.data || {};

    // Tìm token khớp symbol hoặc name (không phân biệt hoa/thường)
    const tokenData = Object.values(tokens).find(token =>
      token.symbol.toLowerCase() === inputNameOrSymbol.toLowerCase() ||
      token.name.toLowerCase() === inputNameOrSymbol.toLowerCase()
    );

    if (!tokenData) return null;

    return {
      name: tokenData.name,
      symbol: tokenData.symbol,
      price: formatPrice(tokenData.price),
      icon: tokenData.logo,
      percent_change_24h: Number(tokenData.percent_change_24h).toFixed(2),
      market_cap: formatNumber(tokenData.market_cap),
      volume_24h: formatNumber(tokenData.volume_24h)
    };
  } catch (err) {
    console.error('Error getting token from cache:', err);
    return null;
  }
};

const searchTokensInCache = (query) => {
  try {
    const cacheData = JSON.parse(localStorage.getItem('allTokensCache') || '{}');
    const tokens = cacheData.data || {};
    const results = [];

    const queryLower = query.toLowerCase();
    Object.values(tokens).forEach(token => {
      if (
        token.symbol.toLowerCase().includes(queryLower) ||
        token.name.toLowerCase().includes(queryLower)
      ) {
        results.push({
          name: token.name,
          symbol: token.symbol,
          price: formatPrice(token.price),
          icon: token.logo,
          percent_change_24h: Number(token.percent_change_24h).toFixed(2),
          market_cap: formatNumber(token.market_cap),
          volume_24h: formatNumber(token.volume_24h)
        });
      }
    });

    return results.slice(0, 10); 
  } catch (err) {
    console.error('Error searching tokens:', err);
    return [];
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
        if (!query) {
          // Nếu không có query, hiển thị hot tokens từ cache
          const hotTokensFromCache = hotToken.map(symbol => getTokenFromCache(symbol)).filter(Boolean);
          setTokenList(hotTokensFromCache);
          return;
        }
        
        // Tìm kiếm trong cache
        const searchResults = searchTokensInCache(query);
        if (searchResults.length > 0) {
          saveToRecentSearches(searchResults[0]);
          setTokenList(searchResults);
        } else {
          setTokenList([]);
        }
    };

    const onSearch = (value) => {
      setQuery(value);
      clearTimeout(timeoutRef.current);
      
      if (value.trim()) {
        // Tìm kiếm ngay lập tức nếu có query
        timeoutRef.current = setTimeout(() => handleSearch(value), 500);
      } else {
        // Nếu không có query, hiển thị hot tokens
        handleSearch('');
      }
    };

    const TokenCard = ({ name, symbol, price, icon, market_cap, volume_24h, percent_change_24h }) => {
      const priceColor =
        parseFloat(percent_change_24h) > 0
          ? 'text-green-500'
          : parseFloat(percent_change_24h) < 0
            ? 'text-red-500'
            : 'text-gray-500';

      return (
        <div className={`mr-10 flex flex-row justify-between items-center w-full h-auto rounded-[7px] m-2 overflow-auto p-1 ${theme === 'dark-mode' ? 'bg-[#eae6e800]' : 'bg-blue-200'}`}>
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
          className={`flex flex-row items-center gap-1 px-3 py-1 mt-3 mr-2 cursor-pointer ${theme === 'dark-mode' ? 'bg-[#eae6e800]' : 'bg-blue-300'}`}
          style={{ borderRadius: '32px' }}
        >
          <img src={icon} alt="." className='w-5 h-5' />
          <span className={`font-bold ${theme === 'dark-mode' ? 'text-white' : 'text-gray-600'}`}>{symbol}</span>
        </div>
      );
    };

    // Khởi tạo cache và load hot tokens
    useEffect(() => {
      const initializeCache = async () => {
        // Kiểm tra xem cache có tồn tại và còn mới không (dưới 1 phút)
        const cacheData = JSON.parse(localStorage.getItem('allTokensCache') || '{}');
        const cacheAge = cacheData.lastUpdated ? 
          (new Date() - new Date(cacheData.lastUpdated)) / 1000 / 60 : Infinity;
        
        if (!cacheData.data || cacheAge > 1) {
          // Cache không tồn tại hoặc quá cũ, fetch mới
          console.log('Fetching fresh token data...');
          await fetchAllTokens();
        } else {
          console.log('Using cached token data');
        }
        
        // Load hot tokens từ cache
        const hotTokensFromCache = hotToken.map(symbol => getTokenFromCache(symbol)).filter(Boolean);
        setTokenList(hotTokensFromCache);
      };
      
      initializeCache();
    }, []);

    // Cập nhật cache mỗi phút
    useEffect(() => {
      const updateCacheInterval = setInterval(async () => {
        console.log('Updating token cache...');
        await fetchAllTokens();
        
        // Cập nhật UI nếu đang hiển thị hot tokens
        if (!query) {
          const hotTokensFromCache = hotToken.map(symbol => getTokenFromCache(symbol)).filter(Boolean);
          setTokenList(hotTokensFromCache);
        }
      }, 60 * 1000); // 1 phút

      return () => clearInterval(updateCacheInterval);
    }, [query]);

    // Load recent searches từ localStorage
    useEffect(() => {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        try {
          const parsed = JSON.parse(savedSearches);
          setRecentSearches(parsed);
        } catch (err) {
          console.error('Error loading recent searches:', err);
        }
      }
    }, []);

    const LoadingTokenCard = () => {
      return (
        <div className={`mr-10 flex flex-row justify-start items-center w-full h-auto rounded-[7px] m-2 overflow-auto p-1 ${theme === 'dark-mode' ? 'bg-[#272a34]' : 'bg-blue-200'}`}>
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
          <div className={`sticky -top-6 z-20 flex justify-start items-center mb-4 ${theme === 'dark-mode' ? 'bg-[#eae6e800]' : 'bg-blue-100'}`}>
            <SearchIcon className={`size-14 flex-none ${theme === 'dark-mode' ? 'text-white' : 'text-indigo-700'}`} style={{ fontSize: '16px' }} />
            <input
              type="text"
              placeholder='What are you looking for?'
              onChange={(e) => onSearch(e.target.value)}
              className={`size-14 flex-grow ${theme === 'dark-mode' ? 'text-gray-400 placeholder:text-gray-400' : 'text-indigo-700 placeholder:text-indigo-700'} placeholder:text-sm placeholder:font-normal rounded-full border-none text-[14px] pl-2 focus:outline-none`}
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
                <RecentSearch 
                  key={index} 
                  symbol={item.symbol} 
                  icon={item.icon} 
                  onClick={() => {
                    setQuery(item.symbol);
                    handleSearch(item.symbol);
                  }} 
                />
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
