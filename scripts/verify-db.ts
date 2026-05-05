import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing database connection...");

  const hotelCount = await prisma.hotel.count();
  console.log(`✅ Connected! Hotels table exists. Row count: ${hotelCount}`);

  const testHotel = await prisma.hotel.create({
    data: {
      name: "Test Grand Hotel",
      slug: "test-grand-hotel",
      description: "Verification test record",
    },
  });
  console.log(`✅ Insert OK — created hotel: ${testHotel.id}`);

  const fetched = await prisma.hotel.findUnique({
    where: { id: testHotel.id },
  });
  console.log(`✅ Fetch OK — name: ${fetched?.name}`);

  await prisma.hotel.delete({ where: { id: testHotel.id } });
  console.log(`✅ Cleanup OK — test record deleted`);

  console.log("\n🎉 All checks passed. Database is ready!");
}

main()
  .catch((e) => {
    console.error("❌ Connection test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
