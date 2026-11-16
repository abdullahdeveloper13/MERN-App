import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ExternalLink, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { InlineAlert, PageHeader, PageLoader } from "../../components/ui/Feedback";
import { Input, Label, Select, Textarea } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { api } from "../../lib/api";
import type { Company } from "../../types";
import { COMPANY_SIZES, type CompanySize } from "../../constants/company";

interface CompanyForm {
  name: string;
  website: string;
  industry: string;
  companySize: CompanySize;
  headquarters: string;
  foundedYear: string;
  description: string;
  linkedin: string;
  twitter: string;
  facebook: string;
}

const emptyForm: CompanyForm = {
  name: "",
  website: "",
  industry: "",
  companySize: "1-10",
  headquarters: "",
  foundedYear: "",
  description: "",
  linkedin: "",
  twitter: "",
  facebook: ""
};

export function EmployerCompanyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const companyQuery = useQuery({
    queryKey: ["companies", "mine"],
    queryFn: () => api.get<Company | null>("/companies/mine")
  });
  const company = Array.isArray(companyQuery.data) ? null : companyQuery.data;

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name,
      website: company.website ?? "",
      industry: company.industry ?? "",
      companySize: (company.companySize as CompanySize) || "1-10",
      headquarters: company.headquarters ?? "",
      foundedYear: company.foundedYear ? String(company.foundedYear) : "",
      description: company.description ?? "",
      linkedin: company.socialLinks?.linkedin ?? "",
      twitter: company.socialLinks?.twitter ?? "",
      facebook: company.socialLinks?.facebook ?? ""
    });
  }, [company]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] }),
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    ]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      website: form.website.trim() || "",
      industry: form.industry.trim() || undefined,
      companySize: form.companySize,
      headquarters: form.headquarters.trim() || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      description: form.description.trim() || undefined,
      socialLinks: {
        linkedin: form.linkedin.trim() || "",
        twitter: form.twitter.trim() || "",
        facebook: form.facebook.trim() || ""
      }
    };

    try {
      if (company) {
        await api.patch(`/companies/${company._id}`, payload);
      } else {
        await api.post("/companies", payload);
      }
      await invalidate();
      toast(company ? "Company updated" : "Company created", { tone: "success" });
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!company) return;

    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("logo", file);
      await api.upload(`/companies/${company._id}/logo`, data);
      await invalidate();
      toast("Logo updated", { tone: "success" });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (logoInput.current) logoInput.current.value = "";
    }
  };

  if (companyQuery.isLoading) {
    return <PageLoader label="Loading company profile" />;
  }

  return (
    <div>
      <PageHeader
        title={company ? "Company profile" : "Create your company"}
        description={
          company
            ? "This information appears on your public company page and job listings."
            : "Add your company before publishing jobs."
        }
        action={
          company ? (
            <a href={`/companies/${company.slug || company._id}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /> View public page</Button>
            </a>
          ) : undefined
        }
      />

      {error ? <div className="mb-4"><InlineAlert tone="danger">{error}</InlineAlert></div> : null}

      {company ? (
        <Card className="mb-4">
          <CardBody className="flex flex-wrap items-center gap-4">
            {company.logo ? (
              <img src={company.logo} alt="" className="h-16 w-16 rounded-2xl border border-slate-100 object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-ink-900">{company.name}</p>
                {company.verified ? (
                  <Badge tone="green"><ShieldCheck className="h-3.5 w-3.5" /> Verified</Badge>
                ) : (
                  <Badge tone="amber">Pending verification</Badge>
                )}
              </div>
              <p className="text-sm text-ink-500">{company.industry || "Industry not set"}</p>
            </div>
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadLogo(file);
              }}
            />
            <Button variant="outline" size="sm" onClick={() => logoInput.current?.click()} loading={uploading}>
              <Upload className="h-4 w-4" /> Upload logo
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Company details" description="Accurate details help candidates evaluate your company." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={form.name}
              onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
              placeholder="Acme Inc."
              maxLength={160}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="companyDescription">Description</Label>
            <Textarea
              id="companyDescription"
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              placeholder="What does your company do, and what makes it a good place to work?"
              maxLength={8000}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={form.website}
              onChange={(event) => setForm((value) => ({ ...value, website: event.target.value }))}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={form.industry}
              onChange={(event) => setForm((value) => ({ ...value, industry: event.target.value }))}
              placeholder="Software, Healthcare, Finance..."
            />
          </div>
          <div>
            <Label htmlFor="companySize">Company size</Label>
            <Select
              id="companySize"
              value={form.companySize}
              onChange={(event) => setForm((value) => ({ ...value, companySize: event.target.value as CompanySize }))}
            >
              {COMPANY_SIZES.map((size) => <option key={size} value={size}>{size} employees</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="headquarters">Headquarters</Label>
            <Input
              id="headquarters"
              value={form.headquarters}
              onChange={(event) => setForm((value) => ({ ...value, headquarters: event.target.value }))}
              placeholder="City, country"
            />
          </div>
          <div>
            <Label htmlFor="foundedYear">Founded year</Label>
            <Input
              id="foundedYear"
              type="number"
              min={1800}
              max={new Date().getFullYear()}
              value={form.foundedYear}
              onChange={(event) => setForm((value) => ({ ...value, foundedYear: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              value={form.linkedin}
              onChange={(event) => setForm((value) => ({ ...value, linkedin: event.target.value }))}
              placeholder="https://linkedin.com/company/..."
            />
          </div>
          <div>
            <Label htmlFor="twitter">X / Twitter</Label>
            <Input
              id="twitter"
              type="url"
              value={form.twitter}
              onChange={(event) => setForm((value) => ({ ...value, twitter: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              type="url"
              value={form.facebook}
              onChange={(event) => setForm((value) => ({ ...value, facebook: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={() => void save()} loading={saving} disabled={!form.name.trim()}>
              <Building2 className="h-4 w-4" /> {company ? "Save company" : "Create company"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
