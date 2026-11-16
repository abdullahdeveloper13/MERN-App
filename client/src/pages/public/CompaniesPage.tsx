import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { Input } from "../../components/ui/Field";
import { Pagination } from "../../components/ui/Pagination";
import { api } from "../../lib/api";
import type { Company, PaginationMeta } from "../../types";

export function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const companiesQuery = useQuery({
    queryKey: ["companies", "list", submitted, page],
    queryFn: () =>
      api.getPage<Company[]>(
        `/companies?limit=12&page=${page}${submitted ? `&q=${encodeURIComponent(submitted)}` : ""}`
      )
  });

  const companies = companiesQuery.data?.data ?? [];
  const meta = companiesQuery.data?.meta as PaginationMeta | undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmitted(query.trim());
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Explore companies"
        description="Learn about the teams hiring on HireSphere AI and browse their open roles."
      />

      <form onSubmit={submit} className="surface flex flex-col gap-2 p-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by company, industry, or keyword"
            className="border-0 pl-10 focus:ring-0"
            aria-label="Search companies"
          />
        </div>
        <Button type="submit">Search companies</Button>
      </form>

      <div className="mt-6">
        {companiesQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-52" />)}
          </div>
        ) : companiesQuery.isError ? (
          <ErrorState message={(companiesQuery.error as Error).message} onRetry={() => void companiesQuery.refetch()} />
        ) : companies.length === 0 ? (
          <EmptyState
            title={submitted ? "No companies match that search" : "No company profiles yet"}
            description={
              submitted
                ? "Try a different keyword."
                : "Employer profiles will appear here once companies join."
            }
            action={
              !submitted ? (
                <Link to="/register?role=employer">
                  <Button variant="outline" size="sm">Create a company</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Link
                  key={company._id}
                  to={`/companies/${company.slug || company._id}`}
                  className="surface group flex flex-col p-6 transition hover:border-brand-200 hover:shadow-pop"
                >
                  <div className="flex items-start justify-between gap-3">
                    {company.logo ? (
                      <img src={company.logo} alt="" className="h-14 w-14 rounded-2xl border border-slate-100 object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-700">
                        {company.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {company.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-ink-950 group-hover:text-brand-700">
                    {company.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                    <Building2 className="h-3.5 w-3.5" /> {company.industry || "Industry not listed"}
                  </p>
                  {company.headquarters ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                      <MapPin className="h-3.5 w-3.5" /> {company.headquarters}
                    </p>
                  ) : null}
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-500">
                    {company.description || "This company has not added a description yet."}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-brand-700">View profile</span>
                </Link>
              ))}
            </div>
            {meta ? (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
