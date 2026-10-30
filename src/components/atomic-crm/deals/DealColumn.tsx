import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { findDealLabel } from "./dealUtils";
import { DealCard } from "./DealCard";

const stageAccents: Record<string, string> = {
  won: "bg-emerald-500",
  lost: "bg-rose-500",
  delayed: "bg-amber-500",
};

const defaultStageAccents = [
  "bg-sky-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
];

export const DealColumn = ({
  stage,
  deals,
}: {
  stage: string;
  deals: Deal[];
}) => {
  const totalAmount = deals.reduce((sum, deal) => sum + deal.amount, 0);
  const { dealStages, currency } = useConfigurationContext();
  const stageIndex = dealStages.findIndex((s) => s.value === stage);
  const accent =
    stageAccents[stage] ??
    defaultStageAccents[Math.max(stageIndex, 0) % defaultStageAccents.length];
  return (
    <div className="w-[82vw] shrink-0 snap-start md:w-auto md:shrink md:flex-1 md:min-w-0 flex flex-col rounded-xl bg-muted/70 p-2 pb-6">
      <div className="px-1.5 pt-1 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`size-2 shrink-0 rounded-full ${accent}`} />
          <h3 className="flex-1 min-w-0 text-sm font-semibold leading-tight">
            {findDealLabel(dealStages, stage)}
          </h3>
          <span className="rounded-full bg-card px-2 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-foreground/8">
            {deals.length}
          </span>
        </div>
        <p className="mt-0.5 pl-4 text-xs tabular-nums text-muted-foreground">
          {totalAmount.toLocaleString("en-US", {
            notation: "compact",
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
            minimumSignificantDigits: 3,
          })}
        </p>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-1 flex-col min-h-16 rounded-lg gap-2 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-primary/5 ring-1 ring-inset ring-primary/25"
                : ""
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
