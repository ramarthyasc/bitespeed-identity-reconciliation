import type { Contact } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export async function findPrimaryRow(primaryId: Contact["id"]) {
    const primaryRow = await prisma.contact.findFirst({
        where: {
            id: primaryId
        }
    })
    return primaryRow;
}
export async function findPhoneRow(phoneNumber: Contact["phoneNumber"]) {
    const phoneRow = await prisma.contact.findFirst({
        where: {
            phoneNumber: phoneNumber
        }
    })
    return phoneRow;
}

export async function findSecondaryRows(primaryId: Contact["id"]) {
    const secondaryRows = await prisma.contact.findMany({
        where: {
            linkedId: primaryId
        }
    })
    return secondaryRows;
}

export async function findEmailRow(email: Contact["email"]) {
    const emailRow = await prisma.contact.findFirst({
        where: {
            email: email
        }
    })
    return emailRow;
}

export async function createSecondaryRow(email: Contact["email"], phoneNumber: Contact["phoneNumber"], primaryRow: Contact) {
    await prisma.contact.create({
        data: {
            email: email,
            phoneNumber: phoneNumber,
            linkedId: primaryRow.id,
            linkPrecedence: "secondary"
        }
    })
}
