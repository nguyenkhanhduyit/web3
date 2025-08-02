import { TransactionContext } from '../../context/TransactionContext'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useEffect,useState,useContext } from 'react';

export default function SelectToken({values,isTokenOut}) {

  const { 
         currentAccount,tokenInAddress,tokenOutAddress,setTokenInAddress,setTokenOutAddress
      } = useContext(TransactionContext)

  const[tokenIn,setTokenIn] = useState('')
  const[tokenOut,setTokenOut] = useState('')

useEffect(
  () =>{
    setTokenIn(values.find((token)=> token.tokenAddress === tokenInAddress)?.symbol)
    setTokenOut(values.find((token)=> token.tokenAddress === tokenOutAddress)?.symbol)
},[tokenInAddress,tokenOutAddress])

  const handleChange = async(e) => {
    if(isTokenOut){//token out
      if(e.target.value){
          const token = values.filter((token)=>{if(token.symbol === e.target.value) return token})
          if(token[0].tokenAddress === tokenInAddress){
              setTokenOutAddress("")
              setTokenOut("")
          }
          else{
             setTokenOutAddress(token[0].tokenAddress)
             setTokenOut(token[0].symbol)
          }
        }
    }
    if(!isTokenOut){//token in
       if(e.target.value){
          const token = values.filter((token)=>{if(token.symbol === e.target.value) return token})
          if(token[0].tokenAddress === tokenOutAddress)
             {
                setTokenInAddress("")
                setTokenIn("")
          }
          else
            {  
              setTokenInAddress(token[0].tokenAddress) 
              setTokenIn(token[0].symbol)
            }
    }
  }
}

  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 80 }} className='flex-1'>
        <InputLabel id={`${isTokenOut ? 'to-token-input-label':'from-token-input-label'}`} style={{color:'white'}}>
        {`${isTokenOut ? 'To':'From'}`}</InputLabel>
        <Select
          labelId={`${isTokenOut ? 'to-token-label':'from-token-label'}`}
          id={`${isTokenOut ? 'to-token':'from-token'}`}
          value={`${isTokenOut ? tokenOut : tokenIn ? tokenIn : '' }`}
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
            values.filter((token) => 
                token.tokenAddress !== (isTokenOut ? tokenInAddress : tokenOutAddress)
            ).map((token,index)=>{
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