import { FlaskConical } from "lucide-react";
import { useTranslate } from "ra-core";
import { Button } from "@/components/ui/button";

import { exitDemoMode, isDemoMode } from "./demoMode";

export const DemoModeBanner = () => {
  const translate = useTranslate();
  if (!isDemoMode()) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
      <FlaskConical className="size-4 shrink-0" />
      <span>{translate("crm.demo_mode.banner")}</span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 shrink-0 border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/20"
        onClick={exitDemoMode}
      >
        {translate("crm.demo_mode.exit")}
      </Button>
    </div>
  );
};

export const DemoModeMobileBadge = () => {
  const translate = useTranslate();
  if (!isDemoMode()) return null;
  return (
    <button
      type="button"
      onClick={exitDemoMode}
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
    >
      <FlaskConical className="size-3.5" />
      {translate("crm.demo_mode.label")} · {translate("crm.demo_mode.exit")}
    </button>
  );
};
