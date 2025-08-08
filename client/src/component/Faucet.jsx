import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';


const Faucet = ({theme}) => {

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;

    const MenuProps = {
        PaperProps: {
            style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
                },
                },
        }
    
    const names = [
        'Bitcoin (BTC)',
        'Ethereum (ETH)',
        'Tether USD (USDT)',
    ]


    const [personName, setPersonName] = React.useState('');

    const handleChange = (event) => {
      const value = event.target.value
      setPersonName(value)
    }

  return (
    <>
         <div className="flex flex-col gap-10 p-4 shadow-lg text-white lg:max-w-[50vw]  2xl:lg:max-w-[50vw] lg:mx-auto 2xl:mx-auto">
               
                <h1 className="text-3xl text-white">DuyIT Faucet </h1>
                <p className='text-15px text-left break-words max-w-[500px] w-full'>
                Get free tokens in Sepolia network sent directly to your wallet. 
                Brought to you by DIT Web3.
                </p>
               
                <FormControl sx={{ }}>
                    <InputLabel id="token-label" sx={{ color: 'white' }}>
                        Token Name
                    </InputLabel>
                    <Select
                            labelId="token-label"
                            id="token-select"
                            value={personName}
                            onChange={handleChange}
                            input={<OutlinedInput label="Token Name" />}
                            MenuProps={MenuProps}
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
                            {names.map((name) => (
                                <MenuItem key={name} value={name}>
                                {name}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
                <Box component="form" sx={{ }} autoComplete="off">
                <TextField
                    fullWidth
                    id="amount"
                    label="Wallet address"
                    defaultValue=""
                    placeholder="Wallet address"
                sx={{
                    '& .MuiInputLabel-root': {
                    color: 'white',
                    },
                    '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                        borderColor: 'white',
                    },
                    '&:hover fieldset': {
                        borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: 'white',
                    },
                    '& input::placeholder': {
                        color: 'white',
                        opacity: 1,
                    },
                    },
                    '& .MuiFormHelperText-root': {
                    color: 'white',
                    },
                    }}

                />
                </Box>
                <button className="p-2 text-white 
                rounded-2xl border-2 border-white hover:bg-white
                hover:text-black transition duration-300 cursor-pointer text-sm">
                Receive 0.5 token
                </button>
                <p className='text-gray-200'>
                    Note: We securely handle the provided wallet address while processing your request. 
                    This data is not used by any other DIT services.
                </p>
      </div>

    </>
  )
}

export default Faucet


