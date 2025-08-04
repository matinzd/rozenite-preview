import { ComponentType } from "react";
import { Metadata, Module, Preview } from "../shared/types";
import { createSignalMap } from "../utils/signal-map";
import { client } from "./setup-plugin";

const registry = createSignalMap<number, Preview[]>(() => {
  const previews = getPreviewComponents();
  client?.send("registry-updated", previews);
});

function flattenRegistryEntries() {
  return Array.from(registry.values()).flat();
}

export function getPreviewComponents(): Preview[] {
  return flattenRegistryEntries();
}

export function getComponentByName(name: string) {
  return (
    flattenRegistryEntries().find((entry) => entry.name === name)?.component ||
    null
  );
}

/**
 *
 * @internal
 */
const __registerPreviewInternal = (
  module: Module,
  name: string,
  component: ComponentType,
  metadata?: Metadata
) => {
  if (
    process.env.NODE_ENV !== "development" ||
    !module.hot ||
    module.id === undefined
  ) {
    console.warn(
      `[Rozenite Preview Plugin] Cannot register preview "${name}" in production or in non Metro environment.`
    );
    return;
  }

  if (metadata?.isInsideReactComponent) {
    console.error(
      '[Rozenite Preview Plugin] Do not call "registerPreview" inside a React lifecycle. Use it at the top level of your module.'
    );
    return;
  }

  let moduleId = module.id;

  module.hot.dispose(() => {
    registry.delete(moduleId);
  });

  const current = registry.get(module.id) || [];

  const updated = [
    ...current.filter((entry) => entry.name !== name),
    { name, component, metadata },
  ];

  registry.set(module.id, updated);
};

/**
 * Register a preview component.
 *
 * @param name Preview name
 * @param component React component
 */
export function registerPreview(name: string, component: React.ComponentType) {
  if (arguments.length !== 4) {
    console.warn("[Rozenite Preview Plugin] Babel plugin is not configured correctly. This will result in a broken preview.");
    return;
  }

  __registerPreviewInternal(
    arguments[0] as Module,
    arguments[1] as string,
    arguments[2] as React.ComponentType,
    arguments[3] as Metadata
  );
}
