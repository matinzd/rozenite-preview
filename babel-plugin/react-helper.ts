import { NodePath } from "@babel/core";

export function hasJSXInFunction(functionPath: NodePath<any>): boolean {
  let hasJSX = false;
  functionPath.traverse({
    JSXElement() {
      hasJSX = true;
    },
    JSXFragment() {
      hasJSX = true;
    },
  });
  return hasJSX;
}

export function isInsideJSXExpression(path: NodePath<any>): boolean {
  return (
    path.findParent(
      (parent) =>
        parent.isJSXExpressionContainer() ||
        parent.isJSXElement() ||
        parent.isJSXFragment()
    ) !== null
  );
}

export function isInsideReactComponent(path: NodePath<any>): boolean {
  if (!path.isCallExpression()) return false;
  if (isInsideJSXExpression(path)) return true;
  const functionParent = path.getFunctionParent();
  if (!functionParent) return false;
  if (isInsideReactHook(path)) return true;
  if (functionParent.isClassMethod()) {
    let methodName: string | undefined;
    const key = functionParent.node.key;
    if (key && typeof key === "object" && "name" in key && typeof key.name === "string") {
      methodName = key.name;
    }
    const reactMethods = [
      "render",
      "componentDidMount",
      "componentDidUpdate",
      "componentWillUnmount",
      "getSnapshotBeforeUpdate",
      "componentDidCatch",
      "getDerivedStateFromError",
      "shouldComponentUpdate",
      "getInitialState",
    ];
    return methodName ? reactMethods.includes(methodName) : false;
  }
  if (functionParent.isFunction()) {
    return isLikelyFunctionalComponent(functionParent);
  }
  return false;
}

export function isInsideReactHook(path: NodePath<any>): boolean {
  return (
    path.findParent((parent) => {
      if (!parent.isCallExpression()) return false;
      const callee = parent.node.callee;
      if (callee.type !== "Identifier") return false;
      return /^use[A-Z]/.test(callee.name);
    }) !== null
  );
}

export function isLikelyFunctionalComponent(functionPath: NodePath<any>): boolean {
  const functionName = functionPath.node.id?.name;
  if (functionName && /^[A-Z]/.test(functionName)) {
    return hasJSXInFunction(functionPath);
  }
  if (
    functionPath.isArrowFunctionExpression() ||
    functionPath.isFunctionExpression()
  ) {
    const parent = functionPath.parent;
    if (
      parent.type === "VariableDeclarator" &&
      parent.id &&
      parent.id.type === "Identifier" &&
      typeof parent.id.name === "string" &&
      /^[A-Z]/.test(parent.id.name)
    ) {
      return hasJSXInFunction(functionPath);
    }
  }
  return false;
}
