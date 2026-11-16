function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1b2438;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
      <div style="font-size:20px;font-weight:700;color:#1d4ed8;margin-bottom:20px;">HireSphere AI</div>
      <div style="background:#ffffff;border:1px solid #e5e9f2;border-radius:14px;padding:28px;">
        <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
        ${body}
      </div>
      <p style="font-size:12px;color:#7a869e;margin-top:18px;">
        This message was sent by HireSphere AI. If you did not request it, you can ignore it.
      </p>
    </div>
  </body>
</html>`;
}

function button(label: string, url: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${escapeHtml(label)}</a></p>`;
}

export function verificationEmail(name: string, url: string) {
  return {
    subject: "Verify your HireSphere AI email",
    html: layout(
      `Welcome, ${escapeHtml(name)}`,
      `<p>Confirm your email address to activate your HireSphere AI account.</p>${button("Verify email", url)}<p style="color:#55627a;font-size:13px;">This link expires in 24 hours.</p>`
    )
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to HireSphere AI",
    html: layout(
      `You're in, ${escapeHtml(name)}`,
      `<p>Your HireSphere AI account is ready. Complete your profile to get the most relevant opportunities and hiring recommendations.</p>`
    )
  };
}

export function passwordResetEmail(name: string, url: string) {
  return {
    subject: "Reset your HireSphere AI password",
    html: layout(
      `Password reset requested`,
      `<p>Hi ${escapeHtml(name)}, use the button below to choose a new password. This link expires in one hour.</p>${button("Reset password", url)}`
    )
  };
}

export function applicationConfirmationEmail(name: string, jobTitle: string, companyName: string) {
  return {
    subject: `Application received: ${jobTitle}`,
    html: layout(
      "Application received",
      `<p>Hi ${escapeHtml(name)}, your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> was submitted successfully.</p><p>You can track its status from your HireSphere AI dashboard.</p>`
    )
  };
}

export function applicationStatusEmail(name: string, jobTitle: string, status: string) {
  return {
    subject: `Application update: ${jobTitle}`,
    html: layout(
      "Your application status changed",
      `<p>Hi ${escapeHtml(name)}, the status of your application for <strong>${escapeHtml(jobTitle)}</strong> is now <strong>${escapeHtml(status.replaceAll("_", " "))}</strong>.</p>`
    )
  };
}

export function interviewInvitationEmail(
  name: string,
  jobTitle: string,
  scheduledAt: string,
  location?: string
) {
  return {
    subject: `Interview invitation: ${jobTitle}`,
    html: layout(
      "Interview invitation",
      `<p>Hi ${escapeHtml(name)}, you have been invited to interview for <strong>${escapeHtml(jobTitle)}</strong>.</p><p><strong>When:</strong> ${escapeHtml(scheduledAt)}</p>${location ? `<p><strong>Where:</strong> ${escapeHtml(location)}</p>` : ""}<p>Please review your dashboard for details.</p>`
    )
  };
}

export function newApplicationEmail(employerName: string, candidateName: string, jobTitle: string) {
  return {
    subject: `New application for ${jobTitle}`,
    html: layout(
      "New application received",
      `<p>Hi ${escapeHtml(employerName)}, ${escapeHtml(candidateName)} applied for <strong>${escapeHtml(jobTitle)}</strong>.</p><p>Review the application from your employer dashboard.</p>`
    )
  };
}
