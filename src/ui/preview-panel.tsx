import { useRozeniteDevToolsClient } from "@rozenite/plugin-bridge";
import { Code, Eye, Package, Play, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { PreviewPluginEventMap } from "../shared/messaging";
import { Preview, PREVIEW_PLUGIN_ID } from "../shared/types";
import "./preview-panel.css";

export default function PreviewPanel() {
  const client = useRozeniteDevToolsClient<PreviewPluginEventMap>({
    pluginId: PREVIEW_PLUGIN_ID,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const [previews, setPreviews] = useState<Preview[]>([]);

  const filteredPreviews = previews.filter((preview) =>
    preview.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!client) {
      return;
    }

    if (!client) return;

    const previewSubscription = client.onMessage("preview-added", (preview) => {
      setPreviews((prev) => {
        const existingIndex = prev.findIndex((p) => p.name === preview.name);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = preview;
          return updated;
        }
        return [...prev, preview];
      });
    });

    const previewListSubscription = client.onMessage("preview-list", (data) => {
      setPreviews(data);
    });

    client.send("request-initial-data", {});

    return () => {
      previewSubscription.remove();
      previewListSubscription.remove();
    };
  }, [client]);

  const onPreviewSelect = (name: string) => {
    if (!client) return;

    client.send("preview-select", { name });
    setSelectedPreview(name);
  };

  const showMainApp = () => {
    if (!client) return;

    client.send("preview-clear", {});
  };

  const refreshPreviews = async () => {
    if (!client) return;

    setIsRefreshing(true);
    client.send("request-initial-data", {});
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getPathWithLineAndColumn = (preview: Preview) => {
    if (!preview.metadata?.filePath) {
      return preview.metadata?.relativeFilename || "Unknown path";
    }

    const { relativeFilename, line, column } = preview.metadata;

    return `${relativeFilename}${line ? `:${line}` : ""}${
      column ? `:${column}` : ""
    }`;
  };

  const navigateToFileInVscode = (preview: Preview) => {
    if (!preview.metadata?.filePath) return;

    const { filePath, line, column } = preview.metadata;
    const vscodeUrl = `vscode://file/${filePath}${line ? `:${line}` : ""}${
      column ? `:${column}` : ""
    }`;

    window.open(vscodeUrl, "_blank");
  };

  return (
    <div className="devtools-preview-panel">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-container">
            <Search className="search-icon" size={14} />
            <input
              type="text"
              placeholder="Filter components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <button
            className="toolbar-btn"
            onClick={refreshPreviews}
            disabled={isRefreshing}
            title="Refresh components"
          >
            <RefreshCw
              className={`icon ${isRefreshing ? "spin" : ""}`}
              size={14}
            />
          </button>
          <button
            className="toolbar-btn"
            onClick={showMainApp}
            title="Show main app"
          >
            <Eye className="icon" size={14} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-text">
            {filteredPreviews.length} component
            {filteredPreviews.length !== 1 ? "s" : ""} available
          </span>
          {selectedPreview !== null && (
            <>
              <span className="status-separator">•</span>
              <span className="status-text active">
                Previewing: {selectedPreview}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {filteredPreviews.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-icon" size={48} />
            <h3 className="empty-title">
              {searchTerm
                ? "No matching components"
                : "No components registered"}
            </h3>
            <p className="empty-description">
              {searchTerm
                ? `No components match "${searchTerm}"`
                : "Register components using registerPreview() to see them here"}
            </p>
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="component-list">
            {filteredPreviews.map((preview) => (
              <div
                key={preview.name}
                className={`component-item ${
                  selectedPreview === preview.name ? "selected" : ""
                }`}
                onClick={() => onPreviewSelect(preview.name)}
              >
                <div className="component-info">
                  <div className="component-header">
                    <Code className="component-icon" size={16} />
                    <span className="component-name">{preview.name}</span>
                  </div>
                  {preview.metadata && (
                    <div className="component-path">
                      {getPathWithLineAndColumn(preview)}
                    </div>
                  )}
                </div>
                <button className="preview-btn" title="Preview component">
                  <Play size={12} />
                </button>
                <button
                  className="vscode-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToFileInVscode(preview);
                  }}
                >
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
