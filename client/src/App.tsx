import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { PageLoader } from "./components/ui/Feedback";
import { dashboardPathForRole, useAuth } from "./features/auth/AuthContext";
import { PublicOnly, RequireAuth, RequireRole } from "./routes/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/public/LandingPage").then((module) => ({ default: module.LandingPage })));
const JobsPage = lazy(() => import("./pages/public/JobsPage").then((module) => ({ default: module.JobsPage })));
const JobDetailPage = lazy(() => import("./pages/public/JobDetailPage").then((module) => ({ default: module.JobDetailPage })));
const CompaniesPage = lazy(() => import("./pages/public/CompaniesPage").then((module) => ({ default: module.CompaniesPage })));
const CompanyDetailPage = lazy(() => import("./pages/public/CompanyDetailPage").then((module) => ({ default: module.CompanyDetailPage })));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("./pages/auth/PasswordPages").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/auth/PasswordPages").then((module) => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import("./pages/auth/PasswordPages").then((module) => ({ default: module.VerifyEmailPage })));

const JobSeekerDashboard = lazy(() => import("./pages/dashboard/JobSeekerDashboard").then((module) => ({ default: module.JobSeekerDashboard })));
const EmployerDashboard = lazy(() => import("./pages/dashboard/EmployerDashboard").then((module) => ({ default: module.EmployerDashboard })));
const RecruiterDashboard = lazy(() => import("./pages/dashboard/RecruiterDashboard").then((module) => ({ default: module.RecruiterDashboard })));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const ApplicationsPage = lazy(() => import("./pages/dashboard/ApplicationsPage").then((module) => ({ default: module.ApplicationsPage })));
const SavedJobsPage = lazy(() => import("./pages/dashboard/SavedJobsPage").then((module) => ({ default: module.SavedJobsPage })));
const InterviewsPage = lazy(() => import("./pages/dashboard/InterviewsPage").then((module) => ({ default: module.InterviewsPage })));
const MessagesPage = lazy(() => import("./pages/dashboard/MessagesPage").then((module) => ({ default: module.MessagesPage })));
const NotificationsPage = lazy(() => import("./pages/dashboard/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const EmployerCompanyPage = lazy(() => import("./pages/dashboard/EmployerCompanyPage").then((module) => ({ default: module.EmployerCompanyPage })));
const ManageJobsPage = lazy(() => import("./pages/dashboard/ManageJobsPage").then((module) => ({ default: module.ManageJobsPage })));
const AdminUsersPage = lazy(() => import("./pages/dashboard/AdminPages").then((module) => ({ default: module.AdminUsersPage })));
const AdminCompaniesPage = lazy(() => import("./pages/dashboard/AdminPages").then((module) => ({ default: module.AdminCompaniesPage })));
const AdminJobsPage = lazy(() => import("./pages/dashboard/AdminPages").then((module) => ({ default: module.AdminJobsPage })));
const AdminRecruitersPage = lazy(() => import("./pages/dashboard/AdminPages").then((module) => ({ default: module.AdminRecruitersPage })));
const AdminAuditLogsPage = lazy(() => import("./pages/dashboard/AdminPages").then((module) => ({ default: module.AdminAuditLogsPage })));
const AdminSettingsPage = lazy(() => import("./pages/dashboard/AdminPages").then((module) => ({ default: module.AdminSettingsPage })));

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPathForRole(user.role)} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader label="Loading page" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />
        </Route>

        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardRedirect />} />

            <Route element={<RequireRole roles={["job_seeker"]} />}>
              <Route path="job-seeker" element={<JobSeekerDashboard />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="saved-jobs" element={<SavedJobsPage />} />
            </Route>

            <Route element={<RequireRole roles={["employer"]} />}>
              <Route path="employer" element={<EmployerDashboard />} />
              <Route path="employer/company" element={<EmployerCompanyPage />} />
              <Route path="employer/jobs" element={<ManageJobsPage />} />
              <Route path="employer/applications" element={<ApplicationsPage />} />
            </Route>

            <Route element={<RequireRole roles={["recruiter"]} />}>
              <Route path="recruiter" element={<RecruiterDashboard />} />
              <Route path="recruiter/jobs" element={<ManageJobsPage />} />
              <Route path="recruiter/candidates" element={<ApplicationsPage />} />
              <Route path="recruiter/pipeline" element={<ApplicationsPage />} />
            </Route>

            <Route element={<RequireRole roles={["admin"]} />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/companies" element={<AdminCompaniesPage />} />
              <Route path="admin/jobs" element={<AdminJobsPage />} />
              <Route path="admin/applications" element={<ApplicationsPage />} />
              <Route path="admin/recruiters" element={<AdminRecruitersPage />} />
              <Route path="admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route element={<RequireRole roles={["job_seeker", "employer", "recruiter"]} />}>
              <Route path="interviews" element={<InterviewsPage />} />
            </Route>

            <Route path="messages" element={<MessagesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
