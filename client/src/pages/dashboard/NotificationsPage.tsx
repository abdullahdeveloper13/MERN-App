import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { Pagination } from "../../components/ui/Pagination";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Notification, PaginationMeta } from "../../types";
import { cn } from "../../utils/cn";
import { timeAgo } from "../../utils/format";
import { useState } from "react";

interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

const icons = {
  application: UserPlus,
  interview: Bell,
  message: MessageSquare,
  job: Sparkles,
  system: Bell
};

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list", page],
    queryFn: () => api.getPage<NotificationsResponse>(`/notifications?limit=20&page=${page}`)
  });

  const data = notificationsQuery.data?.data;
  const meta = notificationsQuery.data?.meta as PaginationMeta | undefined;
  const notifications = data?.notifications ?? [];

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      await api.patch(`/notifications/${notification._id}/read`).catch(() => undefined);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }

    const type = notification.relatedResource?.type;
    if (type === "application") {
      navigate(
        user?.role === "job_seeker"
          ? "/dashboard/applications"
          : user?.role === "employer"
            ? "/dashboard/employer/applications"
            : user?.role === "recruiter"
              ? "/dashboard/recruiter/pipeline"
              : "/dashboard/admin/applications"
      );
    } else if (type === "conversation") {
      navigate("/dashboard/messages");
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Application updates, interview invitations, and messages."
        action={
          (data?.unread ?? 0) > 0 ? (
            <Button size="sm" variant="outline" onClick={() => void markAll()}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {notificationsQuery.isLoading ? (
        <Skeleton className="h-72" />
      ) : notificationsQuery.isError ? (
        <ErrorState message={(notificationsQuery.error as Error).message} onRetry={() => void notificationsQuery.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="Activity from your applications and messages will appear here."
          icon={<Bell className="h-6 w-6" />}
        />
      ) : (
        <Card>
          <CardBody className="divide-y divide-slate-100 p-0">
            {notifications.map((notification) => {
              const Icon = icons[notification.type] ?? Bell;
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50",
                    !notification.isRead && "bg-brand-50/30"
                  )}
                >
                  <span className={cn("mt-0.5 rounded-xl p-2", notification.isRead ? "bg-slate-100 text-ink-500" : "bg-brand-100 text-brand-700")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-ink-900">{notification.title}</span>
                      <span className="shrink-0 text-xs text-ink-400">{timeAgo(notification.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">{notification.message}</span>
                    {!notification.isRead ? <Badge tone="brand" className="mt-2">New</Badge> : null}
                  </span>
                </button>
              );
            })}
          </CardBody>
          {meta ? (
            <div className="px-4 pb-4">
              <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
