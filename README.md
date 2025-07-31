# Rozenite Preview

A Rozenite plugin that lets you select React Native components in DevTools and preview them live on your simulator. Ideal for rapid UI development, component testing, and debugging complex apps.

**Powered by [Rozenite](https://github.com/callstackincubator/rozenite):**  
A comprehensive toolkit for creating, developing, and integrating custom plugins into React Native DevTools.

## Features

- 🔍 Instantly select and debug any registered React Native component from DevTools and view it on device/simulator
- ⚡ Rapid UI prototyping and visual debugging
- 🧩 Simple API for registering components to preview
- 🛠️ Built as a Rozenite plugin for seamless DevTools integration

## Installation

```sh
bun add -D rozenite-preview@alpha
# or
npm install --save-dev rozenite-preview@alpha
# or
yarn add -D rozenite-preview@alpha
```

## Configuration

Add the following to your `babel.config.js` to get more insights and metadata in your previews:

```js
module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: ["rozenite-preview/babel-plugin"]
};
```

## Usage

1. **Register your components for preview:**

```ts
import { registerPreview } from "rozenite-preview@alpha";

registerPreview("MyButton", MyButton);
registerPreview("UserCard", UserCard);
```

2. **Wrap your app with the preview host:**

```tsx
import { PreviewHost } from "rozenite-preview";

export default function App() {
  return <PreviewHost>{/* your app */}</PreviewHost>;
}
```

3. **Open React Native DevTools and use the "Preview" panel**  
   Select and interact with your registered components in real time.

## Known Issues

- **HMR Support**: Hot Module Replacement (HMR) is not fully supported yet. You need to refresh the DevTools to see changes in deleted previews. Adding or modifying previews works for now.

## API

- `registerPreview(name: string, component: React.ComponentType)`
- `PreviewHost` – React component to enable previewing

## Requirements

- React Native 0.79+
- React 19+

## License

MIT
