import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Building2, CheckCircle2, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { FieldError, Input, Label } from "../../components/ui/Field";
import { InlineAlert } from "../../components/ui/Feedback";
import { useToast } from "../../components/ui/Toast";
import { dashboardPathForRole, useAuth } from "../../features/auth/AuthContext";
import { GoogleButton } from "../../features/auth/GoogleButton";
import { cn } from "../../utils/cn";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    role: z.enum(["job_seeker", "employer", "recruiter"])
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

type FormValues = z.infer<typeof schema>;

const roleOptions = [
  {
    value: "job_seeker" as const,
    label: "Job seeker",
    description: "Discover roles and track applications",
    icon: BriefcaseBusiness
  },
  {
    value: "employer" as const,
    label: "Employer",
    description: "Build a company profile and hire",
    icon: Building2
  },
  {
    value: "recruiter" as const,
    label: "Recruiter",
    description: "Manage assigned roles and candidates",
    icon: Users
  }
];

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role");
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role:
        initialRole === "employer" || initialRole === "recruiter" || initialRole === "job_seeker"
          ? initialRole
          : "job_seeker"
    }
  });
  const selectedRole = watch("role");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    try {
      const user = await createAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role
      });
      setCreated(true);
      toast("Account created", {
        description: "Check your inbox to verify your email.",
        tone: "success"
      });
      window.setTimeout(() => navigate(dashboardPathForRole(user.role), { replace: true }), 900);
    } catch (error) {
      setServerError((error as Error).message);
    }
  };

  if (created) {
    return (
      <AuthLayout title="Account created" subtitle="You're ready to get started.">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-semibold">Welcome to HireSphere AI</p>
            <p className="mt-1 text-emerald-800">
              We sent a verification link to your email. Taking you to your dashboard...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Choose the role that matches how you hire or work.">
      {serverError ? (
        <div className="mb-4">
          <InlineAlert tone="danger">{serverError}</InlineAlert>
        </div>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label>I am joining as</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const active = selectedRole === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue("role", option.value, { shouldValidate: true })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    active
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-brand-700" : "text-ink-500")} />
                  <span className="mt-2 block text-sm font-semibold text-ink-900">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-ink-500">{option.description}</span>
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("role")} />
        </div>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" placeholder="Alex Morgan" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </div>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <GoogleButton
        role={selectedRole}
        onSuccess={(user) => {
          toast("Account ready", { tone: "success" });
          navigate(dashboardPathForRole(user.role), { replace: true });
        }}
        onError={setServerError}
      />

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link to="/login" className="link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
