import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/utils/utlis";

const prisma = new PrismaClient();

export const seedUsers = async () => {
  const adminPass = await hashPassword("admin1234");
  const userPass = await hashPassword("user1234");

  const adminEmail = "dom@outsourcedstaff.com.au";
  const userEmail = "reyhanz1988@gmail.com";

  let admin = await prisma.users.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.users.create({
      data: {
        photo: "",
        roleId: 1, 
        name: "Dominic Procter",
        email: adminEmail,
        password: adminPass,
        phone: "+61410617418",
        address: "Sydney, Australia",
      },
    });
  }

  let user = await prisma.users.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        photo: "",
        roleId: 3,
        name: "Reyhan Emir Affandie",
        email: userEmail,
        password: userPass,
        phone: "+6287778306720",
        address: "Jakarta, Indonesia",
      },
    });
  }

  return { admin, user };
};
