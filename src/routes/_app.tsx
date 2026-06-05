import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { getGasUrl } from "@/lib/gas";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !getGasUrl() && location.pathname !== "/setup") {
      throw redirect({ to: "/setup" });
    }
    if (typeof window !== "undefined" && getGasUrl() && !getSession()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});