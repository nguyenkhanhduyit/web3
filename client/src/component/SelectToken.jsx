import { TransactionContext } from '../../context/TransactionContext'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useEffect,useState,useContext } from 'react';

export default function SelectToken({values,isTokenOut,isSwapIndex }) {

  const [tokenIn, setTokenIn] = useState('')
  const [tokenOut,setTokenOut] = useState('')

  const { 
         currentAccount,tokenInAddress,tokenOutAddress,setTokenInAddress,setTokenOutAddress
      } = useContext(TransactionContext)

  const handleChange = async(e) => {
    if(isTokenOut === false){
        const inSymbol = e.target.value
     if(inSymbol.length > 0 && (inSymbol !== tokenOut)){
            const token = values.filter((token)=>{if(token.symbol === e.target.value) return token})
            setTokenInAddress(token[0].tokenAddress)
            setTokenIn(inSymbol)
       }else {
            setTokenIn('')
            setTokenInAddress('')
      }
    }
    if(isTokenOut){
      const outSymbol = e.target.value
       if(outSymbol.length > 0 && (outSymbol !== tokenIn)){
            const token = values.filter((token)=>{if(token.symbol === e.target.value) return token})
            setTokenOutAddress(token[0].tokenAddress)
            setTokenOut(outSymbol)
       }else {
        setTokenOut('')
        setTokenOutAddress('')
      }
    }
  };

useEffect(() => {
  if(tokenInAddress.length > 0 && (tokenInAddress !== tokenOutAddress)){
      const token = values.filter(token => { if(token.tokenAddress == tokenInAddress) return token})
      setTokenIn(token[0].symbol)
  }
  if(tokenOutAddress.length>0 && (tokenOutAddress !== tokenInAddress)){
       const token = values.filter(token => { if(token.tokenAddress == tokenOutAddress) return token})
      setTokenOut(token[0].symbol)
  }
}, [tokenInAddress,tokenOutAddress])


  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 80 }} className='flex-1'>
        <InputLabel id={`${isTokenOut ? 'to-token-input-label':'from-token-input-label'}`} style={{color:'white'}}>{`${isTokenOut ? 'To':'From'}`}</InputLabel>
        <Select
          labelId={`${isTokenOut ? 'to-token-label':'from-token-label'}`}
          id={`${isTokenOut ? 'to-token':'from-token'}`}
          value={`${isTokenOut ? tokenOut : tokenIn ? tokenIn:'' }`}
          autoWidth
          label={`${isTokenOut ? 'To':'From'}`}
          onChange={handleChange}
          sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '& .MuiSelect-icon': {
                color: 'white',
              },
            }}
        >
          {
            values.map((token,index) => {
                return (
                <MenuItem className="text-white" value={token.symbol}>
                  {`${token.symbol} (${token.name})`}
                </MenuItem>
              )
            })
          }
        </Select>
      </FormControl>
    </div>
  );
}
