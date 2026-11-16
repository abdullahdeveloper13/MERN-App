 
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

async function main() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the server environment before seeding.");
    process.exitCode = 1;
    return;
  }

  if (env.ADMIN_PASSWORD.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exitCode = 1;
    return;
  }

  await connectDatabase();

  const existing = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    if (existing.role !== "admin") {
      console.error("A non-admin account already uses ADMIN_EMAIL.");
      process.exitCode = 1;
      return;
    }

    console.log("Administrator already exists. No changes were made.");
    return;
  }

  await User.create({
    name: "Platform Administrator",
    email: env.ADMIN_EMAIL.toLowerCase(),
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
    role: "admin",
    isEmailVerified: true,
    isActive: true,
    authProvider: "local"
  });

  console.log("Administrator account created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
