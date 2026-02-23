import type { Project, ProjectOffer } from "@/types/project";
import type { SubscriptionPlan } from "@/types/subscription";

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    monthlyChf: 79,
    description: "For small and regional teams",
    features: [
      "Access to active projects",
      "Submit up to 10 offers per month",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyChf: 149,
    description: "For growing contractors and multi-canton operations",
    features: [
      "Unlimited project offers",
      "Priority project matching",
      "Advanced analytics and notifications",
      "Priority support",
    ],
  },
];

export const projects: Project[] = [
  {
    id: "prj-1001",
    title: "Mehrfamilienhaus - Rohbau und Fassadenarbeiten",
    description:
      "Neubau in Zürich-Oerlikon mit Fokus auf termin- und qualitätsgerechte Ausführung inklusive Fassadensystem.",
    category: "Rohbau",
    canton: "ZH",
    location: "Zürich",
    budgetChf: 420000,
    deadlineIso: "2026-03-19T18:00:00.000Z",
    status: "active",
    ownerId: "employer-01",
  },
  {
    id: "prj-1002",
    title: "Sanierung Schulgebäude - Elektroinstallationen",
    description:
      "Komplette Erneuerung der Elektroanlagen inklusive Brandschutzkonzept und Abnahme durch lokale Behörden.",
    category: "Elektro",
    canton: "BE",
    location: "Bern",
    budgetChf: 160000,
    deadlineIso: "2026-03-03T16:00:00.000Z",
    status: "active",
    ownerId: "employer-01",
  },
  {
    id: "prj-1003",
    title: "Innenausbau Büroflächen",
    description:
      "Trockenbau, Akustikdecken und Bodenbeläge für moderne Büroflächen in Basel.",
    category: "Innenausbau",
    canton: "BS",
    location: "Basel",
    budgetChf: 95000,
    deadlineIso: "2026-01-11T12:00:00.000Z",
    status: "closed",
    ownerId: "employer-01",
  },
  {
    id: "prj-1004",
    title: "Wohnüberbauung - Heizungsersatz",
    description:
      "Ersatz bestehender Heizanlagen durch energieeffiziente Systeme in einer Wohnüberbauung in Lausanne.",
    category: "HLKS",
    canton: "VD",
    location: "Lausanne",
    budgetChf: 230000,
    deadlineIso: "2026-04-08T15:00:00.000Z",
    status: "active",
    ownerId: "employer-02",
  },
  {
    id: "prj-1005",
    title: "Tiefbauarbeiten Erschliessung Quartier",
    description:
      "Leitungs- und Strassenbau für neues Wohnquartier in Luzern, inklusive Koordination mit Werkbetrieben.",
    category: "Tiefbau",
    canton: "LU",
    location: "Luzern",
    budgetChf: 510000,
    deadlineIso: "2026-03-29T17:00:00.000Z",
    status: "active",
    ownerId: "employer-03",
  },
];

export const offers: ProjectOffer[] = [
  {
    id: "off-2001",
    projectId: "prj-1001",
    contractorId: "contractor-01",
    contractorName: "Hochbau Partner AG",
    amountChf: 398000,
    message: "Ausführung in 22 Wochen inkl. Bauleitung und QS-Dokumentation.",
    submittedAtIso: "2026-02-03T10:00:00.000Z",
  },
  {
    id: "off-2002",
    projectId: "prj-1001",
    contractorId: "contractor-02",
    contractorName: "Swiss Construct GmbH",
    amountChf: 411000,
    message: "Alternative Offerte mit Fassaden-Upgrade und erweitertem Wartungspaket.",
    submittedAtIso: "2026-02-07T11:30:00.000Z",
  },
  {
    id: "off-2003",
    projectId: "prj-1002",
    contractorId: "contractor-01",
    contractorName: "Hochbau Partner AG",
    amountChf: 151000,
    message: "Elektroinstallation mit dokumentierter Übergabe und 24 Monate Garantie.",
    submittedAtIso: "2026-01-21T09:15:00.000Z",
  },
];
