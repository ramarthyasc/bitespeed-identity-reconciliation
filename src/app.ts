import express from "express";
import { prisma } from "../lib/prisma";
import responseGenerate from "./responseGenerate";

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
    let rows;
    if (!body.email) {
        rows = await prisma.contact.findMany({
            where: { phoneNumber: JSON.stringify(body.phoneNumber) },
        })
    } else if (body.phoneNumber === undefined) {
        rows = await prisma.contact.findMany({
            where: { email: body.email }
        })
    } else {
        rows = await prisma.contact.findMany({
            where: {
                OR: [
                    { email: body.email },
                    { phoneNumber: JSON.stringify(body.phoneNumber) },
                ]
            }
        })
    }



    // First time user -> WHEN : Both are new || One is undefined & Other is new
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


    // One is undefined, other is common -> Then return the primary & secondaries
    if (!body.email || body.phoneNumber === undefined) {
        if (!body.email) {
            const primaryPhoneRow = await prisma.contact.findFirst({
                where: {
                    AND: [
                        { phoneNumber: JSON.stringify(body.phoneNumber) },
                        { linkPrecedence: "primary" }
                    ]
                }
            })
            const secondaryPhoneRows = await prisma.contact.findMany({
                where: {
                    linkedId: primaryPhoneRow!.id
                }
            })

            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryPhoneRow!, secondaryPhoneRows);
            const resbody: IResponse = {
                contact: {
                    primaryContactId: primaryPhoneRow!.id,
                    emails: emails,
                    phoneNumbers: phoneNumbers,
                    secondaryContactIds: secondaryContactIds
                }
            }
            return res.json(resbody);

        } else {
            const primaryEmailRow = await prisma.contact.findFirst({
                where: {
                    AND: [
                        { email: body.email },
                        { linkPrecedence: "primary" }
                    ]
                }
            })
            const secondaryEmailRows = await prisma.contact.findMany({
                where: {
                    linkedId: primaryEmailRow!.id
                }
            })

            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryEmailRow!, secondaryEmailRows);
            const resbody: IResponse = {
                contact: {
                    primaryContactId: primaryEmailRow!.id,
                    emails: emails,
                    phoneNumbers: phoneNumbers,
                    secondaryContactIds: secondaryContactIds
                }
            }
            return res.json(resbody);

        }
    }

    // // Check if there is any New information (email || phone) }}} 
    // let isNewEmail = false;
    // let isNewPhone = false;
    //
    //
    // if (body.email) {
    //     isNewEmail = rows.every((row) => {
    //         return row.email !== body.email;
    //     });
    // }
    // if (body.phoneNumber !== undefined) {
    //     isNewPhone = rows.every((row) => {
    //         return row.phoneNumber !== JSON.stringify(body.phoneNumber);
    //     })
    // }
    //
    // //Here, something common will always be present and it won't be null. Because - if everything was new, 
    // //then It would have created the contact above
    // if (isNewEmail && !isNewPhone) {
    //     primaryPhoneId = 
    // }



    return res.sendStatus(200);



})




export default app;

