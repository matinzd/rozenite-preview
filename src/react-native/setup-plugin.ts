import {
  getRozeniteDevToolsClient,
  RozeniteDevToolsClient,
} from "@rozenite/plugin-bridge";
import { PreviewPluginEventMap } from "../shared/messaging";
import { PREVIEW_PLUGIN_ID } from "../shared/types";
import { getPreviewComponents } from "./preview-registry";

export let client: RozeniteDevToolsClient<PreviewPluginEventMap> | null = null;

const getClient = () => {
  return getRozeniteDevToolsClient<PreviewPluginEventMap>(PREVIEW_PLUGIN_ID);
};

async function setupPlugin() {
  const existingClient = await getClient();

  client = existingClient;

  existingClient.onMessage("request-initial-data", () => {
    const previews = getPreviewComponents();
    existingClient.send("registry-updated", previews);
  });
}

setupPlugin();
