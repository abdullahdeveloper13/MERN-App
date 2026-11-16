import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { JobCard } from "../../components/jobs/JobCard";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { api } from "../../lib/api";
import type { PaginationMeta, SavedJob } from "../../types";

export function SavedJobsPage() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const savedQuery = useQuery({
    queryKey: ["saved-jobs", page],
    queryFn: () => api.getPage<SavedJob[]>(`/saved-jobs?limit=12&page=${page}`)
  });

  const saved = savedQuery.data?.data ?? [];
  const meta = savedQuery.data?.meta as PaginationMeta | undefined;

  const remove = async (jobId: string) => {
    try {
      await api.delete(`/saved-jobs/${jobId}`);
      toast("Removed from saved jobs", { tone: "success" });
      await queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (error) {
      toast((error as Error).message, { tone: "danger" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Saved jobs"
        description="Roles you've bookmarked for later."
        action={<Link to="/jobs"><Button size="sm" variant="outline">Find more jobs</Button></Link>}
      />

      {savedQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44" />)}
        </div>
      ) : savedQuery.isError ? (
        <ErrorState message={(savedQuery.error as Error).message} onRetry={() => void savedQuery.refetch()} />
      ) : saved.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          description="Bookmark roles while browsing to keep them here."
          action={<Link to="/jobs"><Button size="sm">Browse jobs</Button></Link>}
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {saved.map((item) => (
              <JobCard
                key={item._id}
                job={item.job}
                saved
                onToggleSave={() => void remove(item.job._id)}
              />
            ))}
          </div>
          {meta ? (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}
