import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { getGasUrl } from "@/lib/gas";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !getGasUrl() && location.pathname !== "/setup") {
      throw redirect({ to: "/setup" });
    }
  },
  component: AppLayout,
});