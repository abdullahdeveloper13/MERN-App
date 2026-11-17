export type UserRole = "job_seeker" | "employer" | "recruiter" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  phone?: string | null;
  location?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  authProvider: "local" | "google";
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  companySize?: string | null;
  headquarters?: string | null;
  foundedYear?: number | null;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  owner?: User | string;
  verified: boolean;
  createdAt: string;
}

export interface SalaryRange {
  min?: number | null;
  max?: number | null;
  currency?: string;
}

export interface Job {
  _id: string;
  title: string;
  slug: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  location?: string | null;
  employmentType: string;
  workplaceType: string;
  salaryRange?: SalaryRange;
  experienceLevel: string;
  category?: string | null;
  company: Company;
  postedBy?: Pick<User, "_id" | "name" | "avatar"> | string;
  assignedRecruiter?: Pick<User, "_id" | "name" | "email"> | string | null;
  status: string;
  applicationDeadline?: string | null;
  applicationQuestions?: Array<{ question: string; required: boolean }>;
  applicationCount: number;
  viewCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface EducationItem {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CertificationItem {
  name: string;
  issuer?: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface JobSeekerProfile {
  _id?: string;
  user?: string;
  headline?: string | null;
  professionalSummary?: string | null;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  portfolio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  resumePublicId?: string | null;
  resumeFileName?: string | null;
  resumeAccessUrl?: string;
  preferredJobTypes: string[];
  preferredLocations: string[];
  salaryExpectation?: {
    amount?: number;
    currency?: string;
    period?: string;
  } | null;
  completion?: number;
}

export interface RecruiterProfile {
  _id?: string;
  user?: string;
  specialization?: string | null;
  experienceYears: number;
  assignedCompanies: Company[];
  assignedJobs: Array<Pick<Job, "_id" | "title" | "slug" | "status">>;
  performanceMetrics?: {
    placements: number;
    interviews: number;
    activeCandidates: number;
  };
}

export type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface Application {
  _id: string;
  job: Job;
  applicant: User;
  company: Company;
  applicantProfile?: JobSeekerProfile | null;
  resume?: { publicId: string; fileName?: string };
  resumeAccessUrl?: string;
  coverLetter?: string | null;
  answers?: Array<{ question: string; answer: string }>;
  status: ApplicationStatus;
  recruiterNotes?: string | null;
  interviewDetails?: {
    scheduledAt?: string | null;
    durationMinutes?: number | null;
    mode?: string | null;
    location?: string | null;
    notes?: string | null;
  } | null;
  appliedAt: string;
  statusUpdatedAt: string;
}

export interface SavedJob {
  _id: string;
  job: Job;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  relatedJob?: Pick<Job, "_id" | "title" | "slug"> | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: "application" | "interview" | "message" | "job" | "system";
  relatedResource?: { type?: string; id?: string };
  isRead: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface MeResponse {
  user: User | null;
  profile: JobSeekerProfile | RecruiterProfile | null;
  company: Company | null;
}

export interface DashboardStats {
  profileCompletion?: number;
  statusCounts?: Record<string, number>;
  recentApplications?: Application[];
  savedJobsCount?: number;
  upcomingInterviews?: Application[];
  recommendedJobs?: Job[];
  unreadNotifications?: number;
  activeJobs?: number;
  totalJobs?: number;
  totalApplications?: number;
  newApplications?: number;
  recentJobs?: Job[];
  assignedCompanies?: Company[];
  assignedJobsCount?: number;
  candidatesCount?: number;
  performanceMetrics?: RecruiterProfile["performanceMetrics"];
}

export interface AdminAnalytics {
  users: {
    total: number;
    jobSeekers: number;
    employers: number;
    recruiters: number;
    admins: number;
    newLast30Days: number;
  };
  companies: { total: number; verified: number };
  jobs: { published: number; total: number };
  applications: {
    total: number;
    newLast30Days: number;
    statusBreakdown: Array<{ _id: string; count: number }>;
  };
  topCategories: Array<{ name: string; count: number }>;
}

export interface AuditLog {
  _id: string;
  actor?: Pick<User, "_id" | "name" | "email" | "role"> | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
