import { authenticate } from "../shopify.server";
import { Page, Card, TextField, Button, Layout } from "@shopify/polaris";
import { useEffect, useState } from "react";

/* ---------------- LOADER (AUTH ONLY) ---------------- */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

/* ---------------- NAV ---------------- */
export const handle = {
  nav: {
    label: "Settings",
    primary: true,
  },
};

/* ---------------- UI ---------------- */
export default function YmmPage() {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Load existing key
  useEffect(() => {
    fetch("/api/ymm-key")
      .then(res => res.json())
      .then(data => {
        if (data.apiKey) setApiKey(data.apiKey);
      });
  }, []);

  const saveApiKey = async () => {
    setSaving(true);

    await fetch("/api/ymm-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    setSaving(false);
  };

  return (
    <Page title="Settings">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextField
              label="Public Widget API Key"
              value={apiKey}
              onChange={setApiKey}
              autoComplete="off"
              helpText="This key is used by the storefront YMM widget"
            />

            <Button
              primary
              loading={saving}
              onClick={saveApiKey}
              style={{ marginTop: 16 }}
            >
              Save API Key
            </Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}