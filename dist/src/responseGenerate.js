// import type { Contact } from "@prisma/client";
export default function responseGenerate(primaryRow, secondaryRows) {
    const emailHash = primaryRow.email ? { [primaryRow.email]: primaryRow.email } : {};
    const emails = secondaryRows.reduce((accum, curr) => {
        if (!curr.email || emailHash[curr.email]) {
            return accum;
        }
        accum.push(curr.email);
        emailHash[curr.email] = curr.email;
        return accum;
    }, primaryRow.email ? [primaryRow.email] : []);
    const phoneHash = primaryRow.phoneNumber ? { [primaryRow.phoneNumber]: primaryRow.phoneNumber } : {};
    const phoneNumbers = secondaryRows.reduce((accum, curr) => {
        if (!curr.phoneNumber || phoneHash[curr.phoneNumber]) {
            return accum;
        }
        accum.push(curr.phoneNumber);
        phoneHash[curr.phoneNumber] = curr.phoneNumber;
        return accum;
    }, primaryRow.phoneNumber ? [primaryRow.phoneNumber] : []);
    const secondaryIdHash = {};
    const secondaryContactIds = secondaryRows.reduce((accum, curr) => {
        if (!curr.id || secondaryIdHash[curr.id]) {
            return accum;
        }
        accum.push(curr.id);
        secondaryIdHash[curr.id] = curr.id;
        return accum;
    }, []);
    return { emails, phoneNumbers, secondaryContactIds };
}
//# sourceMappingURL=responseGenerate.js.map