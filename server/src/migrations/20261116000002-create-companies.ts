import { Company } from "../models/Company.js";
import { createCollectionWithIndexes, dropCollection } from "./helpers.js";
import type { Migration } from "./types.js";

export const migration: Migration = {
  name: "20261116000002-create-companies",
  async up() {
    await createCollectionWithIndexes(Company);
  },
  async down() {
    await dropCollection(Company);
  }
};
