import * as React from 'react'
import { useTheme } from '@mui/material/styles'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { TransactionContext } from '../../context/TransactionContext'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Loader from './Loader'

const Faucet = ({theme}) => {

const {faucetToken,currentAccount,testFaucetConnection} = React.useContext(TransactionContext)

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8

const MenuProps = {
    PaperProps: {
        style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
            },
            },
}
    
const names = [
    'All',
    'Bitcoin (BTC)',
    'Ethereum (ETH)',
    'Tether USD (USDT)',
]

const [tokenName, setTokenName] = React.useState('')
const [errorSelectMessage, setErrorSelectMessage] = React.useState('')

const [cooldownRemaining, setCooldownRemaining] = React.useState(false)
const [cooldownRemainingMessage, setCooldownRemainingMessage] = React.useState('')

const [successMessage, setSuccessMessage] = React.useState('')
const [errorMessage, setErrorMessage] = React.useState('')

const [isLoading, setIsLoading] = React.useState(false)

const handleChange = async(event) => {
    const value = event.target.value
    setTokenName(value)
}


const convertToFixedTime = ({ cooldownRemaining }) => {

const seconds = parseInt(cooldownRemaining, 10)
const targetTime = new Date(Date.now() + seconds * 1000)

const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
    }
    return `Each wallet address gets one drip on DIT every 1 day. Try again after ${targetTime.toLocaleString("en-US", options)}`
}


const handleFaucet = async() => {

    try {
        if(!currentAccount) {
            setErrorMessage('Please connect your wallet first')
            return
        }
        
        if(!tokenName || tokenName.length < 0) {
        setErrorSelectMessage('Token Name invalid') 
        return
    }

    setIsLoading(true)
    const tx = await faucetToken(tokenName)


    if (tx && typeof tx === "object" && "cooldownRemaining" in tx) {
        setCooldownRemaining(true)
        setCooldownRemainingMessage(convertToFixedTime(tx))
        setIsLoading(false)
        return
    } 
    if(tx && typeof tx === 'object' && "state" in tx){
        if(tx.state === 0){
            setErrorMessage(tx.tx || "Faucet failed.")
            setIsLoading(false)
            return
        }
        if(tx.state === 1){
            setSuccessMessage("Faucet successfully.")
            setIsLoading(false)
            return
        }
    }
    if(tx === null || tx === undefined){
        setErrorMessage("Faucet failed - no response from contract.")
        setIsLoading(false)
        return
    }
    setSuccessMessage("Faucet successfully.")
    setIsLoading(false)
    } catch (error) {
        console.error('Error in handleFaucet:', error);
        setErrorMessage('Faucet failed: ' + (error.message || 'Unknown error'))
        setIsLoading(false)
    }
}


React.useEffect(() => {
    setTimeout(() => {
    setErrorSelectMessage('')
    }, 5000)
}, [errorSelectMessage])

React.useEffect(() => {
    setTimeout(() => {
    setErrorMessage('')
    }, 5000)
}, [errorMessage])

React.useEffect(() => {
    setTimeout(() => {
    setSuccessMessage('')
    }, 5000)
}, [successMessage])

React.useEffect(() => {
    setTimeout(() => {
    setCooldownRemainingMessage('')
    setCooldownRemaining(false)
    }, 10000)
}, [cooldownRemainingMessage])



    
return (
<div className="flex flex-col gap-5 p-4 shadow-lg text-white lg:max-w-[50vw]  2xl:lg:max-w-[50vw] lg:mx-auto 2xl:mx-auto">
        
    <h1 className="text-3xl text-white">DIT Faucet</h1>
    <p className='text-15px  break-words  w-full'>
    Get 0.5 free tokens in Sepolia network sent directly to your wallet. 
    You can request one specific token or all available tokens at once.
    Brought to you by DIT Web3.
    </p>
        
    <FormControl sx={{ }}>
        <InputLabel id="token-label" sx={{ color: 'white' }}>
            Token Name
        </InputLabel>
        <Select
                labelId="token-label"
                id="token-select"
                value={tokenName}
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
        {
            errorSelectMessage && (<p className='text-red-600 text-sm'>{errorSelectMessage}</p>)
        }
        </FormControl>
    {/* <Box component="form" sx={{ }} autoComplete="off">
        <TextField
            fullWidth
            id="amount"
            label="Wallet address"
            value={currentAccount}
            disabled
            onChange={handleInputChange}
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
            {
                errorTextFieldMessage && (
                    <p className='text-red-600 text-sm '>
                        {errorTextFieldMessage}
                    </p>
                )
            }
        </Box> */}
       
            <div className="flex gap-2">
                {
                    isLoading ? (
                        <Loader/>
                ) : (
                        <button className="flex-1 p-2
                        rounded-2xl border-1  hover:bg-white bg-white text-black
                        hover:text-black transition duration-300 cursor-pointer text-sm font-light"
                        onClick={() => handleFaucet()}
                        >
                        Receive 0.5 {tokenName || 'Token'}
                        </button>
                    )
                }
              
            </div>
     
            {
                cooldownRemaining && (
                <Stack spacing={2} margin={'10px'} className='m-auto'>
                        <Alert severity='error'>{cooldownRemainingMessage}</Alert>
                </Stack>
                )
            }
             {
                successMessage && (
                <Stack spacing={2} margin={'10px'} className='m-auto'>
                        <Alert severity='success'>{successMessage}</Alert>
                </Stack>
                )
            }
            {
                errorMessage && (
                <Stack spacing={2} margin={'10px'} className='m-auto'>
                        <Alert severity='error'>{errorMessage}</Alert>
                </Stack>
                )
            }
          
        <p className='text-gray-200'>
            Note: We securely handle the provided wallet address while processing your request. 
            This data is not used by any other DIT services.
        </p>
</div>
)
}

export default Faucet


