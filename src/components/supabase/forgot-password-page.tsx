import { useState } from "react";
import { useResetPassword } from "ra-supabase-core";
import { Form, required, useNotify, useRedirect, useTranslate } from "ra-core";
import { AuthHeading, Layout } from "@/components/supabase/layout";
import { BackToSignIn } from "@/components/supabase/set-password-page";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";

interface FormData {
  email: string;
}

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const notify = useNotify();
  const redirect = useRedirect();
  const translate = useTranslate();
  const [, { mutateAsync: resetPassword }] = useResetPassword({
    onSuccess: () => {
      redirect("/login?passwordRecoveryEmailSent=1");
    },
    onError: () => undefined,
  });

  const submit = async (values: FormData) => {
    try {
      setLoading(true);
      await resetPassword({
        email: values.email,
      });
    } catch (error: any) {
      notify(
        typeof error === "string"
          ? error
          : typeof error === "undefined" || !error.message
            ? "ra.auth.sign_in_error"
            : error.message,
        {
          type: "warning",
          messageArgs: {
            _:
              typeof error === "string"
                ? error
                : error && error.message
                  ? error.message
                  : undefined,
          },
        },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <AuthHeading
        title={translate("ra-supabase.reset_password.forgot_password", {
          _: "Forgot password?",
        })}
        details={translate("crm.auth.forgot_password_details")}
      />
      <Form<FormData>
        className="space-y-6"
        onSubmit={submit as SubmitHandler<FieldValues>}
      >
        <TextInput
          source="email"
          type="email"
          label={translate("ra.auth.email", {
            _: "Email",
          })}
          autoComplete="email"
          validate={required()}
        />
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={loading}
        >
          {translate(loading ? "crm.auth.sending" : "crm.auth.send_reset_link")}
        </Button>
      </Form>
      <BackToSignIn />
    </Layout>
  );
};

ForgotPasswordPage.path = "forgot-password";
