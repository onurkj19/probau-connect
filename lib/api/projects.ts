import { offers, projects } from "@/lib/data/mock-projects";
import type { Project, ProjectFilters, ProjectOffer, ProjectStatus } from "@/types/project";

const wait = async (ms = 120): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const resolveStatus = (project: Project): ProjectStatus => {
  if (project.status === "closed") {
    return "closed";
  }

  return new Date(project.deadlineIso).getTime() < Date.now() ? "closed" : "active";
};

const hydrateProject = (project: Project): Project => ({
  ...project,
  status: resolveStatus(project),
});

export const listAllProjects = async (): Promise<Project[]> => {
  await wait();
  return projects.map(hydrateProject);
};

export const listFeaturedProjects = async (): Promise<Project[]> => {
  await wait();
  return projects.map(hydrateProject).slice(0, 3);
};

export const listEmployerProjects = async (ownerId: string): Promise<Project[]> => {
  await wait();
  return projects.filter((project) => project.ownerId === ownerId).map(hydrateProject);
};

export const listContractorProjects = async (filters: ProjectFilters = {}): Promise<Project[]> => {
  await wait();
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return projects
    .map(hydrateProject)
    .filter((project) => {
      if (filters.status && filters.status !== "all" && project.status !== filters.status) {
        return false;
      }

      if (filters.category && filters.category !== "all" && project.category !== filters.category) {
        return false;
      }

      if (filters.canton && filters.canton !== "all" && project.canton !== filters.canton) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchPool = `${project.title} ${project.description} ${project.location}`.toLowerCase();
      return searchPool.includes(normalizedSearch);
    });
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  await wait();
  const project = projects.find((item) => item.id === projectId);
  return project ? hydrateProject(project) : null;
};

export const listOffersByProject = async (projectId: string): Promise<ProjectOffer[]> => {
  await wait();
  return offers.filter((offer) => offer.projectId === projectId);
};

export const listContractorOffers = async (contractorId: string): Promise<ProjectOffer[]> => {
  await wait();
  return offers.filter((offer) => offer.contractorId === contractorId);
};

export const getProjectFilters = async (): Promise<{ categories: string[]; cantons: string[] }> => {
  await wait();
  return {
    categories: [...new Set(projects.map((project) => project.category))].sort(),
    cantons: [...new Set(projects.map((project) => project.canton))].sort(),
  };
};

export const getMarketplaceStats = async (): Promise<{
  activeProjects: number;
  registeredContractors: number;
  cantonsCovered: number;
  offersSubmitted: number;
}> => {
  await wait();
  const hydratedProjects = projects.map(hydrateProject);
  return {
    activeProjects: hydratedProjects.filter((project) => project.status === "active").length,
    registeredContractors: 760,
    cantonsCovered: [...new Set(projects.map((project) => project.canton))].length,
    offersSubmitted: offers.length,
  };
};
