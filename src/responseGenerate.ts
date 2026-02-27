import type { Contact } from "../generated/prisma/client";


export default function responseGenerate(primaryRow: Contact, secondaryRows: Contact[]) {

    const emailHash: {[email: string]: string} | {[name: string]: number} = {};
    const emails = secondaryRows.reduce((accum, curr) => {
        if (!curr.email || emailHash[curr.email]) {
            return accum;
        }
        accum.push(curr.email);
        emailHash[curr.email] = curr.email;
        return accum;
    }, primaryRow!.email ? [primaryRow!.email] : []);


    const phoneHash: {[phone: string]: string} = {};
    const phoneNumbers = secondaryRows.reduce((accum, curr) => {
        if (!curr.phoneNumber || phoneHash[curr.phoneNumber]) {
            return accum;
        }
        accum.push(curr.phoneNumber);
        phoneHash[curr.phoneNumber] = curr.phoneNumber;
        return accum;
    }, primaryRow!.phoneNumber ? [primaryRow!.phoneNumber] : [])


    const secondaryIdHash: {[secid: string]: number} = {};
    const secondaryContactIds = secondaryRows.reduce((accum, curr) => {
        if (!curr.linkedId || secondaryIdHash[curr.linkedId]) {
            return accum;
        }
        accum.push(curr.linkedId);
        secondaryIdHash[curr.linkedId] = curr.linkedId;
        return accum;
    }, primaryRow!.linkedId ? [primaryRow!.linkedId] : [])

    return { emails, phoneNumbers, secondaryContactIds };
}
