import express, { json, text } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { auth } from '../../middleware/auth.js'
import axios from 'axios'
import OpenAI from 'openai'

const prisma = new PrismaClient()

const router = express.Router()

const quotaPrice = 10 // 10 cents
const quotaConst = parseInt(process.env.API_QUOTA) * 100 // conver 1euro to 100 cents

if (!process.env.API_KEY) {
  console.error('NO API KEY')
}

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.API_KEY,
})

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'all fields must be filled' })
    }

    const user = await prisma.user.create({
      data: {
        username: username,
        password: password,
        quota: quotaConst,
      },
    })

    return res.status(200).json({
      id: user.id,
      username: user.username,
      quota: user.quota,
      free_quota: user.free_quota,
      token: createToken(user),
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'all fields must be filled' })
    }

    const user = await prisma.user.findFirst({
      where: {
        username: username,
        password: password,
      },
    })

    if (!user) {
      return res
        .status(404)
        .json({ error: 'username or password are incorrect' })
    }

    return res.status(200).json({
      id: user.id,
      username: user.username,
      quota: user.quota,
      free_quota: user.free_quota,
      token: createToken(user),
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.get('/history', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: 'User not authorized' })
    }
    const room = await prisma.room.findMany({
      include: {
        chat: true,
      },
    })
    res.status(200).json({
      room,
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.post('/new', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: 'User not authorized' })
    }

    const { message } = req.body
    if (!message || message === '') {
      return res.status(404).json({ error: 'incorrect field' })
    }

    const reply = await sendMessage([
      {
        role: 'user',
        content: message,
      },
    ])

    if (!reply || reply === '') {
      return res.status(500).json({ error: 'API error' })
    }

    const quota = await hasQuota(req.user) // booloean
    if (!quota) {
      return res.status(500).json({ error: 'Insufficient credits' })
    }

    const room = await prisma.room.create({
      data: {
        userId: req.user.id,
      },
    })

    await prisma.message.createMany({
      data: [
        { type: 'USER', text: message, roomId: room.id },
        { type: 'AI', text: reply, roomId: room.id },
      ],
    })

    const roomMessages = await prisma.message.findMany({
      where: {
        roomId: room.id,
      },
    })
    res.status(200).json({
      room,
      roomMessages,
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.put('/:id/reply', auth, async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res
        .status(404)
        .json({ error: 'A room with this ID does not exist' })
    }

    const { message } = req.body

    if (!message || message === '') {
      return res.status(404).json({ error: 'incorrect field' })
    }

    const room = await prisma.room.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        chat: true,
      },
    })

    let chatHistory = []

    room.chat.forEach((message) => {
      let type = message.type
      let text = message.text

      if (type === 'USER') {
        chatHistory.push({
          role: 'user',
          content: text,
        })
      }

      if (type === 'AI') {
        chatHistory.push({
          role: 'assistant',
          content: text,
        })
      }
    })
    chatHistory.push({
      role: 'user',
      content: message,
    })
    const reply = await sendMessage(chatHistory)

    if (!reply || reply === '') {
      return res.status(500).json({ error: 'API error' })
    }

    const quota = await hasQuota(req.user) // booloean
    if (!quota) {
      return res.status(500).json({ error: 'Insufficient credits' })
    }

    await prisma.message.createMany({
      data: [
        { type: 'USER', text: message, roomId: room.id },
        { type: 'AI', text: reply, roomId: room.id },
      ],
    })

    const latestRoom = await prisma.room.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        chat: true,
      },
    })

    res.status(200).json({
      room: latestRoom,
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.get('/spent', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: 'User not authorized' })
    }

    const rooms = await prisma.room.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        chat: true
      }
    })


    let user_messages = 0
    rooms.forEach( room => {
      user_messages = user_messages + room.chat.filter((m) => m.type === 'USER').length
    })

    let cost = user_messages * quotaPrice  /100

    res.status(200).json({
      message: `Total Spent ${cost} euro`,
      quota: "Left quota "+ req.user.quota + " euro"
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res
        .status(404)
        .json({ error: 'A room with this ID does not exist' })
    }

    const room = await prisma.room.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        chat: true,
      },
    })

    res.status(200).json({
      room,
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

router.delete('/:id/delete', auth, async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res
        .status(404)
        .json({ error: 'A room with this ID does not exist' })
    }

    await prisma.message.deleteMany({
      where: {
        roomId: parseInt(id),
      },
    })

    const room = await prisma.room.delete({
      where: {
        id: parseInt(id),
      },
    })

    console.log(room)

    res.status(200).json({
      message: 'success room ' + room.id + ' deleted',
    })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

function createToken(user) {
  return jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1d' })
}

const sendMessage = async (messageHistory) => {
  try {
    console.log(messageHistory)
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash-preview',
      messages: messageHistory,
    })
    console.log(completion)
    console.log(completion.choices)
    console.log(completion.choices[0].message)
    return completion.choices[0].message.content
  } catch (error) {
    console.log(error)
    return false
  }
  // return 'Reply: ' + message
}

const hasQuota = async (user) => {
  try {
    const hasFreeQuota = await prisma.user.updateMany({
      where: {
        id: user.id,
        free_quota: { gt: 0 },
      },
      data: {
        free_quota: { decrement: 1 },
      },
    })

    if (hasFreeQuota.count > 0) {
      return true
    }
    const hasQuota = await prisma.user.updateMany({
      where: {
        id: user.id,
        quota: { gt: 0 },
      },
      data: {
        quota: { decrement: quotaPrice }, // - 0.10$
      },
    })
    if (hasQuota.count > 0) {
      return true
    }

    return false
  } catch (error) {
    console.error(error)
  }
}

export default router
