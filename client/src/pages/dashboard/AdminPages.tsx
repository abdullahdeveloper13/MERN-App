import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Search,
  Settings2,
  ShieldCheck,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, InlineAlert, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { Input, Label, Select } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { api } from "../../lib/api";
import type { Company, Job, PaginationMeta, User } from "../../types";
import { formatDate, formatDateTime, titleCase } from "../../utils/format";

interface RecruiterProfileSummary {
  assignedCompanies?: Array<Pick<Company, "_id" | "name" | "slug">>;
  assignedJobs?: Array<Pick<Job, "_id" | "title" | "slug">>;
  specialization?: string | null;
  experienceYears?: number;
}

interface RecruiterUser extends User {
  recruiterProfile?: RecruiterProfileSummary | null;
}

interface AuditLogEntry {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  actor?: Pick<User, "name" | "email" | "role">;
  createdAt: string;
}

export function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const usersQuery = useQuery({
    queryKey: ["admin", "users", submitted, role, isActive, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (submitted) params.set("q", submitted);
      if (role) params.set("role", role);
      if (isActive) params.set("isActive", isActive);
      return api.getPage<User[]>(`/admin/users?${params.toString()}`);
    }
  });

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta as PaginationMeta | undefined;

  const toggle = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast(user.isActive ? "Account deactivated" : "Account activated", { tone: "success" });
    } catch (error) {
      toast((error as Error).message, { tone: "danger" });
    }
  };

  return (
    <div>
      <PageHeader title="Users" description="Review accounts, roles, and access status." />
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <form
            className="relative min-w-[200px] flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(query.trim());
              setPage(1);
            }}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="pl-10" aria-label="Search users" />
          </form>
          <div className="w-44">
            <Label htmlFor="roleFilter">Role</Label>
            <Select id="roleFilter" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="job_seeker">Job seeker</option>
              <option value="employer">Employer</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="w-40">
            <Label htmlFor="activeFilter">Status</Label>
            <Select id="activeFilter" value={isActive} onChange={(event) => { setIsActive(event.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      {usersQuery.isLoading ? (
        <Skeleton className="h-80" />
      ) : usersQuery.isError ? (
        <ErrorState message={(usersQuery.error as Error).message} onRetry={() => void usersQuery.refetch()} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Adjust the filters or search term." />
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Role</th><th>Email verified</th><th>Status</th><th>Joined</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <p className="font-medium text-ink-900">{user.name}</p>
                      <p className="text-xs text-ink-400">{user.email}</p>
                    </td>
                    <td><Badge tone={user.role === "admin" ? "violet" : "slate"}>{titleCase(user.role)}</Badge></td>
                    <td>{user.isEmailVerified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                    <td><Badge tone={user.isActive ? "green" : "rose"}>{user.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="text-ink-500">{formatDate(user.createdAt)}</td>
                    <td className="text-right">
                      <Button variant={user.isActive ? "ghost" : "outline"} size="sm" onClick={() => void toggle(user)}>
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? <div className="px-4 pb-4"><Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} /></div> : null}
        </Card>
      )}
    </div>
  );
}

export function AdminCompaniesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  const companiesQuery = useQuery({
    queryKey: ["admin", "companies", submitted, verified, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (submitted) params.set("q", submitted);
      if (verified) params.set("verified", verified);
      return api.getPage<Company[]>(`/admin/companies?${params.toString()}`);
    }
  });

  const companies = companiesQuery.data?.data ?? [];
  const meta = companiesQuery.data?.meta as PaginationMeta | undefined;

  const setVerification = async (company: Company, value: boolean) => {
    try {
      await api.patch(`/admin/companies/${company._id}/verify`, { verified: value });
      await queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      toast(value ? "Company verified" : "Company verification removed", { tone: "success" });
    } catch (error) {
      toast((error as Error).message, { tone: "danger" });
    }
  };

  return (
    <div>
      <PageHeader title="Companies" description="Review employer profiles and grant verified status." />
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <form className="relative min-w-[200px] flex-1" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()); setPage(1); }}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies" className="pl-10" aria-label="Search companies" />
          </form>
          <div className="w-40">
            <Label htmlFor="verifiedFilter">Verification</Label>
            <Select id="verifiedFilter" value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </Select>
          </div>
        </div>
      </Card>

      {companiesQuery.isLoading ? (
        <Skeleton className="h-80" />
      ) : companiesQuery.isError ? (
        <ErrorState message={(companiesQuery.error as Error).message} onRetry={() => void companiesQuery.refetch()} />
      ) : companies.length === 0 ? (
        <EmptyState title="No companies found" description="Companies created by employers will appear here." />
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Company</th><th>Industry</th><th>Owner</th><th>Status</th><th>Created</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id}>
                    <td>
                      <Link to={`/companies/${company.slug || company._id}`} className="font-medium text-ink-900 hover:text-brand-700">{company.name}</Link>
                      <p className="text-xs text-ink-400">{company.headquarters || "—"}</p>
                    </td>
                    <td className="text-ink-500">{company.industry || "—"}</td>
                    <td className="text-ink-500">{typeof company.owner === "object" ? company.owner.name : "—"}</td>
                    <td>{company.verified ? <Badge tone="green"><ShieldCheck className="h-3.5 w-3.5" /> Verified</Badge> : <Badge tone="amber">Unverified</Badge>}</td>
                    <td className="text-ink-500">{formatDate(company.createdAt)}</td>
                    <td className="text-right">
                      <Button variant="outline" size="sm" onClick={() => void setVerification(company, !company.verified)}>
                        {company.verified ? "Remove verification" : "Verify"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? <div className="px-4 pb-4"><Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} /></div> : null}
        </Card>
      )}
    </div>
  );
}

export function AdminJobsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const jobsQuery = useQuery({
    queryKey: ["admin", "jobs", submitted, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (submitted) params.set("q", submitted);
      if (status) params.set("status", status);
      return api.getPage<Job[]>(`/admin/jobs?${params.toString()}`);
    }
  });

  const jobs = jobsQuery.data?.data ?? [];
  const meta = jobsQuery.data?.meta as PaginationMeta | undefined;

  const moderate = async (job: Job, nextStatus: string) => {
    try {
      await api.patch(`/admin/jobs/${job._id}/moderate`, { status: nextStatus });
      await queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast("Job status updated", { tone: "success" });
    } catch (error) {
      toast((error as Error).message, { tone: "danger" });
    }
  };

  return (
    <div>
      <PageHeader title="Jobs" description="Moderate listings and control public visibility." />
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <form className="relative min-w-[200px] flex-1" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()); setPage(1); }}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search job title" className="pl-10" aria-label="Search jobs" />
          </form>
          <div className="w-40">
            <Label htmlFor="jobStatusFilter">Status</Label>
            <Select id="jobStatusFilter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
      </Card>

      {jobsQuery.isLoading ? (
        <Skeleton className="h-80" />
      ) : jobsQuery.isError ? (
        <ErrorState message={(jobsQuery.error as Error).message} onRetry={() => void jobsQuery.refetch()} />
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Published and draft jobs will appear here." />
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Role</th><th>Company</th><th>Status</th><th>Applicants</th><th>Created</th><th className="text-right">Moderate</th></tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td><Link to={`/jobs/${job.slug || job._id}`} className="font-medium text-ink-900 hover:text-brand-700">{job.title}</Link></td>
                    <td className="text-ink-500">{typeof job.company === "object" ? job.company?.name : "—"}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td className="text-ink-500">{job.applicationCount}</td>
                    <td className="text-ink-500">{formatDate(job.createdAt)}</td>
                    <td className="text-right">
                      <Select
                        aria-label={`Status for ${job.title}`}
                        value={job.status}
                        onChange={(event) => void moderate(job, event.target.value)}
                        className="ml-auto w-36 py-1.5 text-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? <div className="px-4 pb-4"><Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} /></div> : null}
        </Card>
      )}
    </div>
  );
}

export function AdminRecruitersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<RecruiterUser | null>(null);
  const [assignedCompanies, setAssignedCompanies] = useState<string[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recruitersQuery = useQuery({
    queryKey: ["admin", "recruiters"],
    queryFn: () => api.getPage<RecruiterUser[]>("/admin/recruiters?limit=100")
  });
  const companiesQuery = useQuery({
    queryKey: ["admin", "companies", "options"],
    queryFn: () => api.getPage<Company[]>("/admin/companies?limit=100")
  });
  const jobsQuery = useQuery({
    queryKey: ["admin", "jobs", "options"],
    queryFn: () => api.getPage<Job[]>("/admin/jobs?limit=100")
  });

  const recruiters = recruitersQuery.data?.data ?? [];
  const companies = companiesQuery.data?.data ?? [];
  const jobs = jobsQuery.data?.data ?? [];

  useEffect(() => {
    if (!selected) return;
    setAssignedCompanies(selected.recruiterProfile?.assignedCompanies?.map((company) => company._id) ?? []);
    setAssignedJobs(selected.recruiterProfile?.assignedJobs?.map((job) => job._id) ?? []);
    setError(null);
  }, [selected]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/recruiters/${selected._id}/assignments`, {
        assignedCompanies,
        assignedJobs
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "recruiters"] });
      toast("Assignments updated", { tone: "success" });
      setSelected(null);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (list: string[], setList: (value: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  };

  return (
    <div>
      <PageHeader title="Recruiters" description="Assign recruiters to companies and jobs." />
      {recruitersQuery.isLoading ? (
        <Skeleton className="h-80" />
      ) : recruitersQuery.isError ? (
        <ErrorState message={(recruitersQuery.error as Error).message} onRetry={() => void recruitersQuery.refetch()} />
      ) : recruiters.length === 0 ? (
        <EmptyState title="No recruiters yet" description="Recruiter accounts will appear here." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {recruiters.map((recruiter) => (
            <Card key={recruiter._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{recruiter.name}</p>
                  <p className="text-sm text-ink-500">{recruiter.email}</p>
                </div>
                <Badge tone={recruiter.isActive ? "green" : "rose"}>{recruiter.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-500">
                <span>{recruiter.recruiterProfile?.assignedCompanies?.length ?? 0} companies</span>
                <span>·</span>
                <span>{recruiter.recruiterProfile?.assignedJobs?.length ?? 0} jobs</span>
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelected(recruiter)}>
                Manage assignments
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Assignments for ${selected.name}` : "Assignments"}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={() => void save()} loading={saving}>Save assignments</Button>
          </>
        }
      >
        {error ? <div className="mb-3"><InlineAlert tone="danger">{error}</InlineAlert></div> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">Companies</p>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {companies.length === 0 ? <p className="p-2 text-xs text-ink-400">No companies</p> : companies.map((company) => (
                <label key={company._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={assignedCompanies.includes(company._id)}
                    onChange={() => toggle(assignedCompanies, setAssignedCompanies, company._id)}
                  />
                  <span className="truncate">{company.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">Jobs</p>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {jobs.length === 0 ? <p className="p-2 text-xs text-ink-400">No jobs</p> : jobs.map((job) => (
                <label key={job._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={assignedJobs.includes(job._id)}
                    onChange={() => toggle(assignedJobs, setAssignedJobs, job._id)}
                  />
                  <span className="truncate">{job.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const logsQuery = useQuery({
    queryKey: ["admin", "audit-logs", page],
    queryFn: () => api.getPage<AuditLogEntry[]>(`/admin/audit-logs?limit=30&page=${page}`)
  });
  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta as PaginationMeta | undefined;

  return (
    <div>
      <PageHeader title="Audit logs" description="A chronological record of administrative actions." />
      {logsQuery.isLoading ? (
        <Skeleton className="h-80" />
      ) : logsQuery.isError ? (
        <ErrorState message={(logsQuery.error as Error).message} onRetry={() => void logsQuery.refetch()} />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit events yet" description="Moderation and account changes are recorded here." />
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Action</th><th>Resource</th><th>Actor</th><th>Details</th><th>When</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="font-medium text-ink-900">{log.action.replaceAll(".", " · ").replaceAll("_", " ")}</td>
                    <td className="text-ink-500">{log.resourceType}</td>
                    <td className="text-ink-500">
                      {log.actor ? (
                        <>
                          <p>{log.actor.name}</p>
                          <p className="text-xs text-ink-400">{titleCase(log.actor.role)}</p>
                        </>
                      ) : "System"}
                    </td>
                    <td className="max-w-xs truncate text-xs text-ink-400">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                    <td className="text-ink-500">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? <div className="px-4 pb-4"><Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} /></div> : null}
        </Card>
      )}
    </div>
  );
}

interface AdminSettings {
  environment: string;
  integrations: {
    email: boolean;
    cloudinary: boolean;
    google: boolean;
    ai: boolean;
  };
  aiProvider: string | null;
  databaseName: string;
}

export function AdminSettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<AdminSettings>("/admin/settings")
  });
  const settings = settingsQuery.data;

  return (
    <div>
      <PageHeader title="Platform settings" description="Read-only status of server integrations." />

      {settingsQuery.isLoading ? (
        <Skeleton className="h-64" />
      ) : settingsQuery.isError || !settings ? (
        <ErrorState message={(settingsQuery.error as Error)?.message} onRetry={() => void settingsQuery.refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Email delivery", enabled: settings.integrations.email, icon: CheckCircle2 },
              { label: "Cloudinary", enabled: settings.integrations.cloudinary, icon: CheckCircle2 },
              { label: "Google sign-in", enabled: settings.integrations.google, icon: CheckCircle2 },
              { label: "AI provider", enabled: settings.integrations.ai, icon: Settings2 }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="p-5">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${item.enabled ? "text-emerald-600" : "text-ink-300"}`} />
                    <Badge tone={item.enabled ? "green" : "slate"}>{item.enabled ? "Configured" : "Off"}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink-900">{item.label}</p>
                </Card>
              );
            })}
          </div>

          <Card className="mt-4">
            <CardHeader title="Runtime" description="Values are managed through environment variables." />
            <CardBody className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-ink-400">Environment</p>
                <p className="mt-1 font-semibold capitalize text-ink-900">{settings.environment}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-ink-400">Database</p>
                <p className="mt-1 font-semibold text-ink-900">{settings.databaseName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-ink-400">AI provider</p>
                <p className="mt-1 font-semibold text-ink-900">{settings.aiProvider ?? "Not configured"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-ink-400">AI availability</p>
                <p className="mt-1 font-semibold text-ink-900">{settings.integrations.ai ? "Enabled" : "Disabled"}</p>
              </div>
            </CardBody>
          </Card>

          <div className="mt-4">
            <InlineAlert tone="info">
              Integration credentials are intentionally not displayed. Update them in the server
              environment and restart the API to apply changes.
            </InlineAlert>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminQuickLinks() {
  const links = [
    { to: "/dashboard/admin/users", label: "Users", icon: Users },
    { to: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
    { to: "/dashboard/admin/jobs", label: "Jobs", icon: BriefcaseBusiness }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.to} to={link.to} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-slate-50">
            <Icon className="h-4 w-4" /> {link.label}
          </Link>
        );
      })}
    </div>
  );
}
