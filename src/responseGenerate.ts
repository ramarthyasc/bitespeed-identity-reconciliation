import type { Contact } from "../generated/prisma/client";


export default function responseGenerate(primaryRow: Contact, secondaryRows: Contact[]) {

    const emailHash: {[email: string]: string} = 
        primaryRow.email ? {[primaryRow.email]: primaryRow.email} : {};
    const emails = secondaryRows.reduce((accum, curr) => {
        if (!curr.email || emailHash[curr.email]) {
            return accum;
        }
        accum.push(curr.email);
        emailHash[curr.email] = curr.email;
        return accum;
    }, primaryRow.email ? [primaryRow.email] : []);


    const phoneHash: {[phone: string]: string} = 
        primaryRow.phoneNumber ? {[primaryRow.phoneNumber]: primaryRow.phoneNumber} : {};
    const phoneNumbers = secondaryRows.reduce((accum, curr) => {
        if (!curr.phoneNumber || phoneHash[curr.phoneNumber]) {
            return accum;
        }
        accum.push(curr.phoneNumber);
        phoneHash[curr.phoneNumber] = curr.phoneNumber;
        return accum;
    }, primaryRow.phoneNumber ? [primaryRow.phoneNumber] : [])


    const secondaryIdHash: {[secid: string]: number} = {};
    const secondaryContactIds = secondaryRows.reduce((accum, curr) => {
        if (!curr.id || secondaryIdHash[curr.id]) {
            return accum;
        }
        accum.push(curr.id);
        secondaryIdHash[curr.id] = curr.id;
        return accum;
    }, [] as number[])

    return { emails, phoneNumbers, secondaryContactIds };
}
