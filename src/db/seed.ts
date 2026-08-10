import { seedUsers } from "./seedUser";

async function seedDatabase() {
  try {
    await seedUsers();
    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
}

seedDatabase();