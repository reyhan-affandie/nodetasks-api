import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/utils/utlis";

const prisma = new PrismaClient();

export const seedUsers = async () => {
  const userPass = await hashPassword("user1234");

  const allUsers = [
    {
      roleId: 1,
      name: "Reyhan Affandie",
      email: "reyhanz1988@gmail.com",
      phone: "+6287778306720",
      address: "Jakarta, Indonesia",
    },
    { name: "Michael Anderson", email: "michael.anderson@example.com", phone: "+12025550111", roleId: 3, address: "New York, USA" },
    { name: "David Thompson", email: "david.thompson@example.com", phone: "+12025550222", roleId: 3, address: "Los Angeles, USA" },
    { name: "Christopher Miller", email: "christopher.miller@example.com", phone: "+12025550333", roleId: 3, address: "Chicago, USA" },
    { name: "James Robinson", email: "james.robinson@example.com", phone: "+12025550444", roleId: 3, address: "San Diego, USA" },
    { name: "Emily Parker", email: "emily.parker@example.com", phone: "+12025550555", roleId: 3, address: "San Francisco, USA" },
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
