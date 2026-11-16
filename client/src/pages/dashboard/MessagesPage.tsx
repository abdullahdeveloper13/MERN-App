import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, PageLoader, Skeleton } from "../../components/ui/Feedback";
import { Input } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Conversation, Message } from "../../types";
import { cn } from "../../utils/cn";
import { timeAgo, titleCase } from "../../utils/format";

export function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/conversations")
  });
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);

  useEffect(() => {
    const firstConversation = conversations[0];
    if (!activeId && firstConversation) {
      setActiveId(firstConversation._id);
    }
  }, [activeId, conversations]);

  const messagesQuery = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => api.getPage<Message[]>(`/conversations/${activeId}/messages?limit=100`),
    enabled: Boolean(activeId)
  });
  const messages = messagesQuery.data?.data ?? [];
  const active = conversations.find((conversation) => conversation._id === activeId);

  useEffect(() => {
    if (!activeId) return;
    void api.patch(`/conversations/${activeId}/read`).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }).catch(() => undefined);
  }, [activeId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const send = async () => {
    if (!activeId || !content.trim() || sending) return;

    setSending(true);
    try {
      await api.post(`/conversations/${activeId}/messages`, { content: content.trim() });
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error) {
      toast((error as Error).message, { tone: "danger" });
    } finally {
      setSending(false);
    }
  };

  if (conversationsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Messages" />
        <Skeleton className="h-[60vh]" />
      </div>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <div>
        <PageHeader title="Messages" />
        <ErrorState message={(conversationsQuery.error as Error).message} onRetry={() => void conversationsQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Conversations with candidates, employers, and recruiters."
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Messages start when a hiring team or candidate initiates contact."
          icon={<MessageSquare className="h-6 w-6" />}
        />
      ) : (
        <div className="surface grid h-[calc(100vh-15rem)] min-h-[480px] overflow-hidden md:grid-cols-[300px_1fr]">
          <aside className="overflow-y-auto border-b border-slate-200 md:border-b-0 md:border-r">
            {conversations.map((conversation) => {
              const other = conversation.participants.find((participant) => participant._id !== user?._id);
              const isActive = conversation._id === activeId;
              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setActiveId(conversation._id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition",
                    isActive ? "bg-brand-50/60" : "hover:bg-slate-50"
                  )}
                >
                  <Avatar src={other?.avatar} name={other?.name ?? "User"} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink-900">{other?.name ?? "Conversation"}</span>
                      <span className="shrink-0 text-[10px] text-ink-400">{timeAgo(conversation.lastMessageAt)}</span>
                    </span>
                    {other?.role ? (
                      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        {titleCase(other.role)}
                      </span>
                    ) : null}
                    <span className="mt-1 block truncate text-xs text-ink-500">
                      {conversation.lastMessage ?? "No messages yet"}
                    </span>
                    {conversation.unreadCount ? (
                      <Badge tone="brand" className="mt-1.5">{conversation.unreadCount} new</Badge>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </aside>

          <section className="flex min-h-0 flex-col">
            {active ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  {(() => {
                    const other = active.participants.find((participant) => participant._id !== user?._id);
                    return (
                      <>
                        <Avatar src={other?.avatar} name={other?.name ?? "User"} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{other?.name}</p>
                          {active.relatedJob ? (
                            <p className="text-xs text-ink-400">About {active.relatedJob.title}</p>
                          ) : null}
                        </div>
                      </>
                    );
                  })()}
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
                  {messagesQuery.isLoading ? (
                    <PageLoader label="Loading messages" />
                  ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-ink-400">Start the conversation below.</p>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender?._id === user?._id;
                      return (
                        <div key={message._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                              isMine ? "bg-brand-700 text-white" : "border border-slate-200 bg-white text-ink-800"
                            )}
                          >
                            <p className="whitespace-pre-line leading-6">{message.content}</p>
                            <p className={cn("mt-1 text-[10px]", isMine ? "text-brand-200" : "text-ink-400")}>
                              {timeAgo(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send();
                  }}
                  className="flex gap-2 border-t border-slate-200 p-3"
                >
                  <Input
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write a message..."
                    maxLength={5000}
                    aria-label="Message"
                  />
                  <Button type="submit" disabled={!content.trim()} loading={sending} size="icon" aria-label="Send message">
                    {sending ? null : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-ink-400">
                Select a conversation
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
