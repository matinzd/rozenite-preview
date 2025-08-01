import type { RozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { Preview } from "./types";

export type PreviewPluginEventMap = {
  "request-initial-data": unknown;
  "show-main-app": unknown;
  "registry-updated": Preview[];
  "preview-select": {
    name: string;
  };
};

export type PreviewPluginClient = RozeniteDevToolsClient<PreviewPluginEventMap>;
