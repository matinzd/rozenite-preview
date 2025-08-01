export interface Metadata {
  id: string;
  name: string | null;
  nameType: "literal" | "identifier" | "template";
  callId: string;
  line: number;
  column: number;
  componentType: string | null;
  relativeFilename: string | null;
  filePath: string | null;
  isInsideReactComponent: boolean;
}

export interface Preview {
  component: React.ComponentType;
  name: string;
  metadata?: Metadata;
}

export const PREVIEW_PLUGIN_ID = "rozenite-preview";

type HotModuleReloadingCallback = () => void;

type HotModuleReloadingData = {
  _acceptCallback?: HotModuleReloadingCallback;
  _disposeCallback?: HotModuleReloadingCallback;
  _didAccept: boolean;
  accept: (callback?: HotModuleReloadingCallback) => void;
  dispose: (callback?: HotModuleReloadingCallback) => void;
};

type ModuleID = number;

type Exports = any;

// https://github.com/facebook/metro/blob/a81c99cf103be00181aa635fef94c6e3385a47bb/packages/metro-runtime/src/polyfills/require.js#L51
export type MetroModule = {
  id?: ModuleID;
  exports: Exports;
  hot?: HotModuleReloadingData;
};
