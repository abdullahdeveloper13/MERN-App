import { RefreshToken } from "../models/RefreshToken.js";
import { createCollectionWithIndexes, dropCollection } from "./helpers.js";
import type { Migration } from "./types.js";

export const migration: Migration = {
  name: "20261116000005-create-refresh-tokens",
  async up() {
    await createCollectionWithIndexes(RefreshToken);
  },
  async down() {
    await dropCollection(RefreshToken);
  }
};
