if (process.env.NODE_ENV !== "production") {
  require("./src/react-native/setup-plugin");
}

export { PreviewHost } from "./src/react-native/preview-host";
export { registerPreview } from "./src/react-native/preview-registry";

