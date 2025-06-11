import express, { json } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const router = express.Router();

router.post("/createRoom", async (req, res) => {
    try {
        const {text} = req.body;
        console.log(text, req.body)
        text.forEach(async (line) => {
            let value = line.split(";");
            let id = parseInt(value[0]);
            let number = parseInt(value[1]);
            let capacity = parseInt(value[2]);
            let floor = parseInt(value[3]);
            let room_image = value[4];
            let price = parseInt(value[5]);
            let wifi = value[6] == "TRUE" ? true : false;
            let parking = value[7] == "TRUE" ? true : false;
            let breakfast = value[8] == "TRUE" ? true : false;
            console.log("test")
            console.log({
                    id,
                    number,
                    capacity,
                    floor,
                    room_image,
                    price,
                    wifi,
                    parking,
                    breakfast,
                })
            await prisma.room.create({
                data: {
                    id,
                    number,
                    capacity,
                    floor,
                    room_image,
                    price,
                    wifi,
                    parking,
                    breakfast,
                },
            });
        });
        console.log(lines);
    } catch (error) {
        return res.status(500).json({ error });
    }
});

router.get("/", async (req, res) => {
    try {
        console.log("Room")
        const rooms = await prisma.room.findMany({
          include: {
                reservations: {
                    select: {
                        id:true,
                        checkin: true,
                        checkout: true
                    }
                }
          },
        });
        // const rooms = await prisma.room.findMany()
        res.status(200).json({
            rooms
        });
    } catch (error) {
        return res.status(500).json({ error});
    }
});


router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params
                console.log()

        if (!id) {
            return res.status(404).json({ error: "A room with this ID does not exist" })
        }

        const room = await prisma.room.findFirst({
            where: {
                id: parseInt(id)
            },
            include: {
                reservations: {
                    select: {
                        id:true,
                        checkin: true,
                        checkout: true
                    }
                }
            }
        })

        res.status(200).json({
            room,
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
});





router.post("/:id/reservation", async (req, res) => {
    try {
        const { id } = req.params
        const { name, checkin, checkout } = req.body
        console.log(name, checkin, checkout)

        if (!id) {
            return res.status(404).json({ error: "A room with this ID does not exist" })
        }
        if (!name || !checkin || !checkout) {
            return res.status(404).json({
                error: "Validation failed",
                fields: {
                    name: "The name field is required.",
                    city: "The city must be a string.",
                    zip: "The zip must be a string."
                }
            })
        }

        const room = await prisma.room.findFirst({
            where: {
                id: parseInt(id)
            }
        })
        const r = await prisma.reservation.create({
            data: {
                name,
                checkin,
                checkout,
                roomId: room.id,
                code: Math.floor(Math.random(100)*10000000).toString()
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
                        id: room.id,
                        number: room.number
                    }
                }
                }
            ]
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
});








export default router;
