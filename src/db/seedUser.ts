import prisma from "./prisma";

async function seedUsers() {
  console.log("🌱 Seeding database...");

  // Optional: clear existing data so the seed is repeatable.
  // Order matters because of foreign keys.
  await prisma.transactionCategory.deleteMany();
  await prisma.transactionType.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const workspaceDefinitions = [
    {
      name: "Personal",
      currency: "EUR" as const,
    },
    {
      name: "Acme Inc.",
      currency: "USD" as const,
    },
    {
      name: "Side Project",
      currency: "EUR" as const,
    },
  ];

  const categoryDefinitions = {
    income: [
      {
        name: "Salary",
        description: "Salary and employment income",
      },
      {
        name: "Freelance",
        description: "Freelance and contract income",
      },
      {
        name: "Other Income",
        description: "Other sources of income",
      },
    ],
    expense: [
      {
        name: "Housing",
        description: "Rent, mortgage, and housing costs",
      },
      {
        name: "Food",
        description: "Groceries, restaurants, and food",
      },
      {
        name: "Transport",
        description: "Fuel, public transport, and travel",
      },
    ],
  };

  const workspaces = [];

  for (const definition of workspaceDefinitions) {
    const workspace = await prisma.workspace.create({
      data: {
        name: definition.name,
        currency: definition.currency,

        // One wallet for each workspace
        wallets: {
          create: { name: "Main" },
        },

        transactionTypes: {
          create: [
            {
              name: "Income",
              direction: 1,
              transactionCategories: {
                create: categoryDefinitions.income,
              },
            },
            {
              name: "Expense",
              direction: -1,
              transactionCategories: {
                create: categoryDefinitions.expense,
              },
            },
          ],
        },
      },
    });

    workspaces.push(workspace);
  }

  // 10 users total, distributed 4 / 3 / 3.
  //
  // Replace these hashes with bcrypt/argon hashes if your authentication
  // code expects a specific hashing algorithm.
  const users = [
    {
      email: "alice@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[0].id,
    },
    {
      email: "bob@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[0].id,
    },
    {
      email: "charlie@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[0].id,
    },
    {
      email: "diana@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[0].id,
    },

    {
      email: "eve@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[1].id,
    },
    {
      email: "frank@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[1].id,
    },
    {
      email: "grace@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[1].id,
    },

    {
      email: "henry@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[2].id,
    },
    {
      email: "isabel@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[2].id,
    },
    {
      email: "jack@example.com",
      passwordHash: "seed-password-hash",
      workspaceId: workspaces[2].id,
    },
  ];

  await prisma.user.createMany({
    data: users,
  });

  console.log("✅ Seed complete");
  console.log(`   Workspaces: ${workspaces.length}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Transaction types: ${workspaces.length * 2}`);
  console.log(`   Categories: ${workspaces.length * 2 * 3}`);
  console.log(`   Wallets: ${workspaces.length}`);
}

export { seedUsers };
