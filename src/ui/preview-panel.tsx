import { useRozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { useEffect, useState } from "react";
import { PreviewPluginEventMap } from "../shared/messaging";
import { Preview, PREVIEW_PLUGIN_ID } from "../shared/types";
import "./preview-panel.css";

export default function PreviewPanel() {
  const [state, setState] = useState("Loading...");
  const client = useRozeniteDevToolsClient<PreviewPluginEventMap>({
    pluginId: PREVIEW_PLUGIN_ID,
  });

  const [previews, setPreviews] = useState<Preview[]>([]);

  useEffect(() => {
    if (!client) {
      setState("Client not initialized");
      return;
    }

    if (!client) return;

    const previewSubscription = client.onMessage("preview-added", (preview) => {
      setPreviews((prev) => {
        const existingIndex = prev.findIndex((p) => p.name === preview.name);
        if (existingIndex !== -1) {
          // Replace the old preview with the new one
          const updated = [...prev];
          updated[existingIndex] = preview;
          return updated;
        }
        // Add new preview if it doesn't exist
        return [...prev, preview];
      });
    });

    const previewListSubscription = client.onMessage("preview-list", (data) => {
      setState("Received preview list");
      setPreviews(data);
    });

    client.send("request-initial-data", {});
    setState("Initial data requested");

    return () => {
      previewSubscription.remove();
      previewListSubscription.remove();
    };
  }, [client]);

  const onPreviewSelect = (name: string) => {
    if (!client) return;

    client.send("preview-select", { name });
  };

  const getStatusClass = (status: string) => {
    if (status.includes("Loading")) return "status-loading";
    if (status.includes("not initialized")) return "status-error";
    if (status.includes("added") || status.includes("Received"))
      return "status-success";
    return "status-default";
  };

  const getStatusIcon = (status: string) => {
    if (status.includes("Loading")) return "⏳";
    if (status.includes("not initialized")) return "❌";
    if (status.includes("added") || status.includes("Received")) return "✅";
    return "ℹ️";
  };

  return (
    <div className="preview-panel">
      <div className="preview-container">
        {/* Header Section */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-icon">
              <span>👁️</span>
            </div>
            <div className="header-text">
              <h1>Preview Panel</h1>
              <p>Select your component to open the preview on the simulator</p>
            </div>
          </div>
        </div>

        {/* Previews Section */}
        <div className="previews-card">
          <div className="previews-header">
            <h2 className="previews-title">Available Previews</h2>
            <div className="preview-count">
              <span className="count-dot"></span>
              <span className="count-text">{previews.length} available</span>
            </div>
          </div>

          <div className="previews-content">
            {previews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <span>📦</span>
                </div>
                <h3 className="empty-title">No previews available</h3>
                <p className="empty-description">
                  Components will appear here once they're loaded
                </p>
              </div>
            ) : (
              <div className="preview-grid">
                {previews.map((preview) => (
                  <button
                    key={preview.name}
                    onClick={() => onPreviewSelect(preview.name)}
                    className="preview-card"
                  >
                    <div className="preview-card-header">
                      <div className="preview-icon">
                        <span>⚡</span>
                      </div>
                      <div className="preview-name">
                        <h3 className="preview-title">{preview.name}</h3>
                      </div>
                      <div className="preview-arrow">
                        <span>→</span>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="preview-overlay"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Debug Information (collapsible) */}
        <details className="debug-section">
          <summary className="debug-summary">
            <span className="debug-title">Debug Information</span>
            <span className="debug-arrow">▼</span>
          </summary>
          <div className="debug-content">
            <pre className="debug-pre">{JSON.stringify(previews, null, 2)}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}
