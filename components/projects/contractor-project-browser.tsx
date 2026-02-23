"use client";

import Link from "next/link";

import { ProjectFiltersBar } from "@/components/projects/project-filters";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { useProjectFilters } from "@/hooks/use-project-filters";
import type { SessionUser } from "@/types/auth";
import type { Project } from "@/types/project";

interface ContractorProjectBrowserProps {
  user: SessionUser;
  projects: Project[];
  categories: string[];
  cantons: string[];
}

export const ContractorProjectBrowser = ({
  user,
  projects,
  categories,
  cantons,
}: ContractorProjectBrowserProps) => {
  const { filters, setFilters, filteredProjects } = useProjectFilters(projects);
  const { openModal } = useModal();

  return (
    <div className="space-y-4">
      <ProjectFiltersBar
        filters={filters}
        categories={categories}
        cantons={cantons}
        onChange={setFilters}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            actions={
              project.status === "closed" ? (
                <Button variant="secondary" size="sm" disabled>
                  Submission closed
                </Button>
              ) : user.isSubscribed ? (
                <Link href={`/dashboard/contractor/projects/${project.id}/submit-offer`}>
                  <Button size="sm">Submit offer</Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    openModal({
                      title: "Subscription required",
                      description:
                        "Unternehmer need an active subscription to submit project offers.",
                      confirmLabel: "Go to subscription",
                      onConfirm: () => {
                        window.location.href = "/dashboard/contractor/subscription";
                      },
                    })
                  }
                >
                  Subscription required
                </Button>
              )
            }
          />
        ))}
      </div>
    </div>
  );
};
