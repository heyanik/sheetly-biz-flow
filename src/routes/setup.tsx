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
            One-time backend setup. Deploy the Apps Script then paste the Web App URL below.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Deploy the backend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Create a new Google Sheet (any blank sheet works).</li>
              <li>Open <span className="font-mono">Extensions → Apps Script</span>.</li>
              <li>Delete the default code and paste the contents of <span className="font-mono">Code.gs</span> (provided in chat).</li>
              <li>Click <span className="font-mono">Deploy → New deployment → Web app</span>.</li>
              <li>Execute as: <b>Me</b>. Who has access: <b>Anyone</b>. Click Deploy and authorize.</li>
              <li>Copy the <span className="font-mono">/exec</span> URL and paste it below.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Connect</CardTitle>
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