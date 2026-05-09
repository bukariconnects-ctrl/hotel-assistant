import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing database connection...");

  const orgCount = await prisma.organization.count();
  console.log(`✅ Connected! Organizations table exists. Row count: ${orgCount}`);

  const testOrg = await prisma.organization.create({
    data: {
      name: "Test Organization",
      slug: "test-org-verify",
      description: "Verification test record",
      category: "general",
    },
  });
  console.log(`✅ Insert OK — created org: ${testOrg.id}`);

  const fetched = await prisma.organization.findUnique({
    where: { id: testOrg.id },
  });
  console.log(`✅ Fetch OK — name: ${fetched?.name}`);

  await prisma.organization.delete({ where: { id: testOrg.id } });
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
