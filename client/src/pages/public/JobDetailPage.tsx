import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Send,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, InlineAlert, PageLoader } from "../../components/ui/Feedback";
import { FieldError, Input, Label, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Job } from "../../types";
import { formatDate, formatSalary, timeAgo, titleCase } from "../../utils/format";

interface AnswerState {
  [question: string]: string;
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<AnswerState>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const jobQuery = useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: () => api.get<Job>(`/jobs/${id}`)
  });
  const saveMutation = useMutation({
    mutationFn: () => api.post(`/saved-jobs/${jobQuery.data?._id}`),
    onSuccess: () => toast("Job saved", { tone: "success" }),
    onError: (error: Error) => toast(error.message, { tone: "danger" })
  });
  const applyMutation = useMutation({
    mutationFn: (payload: {
      job: string;
      coverLetter?: string;
      answers: Array<{ question: string; answer: string }>;
    }) => api.post("/applications", payload),
    onSuccess: () => {
      setApplyOpen(false);
      toast("Application submitted", { description: "Track its status in your dashboard.", tone: "success" });
      navigate("/dashboard/applications");
    },
    onError: (error: Error) => setServerError(error.message)
  });

  if (jobQuery.isLoading) {
    return <PageLoader label="Loading job details" />;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Job not found"
          description="This role may have been closed or removed."
          action={
            <Link to="/jobs">
              <Button variant="outline">Browse all jobs</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const job = jobQuery.data;
  const salary = formatSalary(job.salaryRange?.min, job.salaryRange?.max, job.salaryRange?.currency);
  const canApply = user?.role === "job_seeker";
  const hasResume = Boolean((profile as { resumePublicId?: string } | null)?.resumePublicId);
  const questions = job.applicationQuestions ?? [];
  const deadlinePassed = job.applicationDeadline ? new Date(job.applicationDeadline).getTime() < Date.now() : false;

  const openApply = () => {
    if (!user) {
      navigate("/login", { state: { from: `/jobs/${job.slug || job._id}` } });
      return;
    }
    setServerError(null);
    setApplyOpen(true);
  };

  const submitApplication = () => {
    setServerError(null);
    applyMutation.mutate({
      job: job._id,
      coverLetter: coverLetter.trim() || undefined,
      answers: questions.map((question) => ({
        question: question.question,
        answer: (answers[question.question] ?? "").trim()
      }))
    });
  };

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" /> Back to jobs
          </Link>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {job.company?.logo ? (
                <img src={job.company.logo} alt="" className="h-16 w-16 rounded-2xl border border-slate-100 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
                  {job.company?.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">{job.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <Link to={`/companies/${job.company?.slug || job.company?._id}`} className="font-medium text-ink-700 hover:text-brand-700">
                      {job.company?.name}
                    </Link>
                  </span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location || "Flexible"}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> Posted {timeAgo(job.publishedAt ?? job.createdAt)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="brand">{titleCase(job.employmentType)}</Badge>
                  <Badge>{titleCase(job.workplaceType)}</Badge>
                  <Badge>{titleCase(job.experienceLevel)}</Badge>
                  {job.category ? <Badge tone="violet">{job.category}</Badge> : null}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {canApply ? (
                <Button variant="outline" size="md" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                  <Bookmark className="h-4 w-4" /> Save
                </Button>
              ) : null}
              <Button onClick={openApply} disabled={!canApply || deadlinePassed}>
                <Send className="h-4 w-4" /> Apply now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-5">
          {deadlinePassed ? (
            <InlineAlert tone="warning">The application deadline for this role has passed.</InlineAlert>
          ) : null}
          {!user ? (
            <InlineAlert tone="info">
              <Link to="/login" className="font-semibold underline">Sign in</Link> as a job seeker to apply.
            </InlineAlert>
          ) : !canApply ? (
            <InlineAlert tone="info">Only job seeker accounts can submit applications.</InlineAlert>
          ) : !hasResume ? (
            <InlineAlert tone="warning">
              Upload a resume before applying.{" "}
              <Link to="/dashboard/profile" className="font-semibold underline">Go to your profile</Link>.
            </InlineAlert>
          ) : null}

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">About this role</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-700">{job.description}</p>
          </Card>

          {job.responsibilities?.length ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-ink-900">Responsibilities</h2>
              <ul className="mt-3 space-y-2.5">
                {job.responsibilities.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-6 text-ink-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-600" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {job.requirements?.length ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-ink-900">Requirements</h2>
              <ul className="mt-3 space-y-2.5">
                {job.requirements.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-6 text-ink-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {job.skills?.length ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-ink-900">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => <Badge key={skill} tone="slate">{skill}</Badge>)}
              </div>
            </Card>
          ) : null}

          {questions.length ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-ink-900">Application questions</h2>
              <ol className="mt-3 space-y-3">
                {questions.map((question) => (
                  <li key={question.question} className="text-sm text-ink-700">
                    {question.question}
                    {question.required ? <span className="ml-1 text-rose-600">*</span> : null}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-ink-400">You'll answer these when you apply.</p>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Role overview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Salary</dt>
                <dd className="text-right font-medium text-ink-900">{salary}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Employment</dt>
                <dd className="text-right font-medium text-ink-900">{titleCase(job.employmentType)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Workplace</dt>
                <dd className="text-right font-medium text-ink-900">{titleCase(job.workplaceType)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Experience</dt>
                <dd className="text-right font-medium text-ink-900">{titleCase(job.experienceLevel)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Applicants</dt>
                <dd className="text-right font-medium text-ink-900">{job.applicationCount}</dd>
              </div>
              {job.applicationDeadline ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="inline-flex items-center gap-1.5 text-ink-500"><CalendarClock className="h-4 w-4" /> Deadline</dt>
                  <dd className="text-right font-medium text-ink-900">{formatDate(job.applicationDeadline)}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Company</h2>
            <div className="mt-4 flex items-center gap-3">
              {job.company?.logo ? (
                <img src={job.company.logo} alt="" className="h-11 w-11 rounded-xl border border-slate-100 object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-700">
                  {job.company?.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-ink-900">{job.company?.name}</p>
                <p className="text-xs text-ink-500">{job.company?.industry || "Company"}</p>
              </div>
            </div>
            {job.company?.verified ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-4 w-4" /> Verified employer
              </p>
            ) : null}
            {job.company?.website ? (
              <a
                href={job.company.website}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
              >
                Visit website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <Link
              to={`/companies/${job.company?.slug || job.company?._id}`}
              className="mt-4 block text-sm font-medium text-brand-700 hover:underline"
            >
              View company profile
            </Link>
          </Card>

          <Card className="p-5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
              <BriefcaseBusiness className="h-4 w-4" /> Hiring safely
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-400">
              Never share bank details or pay fees to apply. Report suspicious listings to platform
              administrators.
            </p>
          </Card>
        </aside>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Apply for ${job.title}`}
        description={`${job.company?.name} will receive your profile and resume.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={submitApplication} loading={applyMutation.isPending}>
              Submit application
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {serverError ? <InlineAlert tone="danger">{serverError}</InlineAlert> : null}
          <div>
            <Label htmlFor="coverLetter">Cover letter</Label>
            <Textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Briefly explain why you're a strong fit."
              maxLength={5000}
            />
          </div>
          {questions.map((question, index) => (
            <div key={question.question}>
              <Label htmlFor={`question-${index}`}>
                {question.question}
                {question.required ? <span className="ml-1 text-rose-600">*</span> : null}
              </Label>
              <Input
                id={`question-${index}`}
                value={answers[question.question] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({ ...current, [question.question]: event.target.value }))
                }
              />
              {question.required && !(answers[question.question] ?? "").trim() ? (
                <FieldError message="This answer is required." />
              ) : null}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
