import { useQuery } from "@tanstack/react-query";
import { Filter, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { JobCard } from "../../components/jobs/JobCard";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { Input, Label, Select } from "../../components/ui/Field";
import { Pagination } from "../../components/ui/Pagination";
import { api } from "../../lib/api";
import type { Job, PaginationMeta } from "../../types";

interface Category {
  name: string;
  count: number;
}

const employmentTypes = [
  ["full_time", "Full time"],
  ["part_time", "Part time"],
  ["contract", "Contract"],
  ["internship", "Internship"],
  ["temporary", "Temporary"]
] as const;
const workplaceTypes = [
  ["onsite", "On-site"],
  ["remote", "Remote"],
  ["hybrid", "Hybrid"]
] as const;
const experienceLevels = [
  ["entry", "Entry level"],
  ["mid", "Mid level"],
  ["senior", "Senior"],
  ["lead", "Lead"],
  ["executive", "Executive"]
] as const;

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  useEffect(() => {
    setKeyword(searchParams.get("q") ?? "");
    setLocation(searchParams.get("location") ?? "");
  }, [searchParams]);

  const queryString = searchParams.toString();
  const jobsQuery = useQuery({
    queryKey: ["jobs", "list", queryString],
    queryFn: () => api.getPage<Job[]>(`/jobs?${queryString || "limit=12"}`)
  });
  const categoriesQuery = useQuery({
    queryKey: ["jobs", "categories"],
    queryFn: () => api.get<Category[]>("/jobs/categories")
  });

  const jobs = jobsQuery.data?.data ?? [];
  const meta = jobsQuery.data?.meta as PaginationMeta | undefined;
  const categories = categoriesQuery.data ?? [];
  const hasFilters = ["category", "employmentType", "workplaceType", "experienceLevel", "sort"].some(
    (key) => searchParams.has(key)
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (keyword.trim()) next.set("q", keyword.trim());
    else next.delete("q");
    if (location.trim()) next.set("location", location.trim());
    else next.delete("location");
    next.delete("page");
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams({});

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Find your next role"
        description="Search published opportunities and filter by what matters to you."
      />

      <form onSubmit={submitSearch} className="surface grid gap-2 p-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Job title, skill, or keyword"
            className="border-0 pl-10 focus:ring-0"
            aria-label="Job title, skill, or keyword"
          />
        </div>
        <div className="relative border-t border-slate-100 sm:border-l sm:border-t-0">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City or remote"
            className="border-0 pl-10 focus:ring-0"
            aria-label="Location"
          />
        </div>
        <Button type="submit" className="min-h-10">
          Search
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {jobsQuery.isLoading ? "Loading roles..." : `${meta?.total ?? jobs.length} role${(meta?.total ?? jobs.length) === 1 ? "" : "s"} found`}
        </p>
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen((value) => !value)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={filtersOpen ? "surface h-fit p-4" : "surface hidden h-fit p-4 lg:block"}>
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <Filter className="h-4 w-4" /> Filters
            </p>
            {hasFilters || searchParams.has("q") || searchParams.has("location") ? (
              <button type="button" onClick={clearAll} className="text-xs font-medium text-brand-700 hover:underline">
                Clear all
              </button>
            ) : null}
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={searchParams.get("category") ?? ""}
                onChange={(event) => update("category", event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="employmentType">Employment type</Label>
              <Select
                id="employmentType"
                value={searchParams.get("employmentType") ?? ""}
                onChange={(event) => update("employmentType", event.target.value)}
              >
                <option value="">Any type</option>
                {employmentTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="workplaceType">Workplace</Label>
              <Select
                id="workplaceType"
                value={searchParams.get("workplaceType") ?? ""}
                onChange={(event) => update("workplaceType", event.target.value)}
              >
                <option value="">Any workplace</option>
                {workplaceTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="experienceLevel">Experience</Label>
              <Select
                id="experienceLevel"
                value={searchParams.get("experienceLevel") ?? ""}
                onChange={(event) => update("experienceLevel", event.target.value)}
              >
                <option value="">Any level</option>
                {experienceLevels.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Sort by</Label>
              <Select
                id="sort"
                value={searchParams.get("sort") ?? "newest"}
                onChange={(event) => update("sort", event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="salary">Highest salary</option>
                <option value="applications">Most applied</option>
              </Select>
            </div>
          </div>
        </aside>

        <div>
          {jobsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44" />)}
            </div>
          ) : jobsQuery.isError ? (
            <ErrorState message={(jobsQuery.error as Error).message} onRetry={() => void jobsQuery.refetch()} />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No roles match these filters"
              description="Try clearing a filter or using a broader keyword."
              action={hasFilters ? <Button size="sm" onClick={clearAll}>Clear filters</Button> : undefined}
            />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
              {meta ? (
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(nextPage) => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(nextPage));
                    setSearchParams(next);
                  }}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
