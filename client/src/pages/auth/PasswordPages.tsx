import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { FieldError, Input, Label } from "../../components/ui/Field";
import { InlineAlert, Spinner } from "../../components/ui/Feedback";
import { useToast } from "../../components/ui/Toast";
import { api } from "../../lib/api";

const emailSchema = z.object({ email: z.string().email("Enter a valid email address.") });
type EmailValues = z.infer<typeof emailSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });

  const onSubmit = async (values: EmailValues) => {
    setServerError(null);
    try {
      await api.post("/auth/forgot-password", values);
      setSent(true);
    } catch (error) {
      setServerError((error as Error).message);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure link if an account exists."
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1">
            If an account matches that address, a password reset link is on its way. The link expires
            in one hour.
          </p>
          <Link to="/login" className="mt-3 inline-block font-semibold text-emerald-800 underline">
            Return to sign in
          </Link>
        </div>
      ) : (
        <>
          {serverError ? (
            <div className="mb-4">
              <InlineAlert tone="danger">{serverError}</InlineAlert>
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-500">
            Remembered it?{" "}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

const resetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });
type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (values: ResetValues) => {
    if (!token) {
      setServerError("This reset link is missing a token.");
      return;
    }

    setServerError(null);
    try {
      await api.post("/auth/reset-password", { token, password: values.password });
      toast("Password updated", { description: "Sign in with your new password.", tone: "success" });
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError((error as Error).message);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Use a strong password you haven't used elsewhere.">
      {!token ? (
        <InlineAlert tone="danger">
          This reset link is invalid.{" "}
          <Link to="/forgot-password" className="font-semibold underline">
            Request a new one
          </Link>
          .
        </InlineAlert>
      ) : (
        <>
          {serverError ? (
            <div className="mb-4">
              <InlineAlert tone="danger">{serverError}</InlineAlert>
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <FieldError message={errors.confirmPassword?.message} />
            </div>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Update password
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. You can now use every account feature.");
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message);
      });
  }, [token]);

  const resend = async () => {
    if (!resendEmail) {
      return;
    }

    try {
      await api.post("/auth/resend-verification", { email: resendEmail });
      setResent(true);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <AuthLayout title="Email verification" subtitle="Confirming your HireSphere AI account.">
      {status === "verifying" ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-ink-500">
          <Spinner /> Verifying your email...
        </div>
      ) : status === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Email verified
          </div>
          <p className="mt-2 text-sm">{message}</p>
          <Link to="/login" className="mt-3 inline-block text-sm font-semibold text-emerald-800 underline">
            Continue to sign in
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <InlineAlert tone="danger">{message}</InlineAlert>
          {!resent ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-ink-900">Need a new verification email?</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(event) => setResendEmail(event.target.value)}
                  aria-label="Email address"
                />
                <Button onClick={resend} disabled={!resendEmail}>
                  Resend link
                </Button>
              </div>
            </div>
          ) : (
            <InlineAlert tone="success">
              If that account needs verification, a new email has been sent.
            </InlineAlert>
          )}
          <Link to="/login" className="link text-sm">
            Back to sign in
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
