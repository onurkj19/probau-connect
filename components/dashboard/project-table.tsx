import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types/project";

export const ProjectTable = ({
  projects,
  basePath,
}: {
  projects: Project[];
  basePath: string;
}) => {
  const t = useTranslations("projects.table");

  return (
    <Table>
      <TableHead>
        <TableRow className="hover:bg-transparent">
          <TableHeaderCell>{t("title")}</TableHeaderCell>
          <TableHeaderCell>{t("location")}</TableHeaderCell>
          <TableHeaderCell>{t("deadline")}</TableHeaderCell>
          <TableHeaderCell>{t("status")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link
                href={`${basePath}/${project.id}`}
                className="font-semibold text-brand-900 underline-offset-2 hover:underline"
              >
                {project.title}
              </Link>
            </TableCell>
            <TableCell>{project.location}</TableCell>
            <TableCell>{formatDate(project.deadlineIso)}</TableCell>
            <TableCell>
              <StatusBadge status={project.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
