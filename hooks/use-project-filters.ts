"use client";

import { useMemo, useState } from "react";

import type { Project, ProjectFilters } from "@/types/project";

const includesInsensitive = (value: string, query: string): boolean =>
  value.toLowerCase().includes(query.toLowerCase());

export const useProjectFilters = (projects: Project[]) => {
  const [filters, setFilters] = useState<ProjectFilters>({
    status: "all",
    category: "all",
    canton: "all",
    search: "",
  });

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (filters.status && filters.status !== "all" && project.status !== filters.status) {
        return false;
      }

      if (filters.category && filters.category !== "all" && project.category !== filters.category) {
        return false;
      }

      if (filters.canton && filters.canton !== "all" && project.canton !== filters.canton) {
        return false;
      }

      if (!filters.search?.trim()) {
        return true;
      }

      const searchValue = `${project.title} ${project.description} ${project.location}`;
      return includesInsensitive(searchValue, filters.search);
    });
  }, [filters, projects]);

  return {
    filters,
    setFilters,
    filteredProjects,
  };
};
