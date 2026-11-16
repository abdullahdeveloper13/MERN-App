import { useState, type FormEvent } from "react";
import { KeyRound, MailCheck, Save, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { InlineAlert, PageHeader } from "../../components/ui/Feedback";
import { Input, Label } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import { titleCase } from "../../utils/format";

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    location: user?.location ?? ""
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  if (!user) return null;

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    setAccountSaving(true);
    setAccountError(null);
    try {
      await api.patch("/profiles/account", {
        name: account.name.trim(),
        phone: account.phone.trim(),
        location: account.location.trim()
      });
      await refresh();
      toast("Account updated", { tone: "success" });
    } catch (error) {
      setAccountError((error as Error).message);
    } finally {
      setAccountSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast("Password changed", { tone: "success" });
    } catch (error) {
      setPasswordError((error as Error).message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const resendVerification = async () => {
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      setResent(true);
    } catch (error) {
      toast((error as Error).message, { tone: "danger" });
    }
  };

  return (
    <div>
      <PageHeader title="Account settings" description="Manage your personal details and account security." />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Personal information" description="Used on applications and messages." />
            <CardBody>
              <form onSubmit={saveAccount} className="space-y-4">
                {accountError ? <InlineAlert tone="danger">{accountError}</InlineAlert> : null}
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={account.name}
                    onChange={(event) => setAccount((value) => ({ ...value, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={account.phone}
                      onChange={(event) => setAccount((value) => ({ ...value, phone: event.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={account.location}
                      onChange={(event) => setAccount((value) => ({ ...value, location: event.target.value }))}
                      placeholder="City, country"
                    />
                  </div>
                </div>
                <Button type="submit" loading={accountSaving}>
                  <Save className="h-4 w-4" /> Save account
                </Button>
              </form>
            </CardBody>
          </Card>

          {user.authProvider === "local" ? (
            <Card>
              <CardHeader title="Change password" description="Use at least 8 characters." />
              <CardBody>
                <form onSubmit={changePassword} className="space-y-4">
                  {passwordError ? <InlineAlert tone="danger">{passwordError}</InlineAlert> : null}
                  <div>
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={passwords.currentPassword}
                      onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="newPassword">New password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={passwords.newPassword}
                        onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))}
                        minLength={8}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm new password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={passwords.confirmPassword}
                        onChange={(event) => setPasswords((value) => ({ ...value, confirmPassword: event.target.value }))}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="outline" loading={passwordSaving}>
                    <KeyRound className="h-4 w-4" /> Update password
                  </Button>
                </form>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Account" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Email</span>
                <span className="truncate font-medium text-ink-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Role</span>
                <Badge tone="brand">{titleCase(user.role)}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Auth provider</span>
                <span className="font-medium capitalize text-ink-900">{user.authProvider}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Status</span>
                <Badge tone={user.isActive ? "green" : "rose"}>{user.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Email verification" />
            <CardBody>
              {user.isEmailVerified ? (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <MailCheck className="h-4 w-4" /> Verified
                </p>
              ) : resent ? (
                <p className="text-sm text-ink-500">Verification email requested. Check your inbox.</p>
              ) : (
                <div>
                  <p className="text-sm text-ink-500">
                    Verify your email to confirm ownership and keep account recovery working.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => void resendVerification()}>
                    Resend verification
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Session security
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-500">
                Sessions use short-lived access cookies and rotating refresh tokens. Sign out from the
                top menu when using a shared device.
              </p>
              <Link to="/forgot-password" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                <UserRound className="h-3.5 w-3.5" /> Reset via email instead
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
