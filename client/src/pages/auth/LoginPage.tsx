import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { FieldError, Input, Label } from "../../components/ui/Field";
import { InlineAlert } from "../../components/ui/Feedback";
import { useToast } from "../../components/ui/Toast";
import { dashboardPathForRole, useAuth } from "../../features/auth/AuthContext";
import type { UserRole } from "../../types";
import { GoogleButton } from "../../features/auth/GoogleButton";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.")
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const redirectAfterLogin = (role: UserRole) => {
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? dashboardPathForRole(role), { replace: true });
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    try {
      const user = await login(values);
      toast("Welcome back", { tone: "success" });
      redirectAfterLogin(user.role);
    } catch (error) {
      setServerError((error as Error).message);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your HireSphere AI workspace.">
      {serverError ? (
        <div className="mb-4">
          <InlineAlert tone="danger">{serverError}</InlineAlert>
        </div>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <GoogleButton
        onSuccess={(user) => {
          toast("Signed in with Google", { tone: "success" });
          redirectAfterLogin(user.role);
        }}
        onError={setServerError}
      />

      <p className="mt-6 text-center text-sm text-ink-500">
        New to HireSphere AI?{" "}
        <Link to="/register" className="link">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
