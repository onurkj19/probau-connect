import type { ReactNode } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

const PublicLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-white">
    <PublicHeader />
    <main>{children}</main>
    <PublicFooter />
  </div>
);

export default PublicLayout;
