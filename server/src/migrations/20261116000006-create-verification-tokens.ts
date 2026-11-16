import { VerificationToken } from "../models/VerificationToken.js";
import { createCollectionWithIndexes, dropCollection } from "./helpers.js";
import type { Migration } from "./types.js";

export const migration: Migration = {
  name: "20261116000006-create-verification-tokens",
  async up() {
    await createCollectionWithIndexes(VerificationToken);
  },
  async down() {
    await dropCollection(VerificationToken);
  }
};
