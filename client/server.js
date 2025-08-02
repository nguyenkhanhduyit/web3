import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import fetch from 'node-fetch'
import cookieParser from 'cookie-parser';


const app = express()
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true           
}))
app.use(bodyParser.json())
app.use(cookieParser())

const JWT_SECRET = '0RtHZ1161fQHWUeLdLfiT3MYMQTSMfV6PIrEE83p79ZSFafXt9S4eDSTpCjh4PsV'
const API_KEY = '87711848-a3f3-403a-922a-e1bed045357b'


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
  const { address } = req.body
  const timestamp = new Date().toISOString()
  const nonce = Math.floor(Math.random() * 1000000)
  const message = `Login to Web3 App\nAddress: ${address}\nTime: ${timestamp}\nNonce: ${nonce}`
  res.json({ message })
})

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

app.get('/api/token', async (req, res) => {
  const symbolOrName = req.query.symbol

  if (!symbolOrName) {
    return res.status(400).json({ error: 'Missing symbol parameter' })
  }

  try {
    const mapRes = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?listing_status=active`, {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY }
    })
    const mapData = await mapRes.json()

    const token = mapData.data.find(
      (t) =>
        t.symbol.toLowerCase() === symbolOrName.toLowerCase() ||
        t.name.toLowerCase() === symbolOrName.toLowerCase()
    )

    if (!token) {
      return res.status(404).json({ error: 'Token not found' })
    }

    const id = token.id
    const [quoteRes, infoRes] = await Promise.all([
      fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${id}`, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY }
      }),
      fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${id}`, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY }
      })
    ])

    const quoteData = await quoteRes.json()
    const infoData = await infoRes.json()

    const quote = quoteData?.data?.[id]?.quote?.USD
    const info = infoData?.data?.[id]

    if (!quote || !info) {
      return res.status(500).json({ error: 'Missing token data' })
    }

    res.json({
      id,
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
    })

  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: 'Server error', details: err.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server.js running at http://localhost:${PORT}`)
})
