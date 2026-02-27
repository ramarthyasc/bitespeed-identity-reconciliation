import type { Contact } from "../generated/prisma/client.js";
export default function responseGenerate(primaryRow: Contact, secondaryRows: Contact[]): {
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
};
//# sourceMappingURL=responseGenerate.d.ts.map