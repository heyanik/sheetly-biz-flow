import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGasUrl, setGasUrl, gas } from "@/lib/gas";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Setup — Textile ERP" }] }),
  component: Setup,
});

function Setup() {
  const [url, setUrl] = useState(getGasUrl() ?? "");
  const [testing, setTesting] = useState(false);
  const navigate = useNavigate();

  async function save() {
    if (!/^https:\/\/script\.google\.com\/.+\/exec/.test(url)) {
      toast.error("Enter a valid Apps Script /exec URL");
      return;
    }
    setGasUrl(url);
    setTesting(true);
    try {
      await gas("init");
      toast.success("Connected — sheets initialized");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Textile ERP — Setup</h1>
          <p className="text-muted-foreground mt-2">
            Paste your Google Apps Script Web App URL to connect.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="https://script.google.com/macros/s/AKfy.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={save} disabled={testing}>
              {testing ? "Connecting…" : "Save & Connect"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}