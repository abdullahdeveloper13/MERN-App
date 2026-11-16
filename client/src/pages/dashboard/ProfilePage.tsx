import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, FileText, GraduationCap, Plus, Save, Trash2, Upload, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { ErrorState, InlineAlert, PageHeader, PageLoader } from "../../components/ui/Feedback";
import { Input, Label, Select, Textarea } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api, getApiOrigin } from "../../lib/api";
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  JobSeekerProfile,
  RecruiterProfile
} from "../../types";

const emptyExperience: ExperienceItem = { title: "", company: "", location: "", description: "" };
const emptyEducation: EducationItem = { institution: "", degree: "", fieldOfStudy: "", description: "" };
const emptyCertification: CertificationItem = { name: "", issuer: "", credentialUrl: "" };

const emptyProfile: JobSeekerProfile = {
  headline: "",
  professionalSummary: "",
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  portfolio: "",
  linkedinUrl: "",
  githubUrl: "",
  preferredJobTypes: [],
  preferredLocations: [],
  salaryExpectation: { amount: undefined, currency: "USD", period: "yearly" }
};

export function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<JobSeekerProfile>(emptyProfile);
  const [recruiterForm, setRecruiterForm] = useState({ specialization: "", experienceYears: 0 });
  const [skillsText, setSkillsText] = useState("");
  const [locationsText, setLocationsText] = useState("");
  const [jobTypesText, setJobTypesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const resumeInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => api.get<JobSeekerProfile | RecruiterProfile | { company?: unknown }>("/profiles/me"),
    enabled: Boolean(user)
  });
  const profile = profileQuery.data as JobSeekerProfile | undefined;

  useEffect(() => {
    if (!profileQuery.data) return;
    if (user?.role === "job_seeker") {
      const data = profileQuery.data as JobSeekerProfile;
      setForm({
        ...emptyProfile,
        ...data,
        experience: data.experience ?? [],
        education: data.education ?? [],
        certifications: data.certifications ?? []
      });
      setSkillsText((data.skills ?? []).join(", "));
      setLocationsText((data.preferredLocations ?? []).join(", "));
      setJobTypesText((data.preferredJobTypes ?? []).join(", "));
    }
    if (user?.role === "recruiter") {
      const data = profileQuery.data as RecruiterProfile;
      setRecruiterForm({
        specialization: data.specialization ?? "",
        experienceYears: data.experienceYears ?? 0
      });
    }
  }, [profileQuery.data, user?.role]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] }),
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (user?.role === "job_seeker") {
        const payload = {
          headline: form.headline || undefined,
          professionalSummary: form.professionalSummary || undefined,
          skills: skillsText.split(",").map((item) => item.trim()).filter(Boolean),
          experience: form.experience.map(cleanExperience),
          education: form.education.map(cleanEducation),
          certifications: form.certifications.map(cleanCertification),
          portfolio: form.portfolio || undefined,
          linkedinUrl: form.linkedinUrl || undefined,
          githubUrl: form.githubUrl || undefined,
          preferredJobTypes: jobTypesText.split(",").map((item) => item.trim()).filter(Boolean),
          preferredLocations: locationsText.split(",").map((item) => item.trim()).filter(Boolean),
          salaryExpectation: {
            amount: form.salaryExpectation?.amount || undefined,
            currency: form.salaryExpectation?.currency || "USD",
            period: form.salaryExpectation?.period || "yearly"
          }
        };
        // Remove optional empty URL strings because the API validates URL format.
        for (const key of ["portfolio", "linkedinUrl", "githubUrl"] as const) {
          if (!payload[key]) delete payload[key];
        }
        await api.patch("/profiles/me", payload);
      } else if (user?.role === "recruiter") {
        await api.patch("/profiles/me", {
          specialization: recruiterForm.specialization || undefined,
          experienceYears: Number(recruiterForm.experienceYears) || 0
        });
      }

      await invalidate();
      toast("Profile saved", { tone: "success" });
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("resume", file);
      await api.upload("/profiles/me/resume", data);
      await invalidate();
      toast("Resume uploaded", { tone: "success" });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (resumeInput.current) resumeInput.current.value = "";
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("avatar", file);
      await api.upload("/profiles/me/avatar", data);
      await invalidate();
      toast("Photo updated", { tone: "success" });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  };

  if (!user) return null;

  if (profileQuery.isLoading) {
    return <PageLoader label="Loading profile" />;
  }

  if (profileQuery.isError) {
    return (
      <div>
        <PageHeader title="Profile" />
        <ErrorState message={(profileQuery.error as Error).message} onRetry={() => void profileQuery.refetch()} />
      </div>
    );
  }

  if (user.role === "employer") {
    return (
      <div>
        <PageHeader title="Profile" description="Employer accounts manage their public profile through the company page." />
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700"><BriefcaseBusiness className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold text-ink-900">Company profile</p>
                <p className="mt-0.5 text-sm text-ink-500">Edit your company details, logo, and public information.</p>
              </div>
            </div>
            <Link to="/dashboard/employer/company"><Button>Manage company</Button></Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div>
        <PageHeader title="Profile" />
        <InlineAlert tone="info">Administrator accounts do not have a public profile.</InlineAlert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={user.role === "job_seeker" ? "Your profile" : "Recruiter profile"}
        description={
          user.role === "job_seeker"
            ? "Employers see this information when you apply. Keep it accurate and current."
            : "Your specialization and experience are visible to administrators and assigned teams."
        }
        action={
          <Button onClick={() => void save()} loading={saving}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        }
      />

      {error ? <div className="mb-4"><InlineAlert tone="danger">{error}</InlineAlert></div> : null}

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={user.avatar} name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-ink-900">{user.name}</p>
              <Badge tone="brand">{user.role.replaceAll("_", " ")}</Badge>
            </div>
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
          <div>
            <input
              ref={avatarInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <Button variant="outline" size="sm" onClick={() => avatarInput.current?.click()} loading={uploading}>
              <Upload className="h-4 w-4" /> Change photo
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-500">Profile completion</span>
            <span className="font-semibold text-ink-900">{profile?.completion ?? 0}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${profile?.completion ?? 0}%` }} />
          </div>
        </div>
      </div>

      {user.role === "job_seeker" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Basics" description="A short introduction for employers." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="headline">Professional headline</Label>
                <Input
                  id="headline"
                  value={form.headline ?? ""}
                  onChange={(event) => setForm((value) => ({ ...value, headline: event.target.value }))}
                  placeholder="e.g. Senior Frontend Engineer"
                  maxLength={180}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="summary">Professional summary</Label>
                <Textarea
                  id="summary"
                  value={form.professionalSummary ?? ""}
                  onChange={(event) => setForm((value) => ({ ...value, professionalSummary: event.target.value }))}
                  placeholder="Summarize your experience, strengths, and what you're looking for."
                  maxLength={5000}
                />
              </div>
              <div>
                <Label htmlFor="skills">Skills</Label>
                <Input
                  id="skills"
                  value={skillsText}
                  onChange={(event) => setSkillsText(event.target.value)}
                  placeholder="React, TypeScript, Node.js"
                />
                <p className="mt-1 text-xs text-ink-400">Separate skills with commas.</p>
              </div>
              <div>
                <Label htmlFor="locations">Preferred locations</Label>
                <Input
                  id="locations"
                  value={locationsText}
                  onChange={(event) => setLocationsText(event.target.value)}
                  placeholder="Remote, London, Berlin"
                />
              </div>
              <div>
                <Label htmlFor="jobTypes">Preferred job types</Label>
                <Input
                  id="jobTypes"
                  value={jobTypesText}
                  onChange={(event) => setJobTypesText(event.target.value)}
                  placeholder="full_time, contract"
                />
              </div>
              <div>
                <Label htmlFor="currency">Salary expectation</Label>
                <div className="flex gap-2">
                  <Input
                    id="salaryAmount"
                    type="number"
                    min={0}
                    value={form.salaryExpectation?.amount ?? ""}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        salaryExpectation: {
                          ...(value.salaryExpectation ?? {}),
                          amount: Number(event.target.value) || undefined
                        }
                      }))
                    }
                    placeholder="Amount"
                  />
                  <Select
                    value={form.salaryExpectation?.currency ?? "USD"}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        salaryExpectation: {
                          ...(value.salaryExpectation ?? {}),
                          currency: event.target.value
                        }
                      }))
                    }
                    aria-label="Currency"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PKR">PKR</option>
                    <option value="AED">AED</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input
                  id="portfolio"
                  type="url"
                  value={form.portfolio ?? ""}
                  onChange={(event) => setForm((value) => ({ ...value, portfolio: event.target.value }))}
                  placeholder="https://"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={form.linkedinUrl ?? ""}
                  onChange={(event) => setForm((value) => ({ ...value, linkedinUrl: event.target.value }))}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  type="url"
                  value={form.githubUrl ?? ""}
                  onChange={(event) => setForm((value) => ({ ...value, githubUrl: event.target.value }))}
                  placeholder="https://github.com/..."
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Resume" description="PDF or Word document, up to 10 MB." />
            <CardBody>
              <input
                ref={resumeInput}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadResume(file);
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-100 p-2 text-ink-500"><FileText className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {profile?.resumeFileName || "No resume uploaded"}
                    </p>
                    <p className="text-xs text-ink-400">
                      {profile?.resumePublicId ? "Employers with application access can view it." : "You need a resume to apply."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {profile?.resumeAccessUrl ? (
                    <a
                      href={`${getApiOrigin()}${profile.resumeAccessUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center rounded-xl border border-slate-300 px-3 text-xs font-semibold text-ink-700 hover:bg-slate-50"
                    >
                      View resume
                    </a>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => resumeInput.current?.click()} loading={uploading}>
                    <Upload className="h-4 w-4" /> {profile?.resumePublicId ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Experience"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((value) => ({ ...value, experience: [...value.experience, { ...emptyExperience }] }))
                  }
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {form.experience.length === 0 ? (
                <p className="text-sm text-ink-500">Add your relevant roles to strengthen your profile.</p>
              ) : (
                form.experience.map((item, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                        <BriefcaseBusiness className="h-4 w-4" /> Role {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((value) => ({
                            ...value,
                            experience: value.experience.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove experience"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Title</Label>
                        <Input value={item.title} onChange={(event) => updateItem(setForm, "experience", index, { title: event.target.value })} />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input value={item.company} onChange={(event) => updateItem(setForm, "experience", index, { company: event.target.value })} />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={item.location ?? ""} onChange={(event) => updateItem(setForm, "experience", index, { location: event.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Start</Label>
                          <Input type="date" value={toDateInput(item.startDate)} onChange={(event) => updateItem(setForm, "experience", index, { startDate: event.target.value })} />
                        </div>
                        <div>
                          <Label>End</Label>
                          <Input type="date" value={toDateInput(item.endDate)} onChange={(event) => updateItem(setForm, "experience", index, { endDate: event.target.value })} />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={item.description ?? ""} onChange={(event) => updateItem(setForm, "experience", index, { description: event.target.value })} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Education"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((value) => ({ ...value, education: [...value.education, { ...emptyEducation }] }))
                  }
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {form.education.length === 0 ? (
                <p className="text-sm text-ink-500">Add your education history.</p>
              ) : (
                form.education.map((item, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                        <GraduationCap className="h-4 w-4" /> Education {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((value) => ({
                            ...value,
                            education: value.education.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove education"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Institution</Label>
                        <Input value={item.institution} onChange={(event) => updateItem(setForm, "education", index, { institution: event.target.value })} />
                      </div>
                      <div>
                        <Label>Degree</Label>
                        <Input value={item.degree ?? ""} onChange={(event) => updateItem(setForm, "education", index, { degree: event.target.value })} />
                      </div>
                      <div>
                        <Label>Field of study</Label>
                        <Input value={item.fieldOfStudy ?? ""} onChange={(event) => updateItem(setForm, "education", index, { fieldOfStudy: event.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Start</Label>
                          <Input type="date" value={toDateInput(item.startDate)} onChange={(event) => updateItem(setForm, "education", index, { startDate: event.target.value })} />
                        </div>
                        <div>
                          <Label>End</Label>
                          <Input type="date" value={toDateInput(item.endDate)} onChange={(event) => updateItem(setForm, "education", index, { endDate: event.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Certifications"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((value) => ({
                      ...value,
                      certifications: [...value.certifications, { ...emptyCertification }]
                    }))
                  }
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {form.certifications.length === 0 ? (
                <p className="text-sm text-ink-500">No certifications added.</p>
              ) : (
                form.certifications.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <Label>Name</Label>
                      <Input value={item.name} onChange={(event) => updateItem(setForm, "certifications", index, { name: event.target.value })} />
                    </div>
                    <div>
                      <Label>Issuer</Label>
                      <Input value={item.issuer ?? ""} onChange={(event) => updateItem(setForm, "certifications", index, { issuer: event.target.value })} />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove certification"
                        onClick={() =>
                          setForm((value) => ({
                            ...value,
                            certifications: value.certifications.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => void save()} loading={saving}>
              <Save className="h-4 w-4" /> Save profile
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader title="Recruiter details" description="This information is used for internal assignment context." />
          <CardBody className="grid max-w-xl gap-4">
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={recruiterForm.specialization}
                onChange={(event) => setRecruiterForm((value) => ({ ...value, specialization: event.target.value }))}
                placeholder="e.g. Engineering hiring"
              />
            </div>
            <div>
              <Label htmlFor="experienceYears">Years of recruiting experience</Label>
              <Input
                id="experienceYears"
                type="number"
                min={0}
                max={60}
                value={recruiterForm.experienceYears}
                onChange={(event) =>
                  setRecruiterForm((value) => ({ ...value, experienceYears: Number(event.target.value) }))
                }
              />
            </div>
            <div>
              <Button onClick={() => void save()} loading={saving}>
                <Save className="h-4 w-4" /> Save profile
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {user.role === "job_seeker" ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
          <UserRound className="h-4 w-4" /> Profile details are visible to employers only through authorized application access.
        </div>
      ) : null}
    </div>
  );
}

function updateItem<T extends "experience" | "education" | "certifications">(
  setForm: React.Dispatch<React.SetStateAction<JobSeekerProfile>>,
  key: T,
  index: number,
  patch: Partial<JobSeekerProfile[T][number]>
) {
  setForm((value) => ({
    ...value,
    [key]: value[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
  }));
}

function toDateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function cleanExperience(item: ExperienceItem) {
  return {
    title: item.title.trim(),
    company: item.company.trim(),
    location: item.location?.trim() || undefined,
    startDate: item.startDate ? new Date(item.startDate).toISOString() : undefined,
    endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
    current: item.current ?? false,
    description: item.description?.trim() || undefined
  };
}

function cleanEducation(item: EducationItem) {
  return {
    institution: item.institution.trim(),
    degree: item.degree?.trim() || undefined,
    fieldOfStudy: item.fieldOfStudy?.trim() || undefined,
    startDate: item.startDate ? new Date(item.startDate).toISOString() : undefined,
    endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
    description: item.description?.trim() || undefined
  };
}

function cleanCertification(item: CertificationItem) {
  return {
    name: item.name.trim(),
    issuer: item.issuer?.trim() || undefined,
    credentialUrl: item.credentialUrl?.trim() || ""
  };
}
