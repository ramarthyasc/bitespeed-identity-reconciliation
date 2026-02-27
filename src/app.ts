import express from "express";
import { prisma } from "../lib/prisma";
import responseGenerate from "./responseGenerate";
import { createSecondaryRow, findEmailRow, findPhoneRow, findPrimaryRow, findSecondaryRows } from "./queries";
import z from "zod";

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
    "email"?: string;
    "phoneNumber"?: number;
}
interface IReqNormalized {
    "email": string | null;
    "phoneNumber": string | null;
}

const RequestSchema = z.object({
    email: z.string().optional(),
    phoneNumber: z.number().optional(),
})

app.post('/identify', async (req, res) => {

    const unverifiedReqbody: IRequest = req.body;
    const verifiedReqbody = RequestSchema.safeParse(unverifiedReqbody);
    if (!verifiedReqbody.success) {
        return res.sendStatus(400);
    }
    const reqbody = verifiedReqbody.data;

    const body: IReqNormalized = {
        email: (reqbody.email === "" || reqbody.email === undefined) ? null : reqbody.email,
        phoneNumber: reqbody.phoneNumber === undefined ? null : JSON.stringify(reqbody.phoneNumber)
    }
    if (!body.email && !body.phoneNumber) {
        return res.sendStatus(400);
    }


    // check db
    let rows;
    if (!body.email) {
        rows = await prisma.contact.findMany({
            where: { phoneNumber: body.phoneNumber},
        })
    } else if (!body.phoneNumber) {
        rows = await prisma.contact.findMany({
            where: { email: body.email }
        })
    } else {
        rows = await prisma.contact.findMany({
            where: {
                OR: [
                    { email: body.email },
                    { phoneNumber: body.phoneNumber},
                ]
            }
        })
    }



    // First time user -> WHEN : Both are new || One is undefined & Other is new
    if (!rows.length) {
        const row = await prisma.contact.create({
            data: {
                email: body.email,
                phoneNumber: body.phoneNumber,
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


    // One is undefined, other is common .The Common can be secondary or primary-> Then return the primary & secondaries
    if (!body.email || !body.phoneNumber) {
        if (!body.email) {

            const phoneRow = (await findPhoneRow(body.phoneNumber))!;
            const primaryId = !phoneRow.linkedId ? phoneRow.id : phoneRow.linkedId;
            const primaryPhoneRow = (await findPrimaryRow(primaryId))!;


            const secondaryPhoneRows = await findSecondaryRows(primaryId);

            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryPhoneRow, secondaryPhoneRows);
            const resbody: IResponse = {
                contact: {
                    primaryContactId: primaryPhoneRow.id,
                    emails: emails,
                    phoneNumbers: phoneNumbers,
                    secondaryContactIds: secondaryContactIds
                }
            }
            return res.json(resbody);

        } else {
            const emailRow = (await findEmailRow(body.email))!;
            const primaryId = !emailRow.linkedId ? emailRow.id : emailRow.linkedId;
            const primaryEmailRow = (await findPrimaryRow(primaryId))!;

            const secondaryEmailRows = await findSecondaryRows(primaryId);

            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryEmailRow, secondaryEmailRows);
            const resbody: IResponse = {
                contact: {
                    primaryContactId: primaryEmailRow.id,
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
    // if (body.phoneNumber) {
    //     isNewPhone = rows.every((row) => {
    //         return row.phoneNumber !== body.phoneNumber;
    //     })
    // }
    //
    // //Here, something common will always be present and it won't be null. Because - if everything was new, 
    // //then It would have created the contact above
    //
    // // One is New, and other is common -> make it secondary, -> no chain changes
    // if (isNewEmail && !isNewPhone) {
    //     // find the primary using phone
    //     const primaryPhoneRow = await findPrimaryPhoneRow(body.phoneNumber)
    //     // make the req body - as secondary
    //     await createSecondaryRow(body.email, body.phoneNumber, primaryPhoneRow!);
    //     //findall secondaries
    //     const secondaryPhoneRows = await findSecondaryRows(primaryPhoneRow!);
    //
    //     const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryPhoneRow!, secondaryPhoneRows);
    //     const resbody: IResponse = {
    //         contact: {
    //             primaryContactId: primaryPhoneRow!.id,
    //             emails: emails,
    //             phoneNumbers: phoneNumbers,
    //             secondaryContactIds: secondaryContactIds
    //         }
    //     }
    //     return res.json(resbody);
    //
    // } else if (isNewPhone && !isNewEmail) {
    //     // find the primary using email
    //     const primaryEmailRow = await findPrimaryEmailRow(body.email);
    //     // make the req body - as secondary
    //     await createSecondaryRow(body.email, body.phoneNumber, primaryEmailRow!);
    //     //findall secondaries
    //     const secondaryEmailRows = await findSecondaryRows(primaryEmailRow!);
    //
    //     const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryEmailRow!, secondaryEmailRows);
    //     const resbody: IResponse = {
    //         contact: {
    //             primaryContactId: primaryEmailRow!.id,
    //             emails: emails,
    //             phoneNumbers: phoneNumbers,
    //             secondaryContactIds: secondaryContactIds
    //         }
    //     }
    //     return res.json(resbody);
    //
    // }
    //
    // // if (!isNewPhone && !isNewEmail) {
    // //
    // // }





    return res.sendStatus(200);



})




export default app;

