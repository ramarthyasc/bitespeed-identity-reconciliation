import { prisma } from "../lib/prisma.js";
export async function findPrimaryRow(primaryId) {
    const primaryRow = await prisma.contact.findFirst({
        where: {
            id: primaryId
        }
    });
    return primaryRow;
}
export async function findPhoneRow(phoneNumber) {
    const phoneRow = await prisma.contact.findFirst({
        where: {
            phoneNumber: phoneNumber
        }
    });
    return phoneRow;
}
export async function findSecondaryRows(primaryId) {
    const secondaryRows = await prisma.contact.findMany({
        where: {
            linkedId: primaryId
        }
    });
    return secondaryRows;
}
export async function findEmailRow(email) {
    const emailRow = await prisma.contact.findFirst({
        where: {
            email: email
        }
    });
    return emailRow;
}
export async function createSecondaryRow(email, phoneNumber, primaryRow) {
    await prisma.contact.create({
        data: {
            email: email,
            phoneNumber: phoneNumber,
            linkedId: primaryRow.id,
            linkPrecedence: "secondary"
        }
    });
}
//# sourceMappingURL=queries.js.map