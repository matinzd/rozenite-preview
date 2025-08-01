import { ComponentType } from "react";
import { Metadata, MetroModule, Preview } from "../shared/types";
import { createSignalMap } from "../utils/signal-map";
import { client } from "./setup-plugin";

const registry = createSignalMap<number, Preview[]>(() => {
  const previews = getPreviewComponents();
  client?.send("registry-updated", previews);
});

export function getPreviewComponents(): Preview[] {
  return Array.from(registry.values()).flatMap((entry) =>
    entry.map((e) => ({
      name: e.name,
      component: e.component,
      metadata: e.metadata,
    }))
  );
}

export function getComponentByName(name: string) {
  const previews = Array.from(registry.values())
    .flatMap((entry) => entry)
    .find((e) => e.name === name);
  return previews?.component;
}

/**
 * 
 * @internal
 */
const __registerPreviewInternal = (
  module: MetroModule,
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
      `Cannot register preview "${name}" in production or in non Metro environment.`
    );
    return;
  }

  let moduleId = module.id;

  const originalDisposeCallback = module.hot._disposeCallback;

  module.hot._disposeCallback = () => {
    originalDisposeCallback?.();
    registry.delete(moduleId);
  };

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
  __registerPreviewInternal(
    ...(arguments as unknown as [MetroModule, string, ComponentType, Metadata])
  );
}
