import {
    getRozeniteDevToolsClient,
    RozeniteDevToolsClient,
} from "@rozenite/plugin-bridge";
import { PreviewPluginEventMap } from "../shared/messaging";
import { PREVIEW_PLUGIN_ID } from "../shared/types";
import { getPreviewComponents } from "./preview-registry";

export let client: RozeniteDevToolsClient<PreviewPluginEventMap> | null = null;

export const pendingRegistrations: Array<{
  name: string;
  component: React.ComponentType;
}> = [];

export const getClient = () => {
  return getRozeniteDevToolsClient<PreviewPluginEventMap>(PREVIEW_PLUGIN_ID);
};

function processPendingRegistrations() {
  if (!client || pendingRegistrations.length === 0) {
    return;
  }

  console.log(
    `Processing ${pendingRegistrations.length} pending preview registrations`
  );

  // Send all pending registrations
  pendingRegistrations.forEach(({ name, component }) => {
    client!.send("preview-added", {
      name,
      component,
    });
  });

  // Clear the queue
  pendingRegistrations.length = 0;
}

async function setupPlugin() {
  const existingClient = await getClient();

  console.log("Setting up preview plugin", existingClient);

  client = existingClient;

  processPendingRegistrations();

  existingClient.onMessage("request-initial-data", () => {
    const previews = getPreviewComponents();
    existingClient.send("preview-list", previews);
    console.log("Initial preview data sent:", previews);
  });
}

setupPlugin();
