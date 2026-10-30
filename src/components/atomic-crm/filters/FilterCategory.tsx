import { Translate } from "ra-core";
import type { ReactNode } from "react";

export const FilterCategory = ({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 border-t pt-4">
    <h3 className="flex flex-row items-center gap-2 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground [&_svg]:size-3.5">
      {icon}
      <Translate i18nKey={label} />
    </h3>
    <div className="flex md:flex-col flex-wrap items-start gap-0.5">
      {children}
    </div>
  </div>
);
