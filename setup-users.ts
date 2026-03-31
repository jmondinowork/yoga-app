// Usage: node --env-file=.env.local --experimental-strip-types setup-users.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all existing users (and related records via cascade)...");
  await prisma.user.deleteMany();
  console.log("All users deleted.\n");

  // --- Admin user ---
  const adminPassword = await bcrypt.hash("PranaMotion!2026$Adm", 12);
  console.log("Creating admin user: mathildetorrez1@gmail.com");
  const admin = await prisma.user.create({
    data: {
      email: "mathildetorrez1@gmail.com",
      name: "Mathilde Torrez",
      role: "ADMIN",
      password: adminPassword,
      emailVerified: new Date(),
    },
  });
  console.log(`  -> Created admin (id: ${admin.id})\n`);

  // --- Regular user ---
  const userPassword = await bcrypt.hash("yoga123", 12);
  console.log("Creating regular user: jmondino.work@gmail.com");
  const user = await prisma.user.create({
    data: {
      email: "jmondino.work@gmail.com",
      name: "Jérémie Mondino",
      role: "USER",
      password: userPassword,
      emailVerified: new Date(),
    },
  });
  console.log(`  -> Created user (id: ${user.id})\n`);

  console.log("Done! 2 users created.");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
