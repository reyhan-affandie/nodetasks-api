import { users } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<users, "id" | "name" | "email" | "roleId">;
    }
  }
}
