import {
  getRozeniteDevToolsClient,
  RozeniteDevToolsClient,
} from "@rozenite/plugin-bridge";
import { PreviewPluginEventMap } from "../shared/messaging";
import { PREVIEW_PLUGIN_ID } from "../shared/types";
import { getPreviewComponents } from "./preview-registry";

export let client: RozeniteDevToolsClient<PreviewPluginEventMap> | null = null;

export const getClient = () => {
  return getRozeniteDevToolsClient<PreviewPluginEventMap>(PREVIEW_PLUGIN_ID);
};

async function setupPlugin() {
  const existingClient = await getClient();

  client = existingClient;

  existingClient.onMessage("request-initial-data", () => {
    const previews = getPreviewComponents();
    console.log(`Sending initial preview data: ${previews.length} previews found`, previews);
    existingClient.send("registry-updated", previews);
  });
}

setupPlugin();
