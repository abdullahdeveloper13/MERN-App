import { migration as createUsers } from "./20261116000001-create-users.js";
import { migration as createCompanies } from "./20261116000002-create-companies.js";
import { migration as createJobs } from "./20261116000003-create-jobs.js";
import { migration as createApplications } from "./20261116000004-create-applications.js";
import { migration as createRefreshTokens } from "./20261116000005-create-refresh-tokens.js";
import { migration as createVerificationTokens } from "./20261116000006-create-verification-tokens.js";
import { migration as syncModelIndexes } from "./20261116000007-sync-model-indexes.js";
import type { Migration } from "./types.js";

export const migrations: Migration[] = [
  createUsers,
  createCompanies,
  createJobs,
  createApplications,
  createRefreshTokens,
  createVerificationTokens,
  syncModelIndexes
].sort((a, b) => a.name.localeCompare(b.name));
