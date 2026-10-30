import * as React from "react";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext";

export const Layout = ({ children }: React.PropsWithChildren) => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();

  return (
    <div className="min-h-screen flex">
      <div className="relative grid w-full lg:grid-cols-2">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img className="h-6 mr-2" src={darkModeLogo} alt={title} />
            {title}
          </div>
        </div>
        <div className="flex flex-col justify-center w-full px-4 py-10 lg:p-8">
          <div className="w-full space-y-6 sm:mx-auto sm:w-[380px]">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold lg:hidden">
              <img
                className="[.light_&]:hidden h-6"
                src={darkModeLogo}
                alt=""
              />
              <img
                className="[.dark_&]:hidden h-6"
                src={lightModeLogo}
                alt=""
              />
              {title}
            </div>
            {children}
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};

export const AuthHeading = ({
  title,
  details,
}: {
  title: string;
  details?: string;
}) => (
  <div className="flex flex-col space-y-2 text-center">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    {details ? (
      <p className="text-sm text-muted-foreground">{details}</p>
    ) : null}
  </div>
);
