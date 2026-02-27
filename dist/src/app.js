import express from "express";
import { prisma } from "../lib/prisma.js";
import responseGenerate from "./responseGenerate.js";
import { createSecondaryRow, findEmailRow, findPhoneRow, findPrimaryRow, findSecondaryRows } from "./queries.js";
import z from "zod";
const app = express();
app.use(express.json());
const RequestSchema = z.object({
    email: z.string().optional(),
    phoneNumber: z.number().optional(),
});
app.get('/', (req, res) => {
    res.send("Hello Amarthya here, /identify is the api endpoint");
});
app.post('/identify', async (req, res) => {
    const unverifiedReqbody = req.body;
    const verifiedReqbody = RequestSchema.safeParse(unverifiedReqbody);
    if (!verifiedReqbody.success) {
        return res.sendStatus(400);
    }
    const reqbody = verifiedReqbody.data;
    const body = {
        email: (reqbody.email === "" || reqbody.email === undefined) ? null : reqbody.email,
        phoneNumber: reqbody.phoneNumber === undefined ? null : JSON.stringify(reqbody.phoneNumber)
    };
    if (!body.email && !body.phoneNumber) {
        return res.sendStatus(400);
    }
    // check db
    let rows;
    if (!body.email) {
        rows = await prisma.contact.findMany({
            where: { phoneNumber: body.phoneNumber },
        });
    }
    else if (!body.phoneNumber) {
        rows = await prisma.contact.findMany({
            where: { email: body.email }
        });
    }
    else {
        rows = await prisma.contact.findMany({
            where: {
                OR: [
                    { email: body.email },
                    { phoneNumber: body.phoneNumber },
                ]
            }
        });
    }
    // First time user -> WHEN : Both are new || One is undefined & Other is new
    if (!rows.length) {
        const row = await prisma.contact.create({
            data: {
                email: body.email,
                phoneNumber: body.phoneNumber,
            }
        });
        const resbody = {
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
            const phoneRow = (await findPhoneRow(body.phoneNumber));
            const primaryId = !phoneRow.linkedId ? phoneRow.id : phoneRow.linkedId;
            const primaryPhoneRow = (await findPrimaryRow(primaryId));
            const secondaryPhoneRows = await findSecondaryRows(primaryId);
            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryPhoneRow, secondaryPhoneRows);
            const resbody = {
                contact: {
                    primaryContactId: primaryPhoneRow.id,
                    emails: emails,
                    phoneNumbers: phoneNumbers,
                    secondaryContactIds: secondaryContactIds
                }
            };
            return res.json(resbody);
        }
        else {
            const emailRow = (await findEmailRow(body.email));
            const primaryId = !emailRow.linkedId ? emailRow.id : emailRow.linkedId;
            const primaryEmailRow = (await findPrimaryRow(primaryId));
            const secondaryEmailRows = await findSecondaryRows(primaryId);
            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryEmailRow, secondaryEmailRows);
            const resbody = {
                contact: {
                    primaryContactId: primaryEmailRow.id,
                    emails: emails,
                    phoneNumbers: phoneNumbers,
                    secondaryContactIds: secondaryContactIds
                }
            };
            return res.json(resbody);
        }
    }
    // Check if there is any New information (email || phone) }}} 
    let isNewEmail = false;
    let isNewPhone = false;
    if (body.email) {
        isNewEmail = rows.every((row) => {
            return row.email !== body.email;
        });
    }
    if (body.phoneNumber) {
        isNewPhone = rows.every((row) => {
            return row.phoneNumber !== body.phoneNumber;
        });
    }
    //Here, something common will always be present and it won't be null. Because - if everything was new, 
    //then It would have created the contact above
    // One is New, and other is common -> make it secondary, -> no chain changes
    if (isNewEmail && !isNewPhone) {
        // find the primary using phone
        const phoneRow = (await findPhoneRow(body.phoneNumber));
        const primaryId = !phoneRow.linkedId ? phoneRow.id : phoneRow.linkedId;
        const primaryPhoneRow = (await findPrimaryRow(primaryId));
        // make the req body - as secondary
        await createSecondaryRow(body.email, body.phoneNumber, primaryPhoneRow);
        //findall secondaries
        const secondaryPhoneRows = await findSecondaryRows(primaryId);
        const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryPhoneRow, secondaryPhoneRows);
        const resbody = {
            contact: {
                primaryContactId: primaryPhoneRow.id,
                emails: emails,
                phoneNumbers: phoneNumbers,
                secondaryContactIds: secondaryContactIds
            }
        };
        return res.json(resbody);
    }
    else if (isNewPhone && !isNewEmail) {
        // find the primary using email
        const emailRow = (await findEmailRow(body.email));
        const primaryId = !emailRow.linkedId ? emailRow.id : emailRow.linkedId;
        const primaryEmailRow = (await findPrimaryRow(primaryId));
        // make the req body - as secondary
        await createSecondaryRow(body.email, body.phoneNumber, primaryEmailRow);
        //findall secondaries
        const secondaryEmailRows = await findSecondaryRows(primaryId);
        const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryEmailRow, secondaryEmailRows);
        const resbody = {
            contact: {
                primaryContactId: primaryEmailRow.id,
                emails: emails,
                phoneNumbers: phoneNumbers,
                secondaryContactIds: secondaryContactIds
            }
        };
        return res.json(resbody);
    }
    // Both Email and Phonenumber are present and both are not null-> 
    if (!isNewPhone && !isNewEmail) {
        // if every row matching either the email or phone number - has same LinkedId- then return
        const linkedIds = rows.reduce((accum, curr) => {
            if (curr.linkedId === null) {
                if (accum[curr.id]) {
                    return accum;
                }
                accum[curr.id] = curr.id;
                return accum;
            }
            if (accum[curr.linkedId]) {
                return accum;
            }
            accum[curr.linkedId] = curr.linkedId;
            return accum;
        }, {});
        // [1, null1], [2, null2], [null1], [null2] these are the only combinations where it's Only 1 CHAIN
        // These all normalize/shrink to [1], [2], [1], [2] ie; only 1 length for each combo
        if (Object.values(linkedIds).length < 2) {
            const emailRow = (await findEmailRow(body.email));
            const primaryId = !emailRow.linkedId ? emailRow.id : emailRow.linkedId;
            const primaryRow = (await findPrimaryRow(primaryId));
            const secondaryRows = await findSecondaryRows(primaryId);
            const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryRow, secondaryRows);
            const resbody = {
                contact: {
                    primaryContactId: primaryRow.id,
                    emails: emails,
                    phoneNumbers: phoneNumbers,
                    secondaryContactIds: secondaryContactIds
                }
            };
            return res.json(resbody);
        }
        //if there are more than 1 linkedIds present (Maximum is 2), then chain should be mixed,
        //with Primary as the smallest id
        //
        //These are the combinations when there are 2 linked chains : [1,null2], [2, null1], 
        //[1,2,null1], [1,2,null2], [1,2,null1,null2], [null1, null2], [1,2]. These all normalize to [1,2]
        //Object.values(linkedIds).length = 2, then :
        const linkedIdsArray = Object.values(linkedIds);
        const oldPrimaryId = Math.max(...linkedIdsArray);
        const newPrimaryId = Math.min(...linkedIdsArray);
        //convert oldPrimaryId to secondary
        await prisma.contact.update({
            where: { id: oldPrimaryId },
            data: {
                linkedId: newPrimaryId,
                linkPrecedence: "secondary"
            }
        });
        // convert every oldPrimaryId linked rows to target to newPrimaryId
        await prisma.contact.updateMany({
            where: { linkedId: oldPrimaryId },
            data: {
                linkedId: newPrimaryId
            }
        });
        const primaryRow = (await findPrimaryRow(newPrimaryId));
        const secondaryRows = await findSecondaryRows(newPrimaryId);
        const { emails, phoneNumbers, secondaryContactIds } = responseGenerate(primaryRow, secondaryRows);
        const resbody = {
            contact: {
                primaryContactId: primaryRow.id,
                emails: emails,
                phoneNumbers: phoneNumbers,
                secondaryContactIds: secondaryContactIds
            }
        };
        return res.json(resbody);
    }
});
export default app;
//# sourceMappingURL=app.js.map