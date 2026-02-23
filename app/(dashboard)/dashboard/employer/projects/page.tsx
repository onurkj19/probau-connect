import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listEmployerProjects } from "@/lib/api/projects";

const EmployerProjectsPage = async () => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const projects = await listEmployerProjects(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">My projects</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review your published tenders and monitor offer activity.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            actions={
              <Link href={`/dashboard/employer/projects/${project.id}/offers`}>
                <Button variant="secondary" size="sm">
                  View offers
                </Button>
              </Link>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default EmployerProjectsPage;
