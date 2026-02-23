import { CreateProjectForm } from "@/components/forms/create-project-form";
import { Card } from "@/components/ui/card";

const ArbeitsgeberCreateProjectPage = () => (
  <div className="space-y-5">
    <div>
      <h1 className="text-3xl font-bold text-brand-900">Create Project</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Publish a structured brief and receive professional offers.
      </p>
    </div>

    <Card>
      <CreateProjectForm />
    </Card>
  </div>
);

export default ArbeitsgeberCreateProjectPage;
