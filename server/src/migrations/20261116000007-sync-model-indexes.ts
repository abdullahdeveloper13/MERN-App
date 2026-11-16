import { Application } from "../models/Application.js";
import { AuditLog } from "../models/AuditLog.js";
import { Company } from "../models/Company.js";
import { Conversation } from "../models/Conversation.js";
import { Job } from "../models/Job.js";
import { JobSeekerProfile } from "../models/JobSeekerProfile.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { Review } from "../models/Review.js";
import { SavedJob } from "../models/SavedJob.js";
import { User } from "../models/User.js";
import { VerificationToken } from "../models/VerificationToken.js";
import type { Migration } from "./types.js";

const models = [
  User,
  Company,
  Job,
  Application,
  JobSeekerProfile,
  RecruiterProfile,
  SavedJob,
  Conversation,
  Message,
  Notification,
  Review,
  AuditLog,
  RefreshToken,
  VerificationToken
];

export const migration: Migration = {
  name: "20261116000007-sync-model-indexes",
  async up() {
    for (const model of models) {
      await model.syncIndexes();
    }
  },
  async down() {
    // Index synchronisation is intentionally not destructive on rollback.
  }
};
