"use client";

import { Download } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { buildReconciliationTemplate } from "@/lib/templates/reconciliation-template";
import { Button } from "@/components/ui/button";

export function TemplateDownload() {
  return (
    <Button
      size="lg"
      icon={<Download className="size-5" aria-hidden />}
      data-cta="template-download"
      onClick={() => {
        const data = buildReconciliationTemplate();
        const blob = new Blob([new Uint8Array(data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "modele-rapprochement-bancaire-releveo.xlsx";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        track("free_tool_used", { tool: "template" });
      }}
    >
      Télécharger le modèle Excel (gratuit)
    </Button>
  );
}
