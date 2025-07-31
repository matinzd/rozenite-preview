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
    existingClient.send("preview-list", previews);
    console.log(`Sent initial preview list with entries`, previews);
  });
}

// function setupHMRListener() {
//   if (!__DEV__) {
//     return;
//   }
//   let isUpdating = false;
//   DeviceEventEmitter.addListener("websocketMessage", (data) => {
//     try {
//       const response = JSON.parse(data.data);
//       if (response.type === "update" && response.body?.modified?.length > 0) {
//         isUpdating = true;
//       }

//       if (isUpdating && response?.type === "update-done") {
//         isUpdating = false;
//         // Do your changes here!
//         console.log("HMR update done, reloading previews...");
//         console.log("Detected removed components, updating registry...");
//         import("./preview-registry").then(({ detectRemovedComponents }) => {
//           detectRemovedComponents();
//         });
//       }
//     } catch (e) {
//       console.log("Failed to parse the webSocketMessage event data!", e);
//     }
//   });
// }

setupPlugin();

// setupHMRListener();
