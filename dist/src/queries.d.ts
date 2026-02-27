import type { Contact } from "@prisma/client";
export declare function findPrimaryRow(primaryId: Contact["id"]): Promise<{
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: import("@prisma/client").$Enums.LinkPrecedence;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
} | null>;
export declare function findPhoneRow(phoneNumber: Contact["phoneNumber"]): Promise<{
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: import("@prisma/client").$Enums.LinkPrecedence;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
} | null>;
export declare function findSecondaryRows(primaryId: Contact["id"]): Promise<{
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: import("@prisma/client").$Enums.LinkPrecedence;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}[]>;
export declare function findEmailRow(email: Contact["email"]): Promise<{
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: import("@prisma/client").$Enums.LinkPrecedence;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
} | null>;
export declare function createSecondaryRow(email: Contact["email"], phoneNumber: Contact["phoneNumber"], primaryRow: Contact): Promise<void>;
//# sourceMappingURL=queries.d.ts.map