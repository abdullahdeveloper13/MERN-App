import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../../lib/api";
import type { User } from "../../types";
import { useAuth } from "./AuthContext";

interface GoogleConfig {
  enabled: boolean;
  clientId: string | null;
}

const scriptId = "google-identity-services";

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load."));
    document.head.appendChild(script);
  });
}

export function GoogleButton({
  role,
  onSuccess,
  onError
}: {
  role?: "job_seeker" | "employer" | "recruiter";
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { googleLogin } = useAuth();
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const configQuery = useQuery({
    queryKey: ["auth", "google-config"],
    queryFn: () => api.get<GoogleConfig>("/auth/google/config"),
    staleTime: 5 * 60_000
  });
  const config = configQuery.data;

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!config?.enabled || !config.clientId || !containerRef.current) {
      return;
    }

    let cancelled = false;

    void loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: config.clientId as string,
          callback: async (response) => {
            try {
              const user = await googleLogin(response.credential, role);
              onSuccessRef.current(user);
            } catch (error) {
              onErrorRef.current((error as Error).message);
            }
          }
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: containerRef.current.clientWidth,
          text: "continue_with",
          shape: "rectangular"
        });
      })
      .catch((error: Error) => onErrorRef.current(error.message));

    return () => {
      cancelled = true;
    };
  }, [config, googleLogin, role]);

  if (!config?.enabled) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="relative mb-4 text-center">
        <span className="relative z-10 bg-white px-3 text-xs text-ink-400">or continue with</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-slate-200" />
      </div>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
