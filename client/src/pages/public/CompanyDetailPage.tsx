import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, ExternalLink, Globe2, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { JobCard } from "../../components/jobs/JobCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, InlineAlert, PageLoader, Skeleton } from "../../components/ui/Feedback";
import { Pagination } from "../../components/ui/Pagination";
import { Label, Select, Textarea } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Company, Job, PaginationMeta } from "../../types";
import { formatDate } from "../../utils/format";

interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  author?: { name: string; avatar?: string | null };
  createdAt: string;
}

interface CompanyResponse {
  company: Company;
  jobs: Job[];
}

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviewPage, setReviewPage] = useState(1);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const companyQuery = useQuery({
    queryKey: ["companies", "detail", id],
    queryFn: () => api.get<CompanyResponse>(`/companies/${id}`)
  });
  const reviewsQuery = useQuery({
    queryKey: ["companies", "reviews", id, reviewPage],
    queryFn: () => api.getPage<Review[]>(`/companies/${id}/reviews?limit=5&page=${reviewPage}`)
  });

  const company = companyQuery.data?.company;
  const jobs = companyQuery.data?.jobs ?? [];
  const reviews = reviewsQuery.data?.data ?? [];
  const reviewMeta = reviewsQuery.data?.meta as PaginationMeta | undefined;

  const submitReview = async () => {
    if (!comment.trim()) {
      setReviewError("Write a short review before submitting.");
      return;
    }

    setSubmitting(true);
    setReviewError(null);

    try {
      await api.post(`/companies/${company?._id}/reviews`, {
        rating: Number(rating),
        comment: comment.trim()
      });
      setComment("");
      toast("Review submitted", { tone: "success" });
      await reviewsQuery.refetch();
    } catch (error) {
      setReviewError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (companyQuery.isLoading) {
    return <PageLoader label="Loading company profile" />;
  }

  if (companyQuery.isError || !company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Company not found"
          description="This profile may have been removed."
          action={<Link to="/companies"><Button variant="outline">Browse companies</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/companies" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" /> Back to companies
          </Link>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            {company.logo ? (
              <img src={company.logo} alt="" className="h-20 w-20 rounded-2xl border border-slate-100 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-700">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">{company.name}</h1>
                {company.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-500">
                {company.industry ? <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {company.industry}</span> : null}
                {company.headquarters ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {company.headquarters}</span> : null}
                {company.companySize ? <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {company.companySize}</span> : null}
                {company.foundedYear ? <span>Founded {company.foundedYear}</span> : null}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-600">
                {company.description || "This company has not added a description yet."}
              </p>
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                >
                  <Globe2 className="h-4 w-4" /> Visit website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900">Open positions</h2>
              <Badge tone="brand">{jobs.length} shown</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {jobs.length === 0 ? (
                <EmptyState
                  title="No open roles right now"
                  description="Follow this company and check back later."
                />
              ) : (
                jobs.map((job) => <JobCard key={job._id} job={job} />)
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-900">Reviews</h2>
            <div className="mt-4 space-y-3">
              {reviewsQuery.isLoading ? (
                <Skeleton className="h-32" />
              ) : reviews.length === 0 ? (
                <EmptyState title="No reviews yet" description="Be the first to share an experience with this company." />
              ) : (
                reviews.map((review) => (
                  <Card key={review._id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink-900">{review.title || "Company review"}</p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {review.author?.name ?? "Anonymous"} · {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star className="h-4 w-4 fill-current" /> {review.rating}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-600">{review.comment}</p>
                  </Card>
                ))
              )}
              {reviewMeta ? (
                <Pagination
                  page={reviewMeta.page}
                  totalPages={reviewMeta.totalPages}
                  onPageChange={setReviewPage}
                />
              ) : null}
            </div>
          </section>
        </div>

        <aside>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink-900">Share your experience</h2>
            {!user ? (
              <p className="mt-2 text-sm text-ink-500">
                <Link to="/login" className="link">Sign in</Link> to leave a review.
              </p>
            ) : company.owner && typeof company.owner === "object" && company.owner._id === user._id ? (
              <p className="mt-2 text-sm text-ink-500">You cannot review your own company.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {reviewError ? <InlineAlert tone="danger">{reviewError}</InlineAlert> : null}
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Select id="rating" value={rating} onChange={(event) => setRating(event.target.value)}>
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Average</option>
                    <option value="2">2 — Poor</option>
                    <option value="1">1 — Very poor</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="comment">Review</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="What should other candidates know?"
                    maxLength={2000}
                  />
                </div>
                <Button className="w-full" onClick={submitReview} loading={submitting}>
                  Submit review
                </Button>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
