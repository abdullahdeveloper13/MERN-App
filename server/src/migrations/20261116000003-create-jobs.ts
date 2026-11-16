import { Job } from "../models/Job.js";
import { createCollectionWithIndexes, dropCollection } from "./helpers.js";
import type { Migration } from "./types.js";

export const migration: Migration = {
  name: "20261116000003-create-jobs",
  async up() {
    await createCollectionWithIndexes(Job);
  },
  async down() {
    await dropCollection(Job);
  }
};
