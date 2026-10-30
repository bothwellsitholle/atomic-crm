import { useState } from "react";
import { Form, required, useRedirect, useTranslate } from "ra-core";
import { useSetPassword, useSupabaseAccessToken } from "ra-supabase-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/admin/text-input";
import { AuthHeading, Layout } from "@/components/supabase/layout";
import { clearAuthCache } from "@/components/atomic-crm/providers/supabase/authProvider";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext";

const MIN_PASSWORD_LENGTH = 8;

interface SetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const SetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const { title } = useConfigurationContext();

  const access_token = useSupabaseAccessToken();
  const refresh_token = useSupabaseAccessToken({
    parameterName: "refresh_token",
  });
  const isInvite =
    useSupabaseAccessToken({ parameterName: "type" }) === "invite";

  const translate = useTranslate();
  const redirect = useRedirect();
  const [, { mutateAsync: setPassword }] = useSetPassword({
    onSuccess: () => {
      // The browser may still hold the cached profile of whoever was signed in before
      clearAuthCache();
      redirect("/");
    },
    onError: () => undefined,
  });

  const validate = (values: SetPasswordFormData) => {
    if (values.password && values.password.length < MIN_PASSWORD_LENGTH) {
      return {
        password: "crm.auth.set_password.password_too_short",
      };
    }
    if (values.password !== values.confirmPassword) {
      return {
        confirmPassword: "ra-supabase.validation.password_mismatch",
      };
    }
    return {};
  };

  if (!access_token || !refresh_token || linkInvalid) {
    return (
      <Layout>
        <AuthHeading
          title={translate(
            isInvite
              ? "crm.auth.set_password.invite_title"
              : "crm.auth.set_password.recovery_title",
            { title },
          )}
          details={translate(
            linkInvalid
              ? "crm.auth.set_password.link_invalid"
              : "crm.auth.set_password.missing_link",
          )}
        />
        <Button className="w-full" render={<Link to="/forgot-password" />}>
          {translate("crm.auth.set_password.request_new_link")}
        </Button>
        <BackToSignIn />
      </Layout>
    );
  }

  const submit = async (values: SetPasswordFormData) => {
    try {
      setLoading(true);
      await setPassword({
        access_token,
        refresh_token,
        password: values.password,
      });
    } catch {
      setLinkInvalid(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <AuthHeading
        title={translate(
          isInvite
            ? "crm.auth.set_password.invite_title"
            : "crm.auth.set_password.recovery_title",
          { title },
        )}
        details={translate(
          isInvite
            ? "crm.auth.set_password.invite_details"
            : "crm.auth.set_password.recovery_details",
        )}
      />
      <Form
        className="space-y-6"
        onSubmit={submit as any}
        validate={validate as any}
      >
        <TextInput
          label={translate("ra.auth.password", {
            _: "Password",
          })}
          helperText={translate("crm.auth.set_password.password_hint", {
            count: MIN_PASSWORD_LENGTH,
          })}
          autoComplete="new-password"
          source="password"
          type="password"
          validate={required()}
        />
        <TextInput
          label={translate("crm.auth.confirm_password", {
            _: "Confirm password",
          })}
          autoComplete="new-password"
          source="confirmPassword"
          type="password"
          validate={required()}
        />
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={loading}
        >
          {translate(
            loading
              ? "crm.auth.set_password.saving"
              : isInvite
                ? "crm.auth.set_password.invite_submit"
                : "crm.auth.set_password.recovery_submit",
          )}
        </Button>
      </Form>
    </Layout>
  );
};

export const BackToSignIn = () => {
  const translate = useTranslate();
  return (
    <Link
      to="/login"
      className="block text-sm text-center text-muted-foreground hover:text-foreground hover:underline"
    >
      {translate("crm.auth.back_to_sign_in")}
    </Link>
  );
};

SetPasswordPage.path = "set-password";
