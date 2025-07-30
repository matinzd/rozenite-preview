import type { RozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { Preview } from "./types";

export type PreviewPluginEventMap = {
  "request-initial-data": unknown;
  "preview-clear": unknown;
  "preview-list": Preview[];
  "preview-added": Preview;
  "preview-select": {
    name: string;
  };
};

export type PreviewPluginClient = RozeniteDevToolsClient<PreviewPluginEventMap>;
