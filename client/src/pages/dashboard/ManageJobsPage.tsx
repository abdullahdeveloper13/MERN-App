import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, InlineAlert, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { Input, Label, Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Company, Job, PaginationMeta } from "../../types";
import { formatDate } from "../../utils/format";

interface ApplicationQuestion {
  question: string;
  required: boolean;
}

interface JobForm {
  title: string;
  description: string;
  category: string;
  location: string;
  employmentType: string;
  workplaceType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  responsibilities: string;
  requirements: string;
  skills: string;
  status: "draft" | "published";
  applicationDeadline: string;
  questions: ApplicationQuestion[];
}

const emptyForm: JobForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  employmentType: "full_time",
  workplaceType: "onsite",
  experienceLevel: "mid",
  salaryMin: "",
  salaryMax: "",
  currency: "USD",
  responsibilities: "",
  requirements: "",
  skills: "",
  status: "draft",
  applicationDeadline: "",
  questions: []
};

export function ManageJobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(searchParams.get("create") === "1");
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [companyId, setCompanyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ["companies", "mine"],
    queryFn: () => api.get<Company | Company[]>("/companies/mine")
  });
  const companies = useMemo(
    () => (Array.isArray(companiesQuery.data)
      ? companiesQuery.data
      : companiesQuery.data
        ? [companiesQuery.data]
        : []),
    [companiesQuery.data]
  );

  const jobsQuery = useQuery({
    queryKey: ["jobs", "mine", page, status],
    queryFn: () => api.getPage<Job[]>(`/jobs/mine?limit=15&page=${page}${status ? `&status=${status}` : ""}`)
  });

  const jobs = jobsQuery.data?.data ?? [];
  const meta = jobsQuery.data?.meta as PaginationMeta | undefined;

  useEffect(() => {
    const firstCompany = companies[0];
    if (!companyId && firstCompany) {
      setCompanyId(firstCompany._id);
    }
  }, [companies, companyId]);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    if (searchParams.get("create")) {
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setCompanyId(typeof job.company === "string" ? job.company : job.company._id);
    setForm({
      title: job.title,
      description: job.description,
      category: job.category ?? "",
      location: job.location ?? "",
      employmentType: job.employmentType,
      workplaceType: job.workplaceType,
      experienceLevel: job.experienceLevel,
      salaryMin: job.salaryRange?.min ? String(job.salaryRange.min) : "",
      salaryMax: job.salaryRange?.max ? String(job.salaryRange.max) : "",
      currency: job.salaryRange?.currency || "USD",
      responsibilities: (job.responsibilities ?? []).join("\n"),
      requirements: (job.requirements ?? []).join("\n"),
      skills: (job.skills ?? []).join(", "),
      status: job.status === "published" ? "published" : "draft",
      applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : "",
      questions: job.applicationQuestions ?? []
    });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);

    if (!companyId) {
      setError("Select a company for this job.");
      return;
    }

    if (form.title.trim().length < 3 || form.description.trim().length < 20) {
      setError("Add a title and a description of at least 20 characters.");
      return;
    }

    setSaving(true);
    const payload = {
      companyId,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || undefined,
      location: form.location.trim() || undefined,
      employmentType: form.employmentType,
      workplaceType: form.workplaceType,
      experienceLevel: form.experienceLevel,
      salaryRange: {
        min: form.salaryMin ? Number(form.salaryMin) : undefined,
        max: form.salaryMax ? Number(form.salaryMax) : undefined,
        currency: form.currency || "USD"
      },
      responsibilities: splitLines(form.responsibilities),
      requirements: splitLines(form.requirements),
      skills: form.skills.split(",").map((value) => value.trim()).filter(Boolean),
      status: form.status,
      applicationDeadline: form.applicationDeadline
        ? new Date(`${form.applicationDeadline}T23:59:59`).toISOString()
        : undefined,
      applicationQuestions: form.questions
        .filter((question) => question.question.trim())
        .map((question) => ({ question: question.question.trim(), required: question.required }))
    };

    try {
      if (editing) {
        await api.patch(`/jobs/${editing._id}`, payload);
      } else {
        await api.post("/jobs", payload);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
      toast(editing ? "Job updated" : "Job created", { tone: "success" });
      closeModal();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (job: Job, nextStatus: string) => {
    try {
      await api.patch(`/jobs/${job._id}`, { status: nextStatus });
      await queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      toast("Job status updated", { tone: "success" });
    } catch (statusError) {
      toast((statusError as Error).message, { tone: "danger" });
    }
  };

  const remove = async (job: Job) => {
    if (!window.confirm(`Delete "${job.title}"? This also removes its applications and saved records.`)) {
      return;
    }

    try {
      await api.delete(`/jobs/${job._id}`);
      await queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      toast("Job deleted", { tone: "success" });
    } catch (deleteError) {
      toast((deleteError as Error).message, { tone: "danger" });
    }
  };

  return (
    <div>
      <PageHeader
        title={user?.role === "recruiter" ? "Assigned jobs" : "Manage jobs"}
        description="Create, publish, pause, and close roles."
        action={
          <Button size="sm" onClick={openCreate} disabled={companies.length === 0}>
            <Plus className="h-4 w-4" /> Post a job
          </Button>
        }
      />

      {companies.length === 0 && !companiesQuery.isLoading ? (
        <div className="mb-4">
          <InlineAlert tone="warning">
            {user?.role === "employer" ? (
              <>Create a company profile before posting a job. <Link to="/dashboard/employer/company" className="font-semibold underline">Set up company</Link></>
            ) : (
              "No companies are assigned to you yet. Contact an administrator."
            )}
          </InlineAlert>
        </div>
      ) : null}

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <Label htmlFor="statusFilter">Status</Label>
            <Select
              id="statusFilter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
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
        <EmptyState
          title="No jobs yet"
          description="Create a draft, review it, then publish when ready."
          action={<Button size="sm" onClick={openCreate} disabled={companies.length === 0}>Post a job</Button>}
        />
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Role</th><th>Company</th><th>Status</th><th>Applicants</th><th>Created</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <Link to={`/jobs/${job.slug || job._id}`} className="font-medium text-ink-900 hover:text-brand-700">
                        {job.title}
                      </Link>
                      <p className="text-xs text-ink-400">{job.location || "Location flexible"}</p>
                    </td>
                    <td className="text-ink-500">{typeof job.company === "object" ? job.company?.name : "—"}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td className="text-ink-500">{job.applicationCount}</td>
                    <td className="text-ink-500">{formatDate(job.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {job.status !== "published" ? (
                          <Button variant="ghost" size="sm" onClick={() => void changeStatus(job, "published")}>Publish</Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => void changeStatus(job, "paused")}>Pause</Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(job)} aria-label="Edit job">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void remove(job)} aria-label="Delete job">
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="px-4 pb-4">
              <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
            </div>
          ) : null}
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit job" : "Post a job"}
        description="Only published roles appear in public search."
        className="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={() => void save()} loading={saving}>{editing ? "Save changes" : "Create job"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={form.title}
                onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))}
                placeholder="Senior Frontend Engineer"
              />
            </div>
            <div>
              <Label htmlFor="jobCompany">Company</Label>
              <Select
                id="jobCompany"
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
              >
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>{company.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="jobStatus">Status</Label>
              <Select
                id="jobStatus"
                value={form.status}
                onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as "draft" | "published" }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="jobDescription">Description</Label>
              <Textarea
                id="jobDescription"
                value={form.description}
                onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
                placeholder="Describe the role, team, and impact."
                className="min-h-[140px]"
              />
            </div>
            <div>
              <Label htmlFor="jobCategory">Category</Label>
              <Input
                id="jobCategory"
                value={form.category}
                onChange={(event) => setForm((value) => ({ ...value, category: event.target.value }))}
                placeholder="Engineering"
              />
            </div>
            <div>
              <Label htmlFor="jobLocation">Location</Label>
              <Input
                id="jobLocation"
                value={form.location}
                onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))}
                placeholder="Remote / New York"
              />
            </div>
            <div>
              <Label htmlFor="employmentType">Employment type</Label>
              <Select
                id="employmentType"
                value={form.employmentType}
                onChange={(event) => setForm((value) => ({ ...value, employmentType: event.target.value }))}
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="workplaceType">Workplace</Label>
              <Select
                id="workplaceType"
                value={form.workplaceType}
                onChange={(event) => setForm((value) => ({ ...value, workplaceType: event.target.value }))}
              >
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="experienceLevel">Experience level</Label>
              <Select
                id="experienceLevel"
                value={form.experienceLevel}
                onChange={(event) => setForm((value) => ({ ...value, experienceLevel: event.target.value }))}
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="deadline">Application deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.applicationDeadline}
                onChange={(event) => setForm((value) => ({ ...value, applicationDeadline: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div>
                <Label htmlFor="salaryMin">Salary min</Label>
                <Input id="salaryMin" type="number" min={0} value={form.salaryMin} onChange={(event) => setForm((value) => ({ ...value, salaryMin: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="salaryMax">Salary max</Label>
                <Input id="salaryMax" type="number" min={0} value={form.salaryMax} onChange={(event) => setForm((value) => ({ ...value, salaryMax: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select id="currency" value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value }))}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="PKR">PKR</option>
                  <option value="AED">AED</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={form.responsibilities}
                onChange={(event) => setForm((value) => ({ ...value, responsibilities: event.target.value }))}
                placeholder="One item per line"
              />
            </div>
            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={form.requirements}
                onChange={(event) => setForm((value) => ({ ...value, requirements: event.target.value }))}
                placeholder="One item per line"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                value={form.skills}
                onChange={(event) => setForm((value) => ({ ...value, skills: event.target.value }))}
                placeholder="React, TypeScript, Node.js"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Application questions</p>
                <p className="text-xs text-ink-400">Optional questions shown in the apply modal.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setForm((value) => ({ ...value, questions: [...value.questions, { question: "", required: false }] }))}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {form.questions.length > 0 ? (
              <div className="mt-3 space-y-2">
                {form.questions.map((question, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <Input
                      value={question.question}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          questions: value.questions.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, question: event.target.value } : item
                          )
                        }))
                      }
                      placeholder="Question"
                      className="min-w-[200px] flex-1"
                    />
                    <label className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            questions: value.questions.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, required: event.target.checked } : item
                            )
                          }))
                        }
                      />
                      Required
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove question"
                      onClick={() =>
                        setForm((value) => ({
                          ...value,
                          questions: value.questions.filter((_, itemIndex) => itemIndex !== index)
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {!editing ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-ink-400">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> You can save as a draft and publish later.
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
