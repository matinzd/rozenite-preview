import { Metadata, Preview } from "../shared/types";
import { getClient } from "./setup-plugin";

const registry = new Map<string, Preview>();

export async function registerPreview(
  name: string,
  component: React.ComponentType
): Promise<void>;

/**
 * Register a preview component.
 * @param name Preview name
 * @param component React component
 */
export async function registerPreview(
  name: string,
  component: React.ComponentType,
  /**
   * This is injected by babel plugin
   * @internal
   */
  metadata?: Metadata
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (metadata?.isInsideReactComponent) {
    console.error(
      `Cannot register preview "${name}" from inside a React component. Please call it at the top level of your module.`
    );
    return;
  }

  const entry: Preview = {
    name,
    component,
    metadata,
  };

  registry.set(name, entry);

  const client = await getClient();

  if (!client) {
    console.warn(
      `No Rozenite DevTools client found! Cannot register preview: ${name}`
    );
    return;
  }

  client.send("preview-added", entry);
}

export function getPreviewComponents(): Preview[] {
  return Array.from(registry.values());
}

export function getComponentByName(name: string) {
  return registry.get(name)?.component;
}
