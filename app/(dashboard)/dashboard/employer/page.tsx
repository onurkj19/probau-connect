import { redirect } from "next/navigation";

const EmployerIndexPage = () => {
  redirect("/dashboard/employer/projects");
};

export default EmployerIndexPage;
