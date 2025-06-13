import jwt from 'jsonwebtoken'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export const auth = async (req, res, next) => {
  const tokenString = req.headers.authorization

  if (!tokenString) {
    return res.status(401).json({ message: 'Authorization header missing' })
  }

  const token = tokenString.split(' ')[1]

  const userInfo = jwt.decode(token, process.env.SECRET_KEY)
  const user = await prisma.user.findFirst({
    where: {
      id: userInfo.id,
    }
  })
  if (!user) {
    return res.status(402).json({ message: 'Unauthorized' })
  }

  req.user = user


  next()
}
