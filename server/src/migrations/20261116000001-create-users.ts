import { User } from "../models/User.js";
import { createCollectionWithIndexes, dropCollection } from "./helpers.js";
import type { Migration } from "./types.js";

export const migration: Migration = {
  name: "20261116000001-create-users",
  async up() {
    await createCollectionWithIndexes(User);
  },
  async down() {
    await dropCollection(User);
  }
};
