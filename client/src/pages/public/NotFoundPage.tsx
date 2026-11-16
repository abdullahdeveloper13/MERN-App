import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="h-8 w-8" />
      </div>
      <p className="mt-5 text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-950">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
        </Link>
        <Link to="/jobs">
          <Button>Browse jobs</Button>
        </Link>
      </div>
    </div>
  );
}
