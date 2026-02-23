import { notFound, redirect } from "next/navigation";

import { CountdownTimer } from "@/components/common/countdown-timer";
import { SubmitOfferForm } from "@/components/forms/submit-offer-form";
import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectById } from "@/lib/api/projects";
import { formatCurrency } from "@/lib/utils";

interface SubmitOfferPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const SubmitOfferPage = async ({ params }: SubmitOfferPageProps) => {
  const routeParams = await params;
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "contractor") {
    redirect("/dashboard");
  }
  if (!user.isSubscribed) {
    redirect("/dashboard/contractor/subscription?upgrade=required");
  }

  const project = await getProjectById(routeParams.projectId);
  if (!project) {
    notFound();
  }
  if (project.status === "closed") {
    redirect("/dashboard/contractor/projects");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Submit offer</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Provide a clear and competitive proposal for this project.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">{project.title}</h2>
        <p className="text-sm text-neutral-600">{project.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-brand-900">Budget: {formatCurrency(project.budgetChf)}</span>
          <CountdownTimer deadlineIso={project.deadlineIso} />
        </div>
      </Card>

      <Card>
        <SubmitOfferForm project={project} />
      </Card>
    </div>
  );
};

export default SubmitOfferPage;
