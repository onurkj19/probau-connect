import Link from "next/link";

import { Button } from "@/components/ui/button";

const NotFound = () => (
  <section className="flex min-h-[70vh] items-center bg-neutral-50">
    <div className="container text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-swiss-red">404</p>
      <h1 className="mt-2 text-4xl font-bold text-brand-900">Page not found</h1>
      <p className="mt-3 text-neutral-600">The page you requested does not exist.</p>
      <div className="mt-6">
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  </section>
);

export default NotFound;
