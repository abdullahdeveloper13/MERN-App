import { Application } from "../models/Application.js";
import { createCollectionWithIndexes, dropCollection } from "./helpers.js";
import type { Migration } from "./types.js";

export const migration: Migration = {
  name: "20261116000004-create-applications",
  async up() {
    await createCollectionWithIndexes(Application);
  },
  async down() {
    await dropCollection(Application);
  }
};
