export type ProjectStatus = "active" | "closed";
export type OfferStatus = "pending" | "accepted" | "rejected";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  canton: string;
  location: string;
  budgetChf: number;
  deadlineIso: string;
  status: ProjectStatus;
  ownerId: string;
}

export interface ProjectOffer {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  amountChf: number;
  message: string;
  submittedAtIso: string;
  status: OfferStatus;
}

export interface ProjectFilters {
  search?: string;
  category?: string;
  canton?: string;
  status?: ProjectStatus | "all";
}
