 
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { migrations } from "../migrations/index.js";

const MIGRATIONS_COLLECTION = "_migrations";

type Command = "up" | "down" | "status";

type AppliedMigration = {
  name: string;
  appliedAt: Date;
};

function parseCommand(): Command {
  const command = process.argv[2] ?? "up";

  if (command !== "up" && command !== "down" && command !== "status") {
    throw new Error(`Unknown migration command "${command}". Use up, down, or status.`);
  }

  return command;
}

async function runUp(
  db: mongoose.mongo.Db,
  appliedNames: Set<string>,
  collection: mongoose.mongo.Collection<AppliedMigration>
): Promise<void> {
  let appliedCount = 0;

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) {
      continue;
    }

    console.log(`Applying ${migration.name}`);
    await migration.up(db);
    await collection.insertOne({ name: migration.name, appliedAt: new Date() });
    appliedCount += 1;
  }

  console.log(appliedCount === 0 ? "No pending migrations." : `Applied ${appliedCount} migration(s).`);
}

async function runDown(
  db: mongoose.mongo.Db,
  applied: AppliedMigration[],
  collection: mongoose.mongo.Collection<AppliedMigration>
): Promise<void> {
  const requestedSteps = Number(process.argv[3] ?? "1");

  if (!Number.isInteger(requestedSteps) || requestedSteps < 1) {
    throw new Error("The rollback step count must be a positive integer.");
  }

  const toRevert = [...applied].reverse().slice(0, requestedSteps);

  if (toRevert.length === 0) {
    console.log("No applied migrations to revert.");
    return;
  }

  for (const appliedMigration of toRevert) {
    const migration = migrations.find((item) => item.name === appliedMigration.name);

    if (!migration) {
      throw new Error(`Migration file not found for applied migration "${appliedMigration.name}".`);
    }

    console.log(`Reverting ${migration.name}`);
    await migration.down(db);
    await collection.deleteOne({ name: migration.name });
  }

  console.log(`Reverted ${toRevert.length} migration(s).`);
}

function printStatus(applied: AppliedMigration[]): void {
  const appliedAtByName = new Map(applied.map((item) => [item.name, item.appliedAt]));

  for (const migration of migrations) {
    const appliedAt = appliedAtByName.get(migration.name);
    const label = appliedAt ? `applied ${appliedAt.toISOString()}` : "pending";
    console.log(`${migration.name}  ${label}`);
  }
}

async function main(): Promise<void> {
  const command = parseCommand();

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database connection is not ready.");
  }

  const collection = db.collection<AppliedMigration>(MIGRATIONS_COLLECTION);
  const applied = await collection.find().sort({ appliedAt: 1 }).toArray();
  const appliedNames = new Set(applied.map((item) => item.name));

  if (command === "status") {
    printStatus(applied);
    return;
  }

  if (command === "up") {
    await runUp(db, appliedNames, collection);
    return;
  }

  await runDown(db, applied, collection);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
