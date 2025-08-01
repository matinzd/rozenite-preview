import { useRozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { JSX, useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import { PreviewPluginEventMap } from "../shared/messaging";
import { PREVIEW_PLUGIN_ID } from "../shared/types";
import { getComponentByName } from "./preview-registry";

interface PreviewHostProps {
  children?: React.ReactNode;
}

export function PreviewHost(props: PreviewHostProps): JSX.Element {
  if (process.env.NODE_ENV !== "development") {
    return <>{props.children}</>;
  }

  return <PreviewHostImpl {...props} />;
}

export const PreviewHostImpl = (props: PreviewHostProps): JSX.Element => {
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

    const showMainAppListener = client.onMessage("show-main-app", () => {
      setPreviewName(null);
      setComponent(null);
    });

    return () => {
      removePreviewSelectListener.remove();
      showMainAppListener.remove();
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
