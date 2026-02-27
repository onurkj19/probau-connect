import { ShieldBan } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n-routing";

const Banned = () => {
  const { logout } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <main className="bg-background py-24">
      <div className="container flex max-w-xl flex-col items-center text-center">
        <ShieldBan className="h-14 w-14 text-destructive" />
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Account suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has been restricted by the platform administrator. Please contact support if you think this is a mistake.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
          <Button asChild>
            <Link to={`/${lang}`}>Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Banned;
