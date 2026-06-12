// Identitas: Zufar Muhammad 24110400001
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing data (optional, but good for fresh start)
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();

  // Insert Wallets
  const wallet1 = await prisma.wallet.create({
    data: {
      id: 1,
      name: "BCA Tabungan",
      currency: "IDR"
    }
  });

  const wallet2 = await prisma.wallet.create({
    data: {
      id: 2,
      name: "Cash",
      currency: "IDR"
    }
  });

  // Insert Transactions for Wallet 1
  await prisma.transaction.createMany({
    data: [
      { id: 1, amount: 5000000, type: "income", category: "salary", date: new Date("2025-01-05T00:00:00Z"), walletId: 1 },
      { id: 2, amount: 45000, type: "expense", category: "food", date: new Date("2025-01-06T00:00:00Z"), walletId: 1 },
      { id: 3, amount: 25000, type: "expense", category: "transport", date: new Date("2025-01-07T00:00:00Z"), walletId: 1 },
      { id: 4, amount: 80000, type: "expense", category: "food", date: new Date("2025-01-10T00:00:00Z"), walletId: 1 },
      { id: 5, amount: 500000, type: "income", category: "freelance", date: new Date("2025-01-15T00:00:00Z"), walletId: 1 }
    ]
  });

  // Insert Transactions for Wallet 2
  await prisma.transaction.createMany({
    data: [
      { id: 6, amount: 200000, type: "income", category: "salary", date: new Date("2025-01-05T00:00:00Z"), walletId: 2 },
      { id: 7, amount: 30000, type: "expense", category: "food", date: new Date("2025-01-08T00:00:00Z"), walletId: 2 }
    ]
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
