"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ProjectFilters } from "@/types/project";

interface ProjectFiltersProps {
  filters: ProjectFilters;
  categories: string[];
  cantons: string[];
  onChange: (filters: ProjectFilters) => void;
}

export const ProjectFiltersBar = ({ filters, categories, cantons, onChange }: ProjectFiltersProps) => (
  <div className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-4">
    <Input
      value={filters.search ?? ""}
      placeholder="Search projects..."
      onChange={(event) => onChange({ ...filters, search: event.target.value })}
    />

    <Select
      value={filters.status ?? "all"}
      onChange={(event) =>
        onChange({
          ...filters,
          status: event.target.value as ProjectFilters["status"],
        })
      }
    >
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="closed">Closed</option>
    </Select>

    <Select
      value={filters.category ?? "all"}
      onChange={(event) => onChange({ ...filters, category: event.target.value })}
    >
      <option value="all">All categories</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </Select>

    <Select value={filters.canton ?? "all"} onChange={(event) => onChange({ ...filters, canton: event.target.value })}>
      <option value="all">All cantons</option>
      {cantons.map((canton) => (
        <option key={canton} value={canton}>
          {canton}
        </option>
      ))}
    </Select>
  </div>
);
