# Rozenite Preview

<p align="center">
  <a href="#badge">
    <img alt="semantic-release: angular" src="https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release">
  </a>
  <a href="https://www.npmjs.com/package/rozenite-preview">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/rozenite-preview/latest.svg">
  </a>
  <a href="https://www.npmjs.com/package/rozenite-preview">
    <img alt="npm beta version" src="https://img.shields.io/npm/v/rozenite-preview/beta.svg">
  </a>
  <a href="https://www.npmjs.com/package/rozenite-preview">
    <img alt="npm alpha version" src="https://img.shields.io/npm/v/rozenite-preview/alpha.svg">
  </a>
</p>

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

# Demo

https://github.com/user-attachments/assets/dffe5803-fb6a-4b45-9621-48cbbdb25ad2

## API

- `registerPreview(name: string, component: React.ComponentType)`
- `PreviewHost` – React component to enable previewing

## Requirements

- React Native 0.79+
- React 19+

## License

MIT
