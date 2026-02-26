import express from "express";
import { prisma } from "../lib/prisma";

const app = express();
app.use(express.json());

interface IResponse {
    contact: {
        primaryContactId: number,
        emails: string[], // first element being email of primary contact
        phoneNumbers: string[], // first element being phoneNumber of primary contact
        secondaryContactIds: number[] // Array of all Contact IDs that are "secondary" to the primary contact
    }
}
interface IRequest {
    "email"?: string,
    "phoneNumber"?: number
}


app.post('/identify', async (req, res) => {

    const body: IRequest = req.body;
    if (!body.email && body.phoneNumber === undefined) {
        return res.sendStatus(400);
    }

    // check db
    const rows = await prisma.contact.findMany({
        where: {
            OR: [
                { email: body.email ?? null },
                { phoneNumber: body.phoneNumber === undefined ? null : JSON.stringify(body.phoneNumber) },
            ]
        }
    })


    // First time user -> email and phNo is null
    if (!rows.length) {
        const row = await prisma.contact.create({
            data: {
                email: body.email ?? null,
                phoneNumber: body.phoneNumber === undefined ? null : JSON.stringify(body.phoneNumber),
            }
        })

        const resbody: IResponse = {
            contact: {
                primaryContactId: row.id,
                emails: row.email ? [row.email] : [],
                phoneNumbers: row.phoneNumber ? [row.phoneNumber] : [],
                secondaryContactIds: [],
            }
        };

        return res.json(resbody);
    }


    // 


})




export default app;

