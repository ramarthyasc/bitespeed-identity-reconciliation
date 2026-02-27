import type { Contact } from "@prisma/client";
export default function responseGenerate(primaryRow: Contact, secondaryRows: Contact[]): {
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
};
//# sourceMappingURL=responseGenerate.d.ts.map