import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/utils/utlis";

const prisma = new PrismaClient();

export const seedUsers = async () => {
  const userPass = await hashPassword("user1234");

  const allUsers = [
    {
      roleId: 1,
      name: "Reyhan Emir Affandie",
      email: "reyhanz1988@gmail.com",
      phone: "+6287778306720",
      address: "Jakarta, Indonesia",
    },
    { name: "Irawan Kurniadi", email: "irawan@example.com", phone: "+6281111111111", roleId: 3, address: "Jakarta, Indonesia" },
    { name: "Ahmad Sulim", email: "ahmad@example.com", phone: "+6281222222222", roleId: 3, address: "Jakarta, Indonesia" },
    { name: "Agung Nugroho", email: "agung@example.com", phone: "+6281333333333", roleId: 3, address: "Jakarta, Indonesia" },
    { name: "Budi Suparti", email: "budi@example.com", phone: "+6281444444444", roleId: 3, address: "Jakarta, Indonesia" },
    { name: "Putri Citrasari", email: "putri@example.com", phone: "+6281555555555", roleId: 3, address: "Jakarta, Indonesia" },
  ];

  for (const user of allUsers) {
    const existing = await prisma.users.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.users.create({
        data: {
          photo: "",
          name: user.name,
          email: user.email,
          password: userPass,
          phone: user.phone,
          address: user.address,
          roleId: user.roleId,
        },
      });
    }
  }

  console.log("✅ Users seeded.");
};
