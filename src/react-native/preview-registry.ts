import { Preview } from "../shared/types";
import { getClient, pendingRegistrations } from "./setup-plugin";

const previewRegistry = new Map<string, React.ComponentType>();

export async function registerPreview(
  name: string,
  component: React.ComponentType
) {
  previewRegistry.set(name, component);

  const client = await getClient();

  if (!client) {
    pendingRegistrations.push({ name, component });
    return;
  }

  client.send("preview-added", {
    name,
    component,
  });
}

export function getPreviewComponents(): Preview[] {
  return Array.from(previewRegistry.entries()).map(([name, component]) => ({
    name,
    component,
  }));
}

export function getComponentByName(name: string) {
  return previewRegistry.get(name);
}
