import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import fetch from 'node-fetch'
import cookieParser from 'cookie-parser';

import dotenv from 'dotenv';
dotenv.config();

const app = express()
app.use(cors({
  origin: ['http://localhost:5173','https://dit-web3.vercel.app/'], 
  credentials: true           
}))
app.use(bodyParser.json())
app.use(cookieParser())

const JWT_SECRET = process.env.JWT_SECRET
const API_KEY = process.env.API_KEY


const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt_token
  try {
    if(!token) 
    return res.status(403).json({ error: 'Token không hợp lệ'})

    const decoded = jwt.verify(token, JWT_SECRET)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    console.log('timestamp : ',currentTimestamp)
    console.log('decoded exp : ',decoded.exp)
    if(decoded.exp < currentTimestamp)
      return res.status(403).json({ error: 'Token đã hết hạn'})
    req.user = decoded 
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Lỗi khi giải mã token' })
  }
}

app.get('/auth/me', verifyToken, (req, res) => {
  res.json({ address: req.user.address })
})

app.post('/auth/logout', (req, res) => {
  res.clearCookie('jwt_token', {
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  })
  res.json({ message: 'Đăng xuất thành công' })
})


app.post('/auth/message', (req, res) => {
  const address  = req.body.accountAddress;

  const timestamp = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false
  });

  const nonce = Math.floor(Math.random() * 1000000);
  const message = `Login to DIT Web3 App 
with Address: ${address} 
Time: ${timestamp} 
Nonce: ${nonce}`;
  res.json({ message });
});


app.post('/auth/verify', (req, res) => {
  console.log("Incoming request body:", req.body);
  const { address, message, signature } = req.body
  try {
    const recovered = ethers.utils.verifyMessage(message, signature)
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Chữ ký không hợp lệ' })
    }
    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: '1h' })
    res.cookie('jwt_token',token,{
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 3600000, 
    })
    res.json({ message: 'Xác thực thành công' })
  } catch (err) {
    res.status(500).json({ error: 'Xác thực thất bại' })
  }
})

app.get('/api/tokens/all', async (req, res) => {
  try {
    console.log('Fetching tokens from CoinMarketCap...');
    
    const listRes = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&sort=market_cap&sort_dir=desc`, {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY }
    })
    
    if (!listRes.ok) {
      console.error('CoinMarketCap API error:', listRes.status, listRes.statusText);
      return res.status(listRes.status).json({ 
        error: 'CoinMarketCap API error', 
        status: listRes.status,
        statusText: listRes.statusText
      });
    }
    
    const listData = await listRes.json()
    console.log('List response received, tokens count:', listData.data?.length || 0);

    if (!listData.data || !Array.isArray(listData.data)) {
      console.error('Invalid list response:', listData);
      return res.status(500).json({ error: 'Invalid response from CoinMarketCap', data: listData })
    }

    const limitedTokens = listData.data.slice(0, 50);
    console.log('Processing limited tokens:', limitedTokens.length);

    const tokenIds = limitedTokens.map(token => token.id).join(',')
    console.log('Fetching quotes and info for', limitedTokens.length, 'tokens...');
    
    const [quotesRes, infoRes] = await Promise.all([
      fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${tokenIds}`, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY }
      }),
      fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${tokenIds}`, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY }
      })
    ])

    if (!quotesRes.ok || !infoRes.ok) {
      console.error('Quotes/Info API error:', quotesRes.status, infoRes.status);
      return res.status(500).json({ 
        error: 'Failed to fetch token details',
        quotesStatus: quotesRes.status,
        infoStatus: infoRes.status
      });
    }

    const quotesData = await quotesRes.json()
    const infoData = await infoRes.json()
    console.log('Quotes and info received');

const tokenCache = {};

limitedTokens.forEach(token => {
  const quote = quotesData?.data?.[token.id]?.quote?.USD;
  const info = infoData?.data?.[token.id];

  if (quote && info) {
    tokenCache[token.id] = {
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      price: quote.price,
      percent_change_24h: quote.percent_change_24h,
      market_cap: quote.market_cap,
      volume_24h: quote.volume_24h,
      logo: info.logo || null,
      description: info.description || '',
      category: info.category || '',
      date_added: info.date_added || '',
      website: info.urls?.website?.[0] || ''
    };
  }
});

    console.log('Cache created with', Object.keys(tokenCache).length, 'tokens');

    res.json({
      success: true,
      count: Object.keys(tokenCache).length,
      timestamp: new Date().toISOString(),
      data: tokenCache
    })

  } catch (err) {
    console.error('Error fetching all tokens:', err)
    res.status(500).json({ error: 'Server error', details: err.message })
  }
})


const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server.js running at http://localhost:${PORT}`)
})
