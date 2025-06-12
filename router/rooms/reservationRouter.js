import express, { json } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const router = express.Router();

router.post("/", async (req, res) => {
    try {

        const { name, code } = req.body

        if (!name || !code) {
            return res.status(401).json({
                error: "Unauthorized"
            })
        }

        const r = await prisma.reservation.findFirst({
            where: {
                name: name,
                code: code
            },
            include: {
                room: {
                    select: {
                        id: true,
                        number: true
                    }
                }
            }
        })

        res.status(200).json({
            reservations: [
                {
                    id: r.id,
                    code: r.code,
                    name: r.name,
                    created_at: r.created_at,
                    reservation_information: {
                        id: r.id,
                        checkin: r.checkin,
                        checkout: r.checkout,
                        room: {
                            id: r.room.id,
                            number: r.room.number
                        }
                    }
                }
            ]
        });


    } catch (error) {
        return res.status(500).json({ error });
    }
});

router.post("/:id/cancel", async (req, res) => {
    try {

        const { name, code } = req.body
        const { id } = req.params

        if (!name || !code) {
            return res.status(401).json({
                error: "Unauthorized"
            })
        }


        const reservations = await prisma.reservation.delete({
            where: {
                id: parseInt(id),
                name: name,
                code: code
            }
        })
        res.status(200).json({
            message: "success"
        });


    } catch (error) {
        return res.status(500).json({ error });
    }
});








export default router;
