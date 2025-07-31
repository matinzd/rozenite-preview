export interface Metadata {
  id: string;
  name: string | null;
  nameType: "literal" | "identifier" | "template";
  callId: string;
  line: number;
  column: number;
  componentType: string | null;
  timestamp: number;
  relativeFilename: string | null;
  filePath: string | null;
  isInsideReactComponent: boolean; 
}

export interface Preview {
  component: React.ComponentType;
  name: string;
  metadata?: Metadata;
}

export type DevToolsActionType =
  | "preview:list" // DevTools → App: Request list of previewable components
  | "preview:list-response" // App → DevTools: Send back the list
  | "preview:select" // DevTools → App: Select and render a specific component
  | "preview:clear" // DevTools → App: Clear the current preview
  | "preview:update-props" // DevTools → App: Update props passed to previewed component
  | "preview:get-current" // DevTools → App: Ask which component is currently previewed
  | "preview:current-response" // App → DevTools: Respond with currently previewed component
  | "preview:error"; // App → DevTools: Report an error (e.g. component not found)

export const PREVIEW_PLUGIN_ID = "rozenite-preview";
