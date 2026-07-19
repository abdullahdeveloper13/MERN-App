import { Navigate, Route, Routes } from "react-router-dom";
import { Shield, Sparkles, Users, Building2, Briefcase } from "lucide-react";

const roles = [
  { title: "Job Seeker", path: "/dashboard/job-seeker", icon: Briefcase },
  { title: "Employer", path: "/dashboard/employer", icon: Building2 },
  { title: "Recruiter", path: "/dashboard/recruiter", icon: Users },
  { title: "Admin", path: "/dashboard/admin", icon: Shield }
];

function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div className="badge"><Sparkles size={14} /> Production-ready hiring platform</div>
        <h1>HireSphere AI</h1>
        <p>Multi-role MERN architecture for job seekers, employers, recruiters, and admins.</p>
        <div className="grid">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <a className="card" key={role.path} href={role.path}>
                <Icon />
                <span>{role.title}</span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Dashboard({ title }: { title: string }) {
  return <main className="page"><section className="panel"><h2>{title}</h2><p>Dashboard scaffold ready for production features.</p></section></main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard/job-seeker" element={<Dashboard title="Job Seeker Dashboard" />} />
      <Route path="/dashboard/employer" element={<Dashboard title="Employer Dashboard" />} />
      <Route path="/dashboard/recruiter" element={<Dashboard title="Recruiter Dashboard" />} />
      <Route path="/dashboard/admin" element={<Dashboard title="Admin Dashboard" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
