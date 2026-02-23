"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import type { Project } from "@/types/project";

interface UnternehmerProjectBrowserProps {
  projects: Project[];
  cantons: string[];
  isSubscribed: boolean;
}

export const UnternehmerProjectBrowser = ({
  projects,
  cantons,
  isSubscribed,
}: UnternehmerProjectBrowserProps) => {
  const tCommon = useTranslations("common.actions");
  const tFilters = useTranslations("projects.filters");
  const [cantonFilter, setCantonFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (cantonFilter !== "all" && project.canton !== cantonFilter) {
        return false;
      }

      if (!deadlineFilter) {
        return true;
      }

      const selectedDate = new Date(`${deadlineFilter}T23:59:59.999Z`).getTime();
      return new Date(project.deadlineIso).getTime() <= selectedDate;
    });
  }, [cantonFilter, deadlineFilter, projects]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <Select value={cantonFilter} onChange={(event) => setCantonFilter(event.target.value)}>
          <option value="all">{tFilters("allCantons")}</option>
          {cantons.map((canton) => (
            <option key={canton} value={canton}>
              {canton}
            </option>
          ))}
        </Select>

        <input
          type="date"
          value={deadlineFilter}
          onChange={(event) => setDeadlineFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm text-neutral-700"
          aria-label={tFilters("deadlineAriaLabel")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            actions={
              isSubscribed ? (
                <Button size="sm">{tCommon("submitOffer")}</Button>
              ) : (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/unternehmer/subscription">{tCommon("subscriptionRequired")}</Link>
                </Button>
              )
            }
          />
        ))}
      </div>
    </div>
  );
};
