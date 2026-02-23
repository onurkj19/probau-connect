import { redirect } from "next/navigation";

const ContractorIndexPage = () => {
  redirect("/dashboard/contractor/projects");
};

export default ContractorIndexPage;
