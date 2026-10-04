import { Suspense } from "react";
import { IntegrationsContent } from "@/components/integrations/integrations-content";

export default function IntegrationsPage() {
  return (
    // useSearchParams требует Suspense-границу (см. node_modules/next/dist/docs: use-search-params)
    <Suspense fallback={null}>
      <IntegrationsContent />
    </Suspense>
  );
}
