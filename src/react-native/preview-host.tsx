import { useRozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { JSX, useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import { PreviewPluginEventMap } from "../shared/messaging";
import { PREVIEW_PLUGIN_ID } from "../shared/types";
import { getComponentByName } from "./preview-registry";

interface PreviewHostProps {
  children?: React.ReactNode;
}

export const PreviewHost = (props: PreviewHostProps): JSX.Element => {
  const { children } = props;

  const client = useRozeniteDevToolsClient<PreviewPluginEventMap>({
    pluginId: PREVIEW_PLUGIN_ID,
  });

  const [, setPreviewName] = useState<string | null>(null);
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (!client) return;

    const removePreviewSelectListener = client.onMessage(
      "preview-select",
      (data) => {
        setPreviewName(data.name);
        const component = getComponentByName(data.name);
        setComponent(() => component || null);
      }
    );

    const removePreviewClearListener = client.onMessage(
      "preview-clear",
      () => {
        setPreviewName(null);
        setComponent(null);
      }
    );

    return () => {
      removePreviewSelectListener.remove();
      removePreviewClearListener.remove();
    };
  }, [client]);

  if (!Component) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView>
      <Component />
    </SafeAreaView>
  );
};
