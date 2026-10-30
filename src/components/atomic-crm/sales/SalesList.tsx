import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import {
  useDataProvider,
  useNotify,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TopToolbar } from "../layout/TopToolbar";
import type { CrmDataProvider } from "../providers/types";
import type { Sale, SaleInviteStatus } from "../types";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="resources.sales.action.new" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const useInviteStatus = (sale?: Sale): SaleInviteStatus | undefined => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const { data } = useQuery({
    queryKey: ["sales", "inviteStatuses"],
    queryFn: () => dataProvider.salesGetInviteStatuses(),
  });
  return data?.find((status) => status.user_id === sale?.user_id);
};

const StatusField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Sale>();
  const translate = useTranslate();
  const inviteStatus = useInviteStatus(record);
  if (!record || !inviteStatus) return null;

  const isPending = inviteStatus.status === "pending";
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge
        variant="outline"
        className={
          isPending
            ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
            : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
        }
      >
        {translate(
          isPending
            ? "resources.sales.invite.pending"
            : "resources.sales.invite.active",
        )}
      </Badge>
      {inviteStatus.last_sign_in_at ? (
        <span className="text-xs text-muted-foreground">
          {translate("resources.sales.invite.last_sign_in", {
            time: formatDistanceToNow(inviteStatus.last_sign_in_at, {
              addSuffix: true,
            }),
          })}
        </span>
      ) : isPending ? (
        <span className="text-xs text-muted-foreground">
          {translate("resources.sales.invite.never_signed_in")}
        </span>
      ) : null}
    </div>
  );
};

const ResendInviteButton = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Sale>();
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const inviteStatus = useInviteStatus(record);

  const { mutate, isPending } = useMutation({
    mutationFn: (id: Sale["id"]) => dataProvider.salesResendInvite(id),
    onSuccess: ({ email }) =>
      notify("resources.sales.invite.sent", { messageArgs: { email } }),
    onError: () => notify("resources.sales.invite.error", { type: "error" }),
  });

  if (!record || inviteStatus?.status !== "pending" || record.disabled) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={(event) => {
        event.stopPropagation();
        mutate(record.id);
      }}
    >
      <Send />
      {translate("resources.sales.invite.resend")}
    </Button>
  );
};

const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  const translate = useTranslate();
  if (!record) return null;
  return (
    <div className="flex flex-row gap-1">
      {record.administrator && (
        <Badge
          variant="outline"
          className="border-blue-300 dark:border-blue-700"
        >
          {translate("resources.sales.fields.administrator")}
        </Badge>
      )}
      {record.disabled && (
        <Badge
          variant="outline"
          className="border-orange-300 dark:border-orange-700"
        >
          {translate("resources.sales.fields.disabled")}
        </Badge>
      )}
    </div>
  );
};

export function SalesList() {
  return (
    <List
      filters={filters}
      actions={<SalesListActions />}
      sort={{ field: "first_name", order: "ASC" }}
    >
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="first_name" />
        <DataTable.Col source="last_name" />
        <DataTable.Col source="email" />
        <DataTable.Col label="resources.sales.fields.status">
          <StatusField />
        </DataTable.Col>
        <DataTable.Col label={false}>
          <OptionsField />
        </DataTable.Col>
        <DataTable.Col label={false} className="text-right">
          <ResendInviteButton />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}
