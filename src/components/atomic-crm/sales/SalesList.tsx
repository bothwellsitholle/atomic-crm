import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  Ellipsis,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import {
  useDataProvider,
  useGetIdentity,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { Link } from "react-router";
import { Confirm } from "@/components/admin/confirm";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { TopToolbar } from "../layout/TopToolbar";
import type { CrmDataProvider } from "../providers/types";
import type { Sale, SaleInviteStatus } from "../types";

const INVITE_STATUSES_KEY = ["sales", "inviteStatuses"];

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="resources.sales.action.new" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const useInviteStatus = (sale?: Sale) => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const { data, isPending } = useQuery({
    queryKey: INVITE_STATUSES_KEY,
    queryFn: () => dataProvider.salesGetInviteStatuses(),
  });
  return {
    isPending,
    inviteStatus: data?.find(
      (status: SaleInviteStatus) => status.user_id === sale?.user_id,
    ),
  };
};

const StatusField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Sale>();
  const translate = useTranslate();
  const { inviteStatus, isPending } = useInviteStatus(record);
  if (!record) return null;
  if (isPending) {
    return (
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }
  if (!inviteStatus) return null;

  const isPendingInvite = inviteStatus.status === "pending";
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge
        variant="outline"
        className={
          isPendingInvite
            ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
            : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
        }
      >
        {translate(
          isPendingInvite
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
      ) : isPendingInvite ? (
        <span className="text-xs text-muted-foreground">
          {translate("resources.sales.invite.never_signed_in")}
        </span>
      ) : null}
    </div>
  );
};

const RowActions = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Sale>();
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const { identity } = useGetIdentity();
  const { inviteStatus } = useInviteStatus(record);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const name = record ? `${record.first_name} ${record.last_name}` : "";
  const reload = () => {
    refresh();
    queryClient.invalidateQueries({ queryKey: INVITE_STATUSES_KEY });
  };

  const resend = useMutation({
    mutationFn: (id: Sale["id"]) => dataProvider.salesResendInvite(id),
    onSuccess: ({ email }) =>
      notify("resources.sales.invite.sent", { messageArgs: { email } }),
    onError: (error: Error) =>
      notify("resources.sales.invite.error_with_reason", {
        type: "error",
        messageArgs: { reason: error.message },
      }),
  });

  const toggleDisabled = useMutation({
    mutationFn: (sale: Sale) =>
      dataProvider.salesUpdate(sale.id, {
        first_name: sale.first_name,
        last_name: sale.last_name,
        email: sale.email,
        administrator: sale.administrator,
        disabled: !sale.disabled,
      }),
    onSuccess: (sale) => {
      notify(
        sale.disabled
          ? "resources.sales.manage.disabled"
          : "resources.sales.manage.enabled",
        { messageArgs: { name } },
      );
      reload();
    },
    onError: () =>
      notify("resources.sales.manage.update_error", { type: "error" }),
  });

  const remove = useMutation({
    mutationFn: (id: Sale["id"]) => dataProvider.salesDelete(id),
    onSuccess: () => {
      setConfirmDelete(false);
      notify("resources.sales.manage.deleted", { messageArgs: { name } });
      reload();
    },
    onError: (error: Error) => {
      setConfirmDelete(false);
      notify("resources.sales.manage.delete_error", {
        type: "error",
        messageArgs: { reason: error.message },
      });
    },
  });

  if (!record) return null;
  const isSelf = identity?.id === record.id;
  // The menu closes on click, so the trigger itself shows the request running
  const isBusy =
    resend.isPending || toggleDisabled.isPending || remove.isPending;
  const canResend = inviteStatus?.status === "pending" && !record.disabled;

  return (
    // Keeps clicks in the menu and dialog from also opening the row
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isBusy}
              aria-label={translate("resources.sales.manage.actions")}
              aria-busy={isBusy}
            />
          }
        >
          {isBusy ? <Loader2 className="animate-spin" /> : <Ellipsis />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            render={<Link to={`/sales/${record.id}`} />}
            className="cursor-pointer"
          >
            <Pencil />
            {translate("ra.action.edit")}
          </DropdownMenuItem>
          {canResend ? (
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={resend.isPending}
              onClick={() => resend.mutate(record.id)}
            >
              <Send />
              {translate("resources.sales.invite.resend")}
            </DropdownMenuItem>
          ) : null}
          {isSelf ? null : (
            <>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={toggleDisabled.isPending}
                onClick={() => toggleDisabled.mutate(record)}
              >
                {record.disabled ? <RotateCcw /> : <Ban />}
                {translate(
                  record.disabled
                    ? "resources.sales.manage.enable"
                    : "resources.sales.manage.disable",
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
                {translate("resources.sales.manage.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Confirm
        isOpen={confirmDelete}
        loading={remove.isPending}
        title="resources.sales.manage.delete_title"
        titleTranslateOptions={{ name }}
        content="resources.sales.manage.delete_content"
        confirm="resources.sales.manage.delete"
        confirmColor="warning"
        onConfirm={() => remove.mutate(record.id)}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
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
        <DataTable.Col label={false} className="w-12">
          <RowActions />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}
