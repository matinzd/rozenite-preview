function hasJSXInFunction(functionPath) {
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

function isInsideJSXExpression(path) {
  return (
    path.findParent(
      (parent) =>
        parent.isJSXExpressionContainer() ||
        parent.isJSXElement() ||
        parent.isJSXFragment()
    ) !== null
  );
}

function isInsideReactComponent(path) {
  if (!path.isCallExpression()) return false;

  // Check if inside JSX
  if (isInsideJSXExpression(path)) return true;

  const functionParent = path.getFunctionParent();
  if (!functionParent) return false;

  // React hooks pattern
  if (isInsideReactHook(path)) return true;

  // Class component lifecycle methods
  if (functionParent.isClassMethod()) {
    const methodName = functionParent.node.key?.name;
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
    return reactMethods.includes(methodName);
  }

  // Functional component (function that returns JSX)
  if (functionParent.isFunction()) {
    return isLikelyFunctionalComponent(functionParent);
  }

  return false;
}

function isInsideReactHook(path) {
  return (
    path.findParent((parent) => {
      if (!parent.isCallExpression()) return false;
      const callee = parent.node.callee;
      if (callee.type !== "Identifier") return false;
      return /^use[A-Z]/.test(callee.name);
    }) !== null
  );
}

function isLikelyFunctionalComponent(functionPath) {
  // Check if function name starts with capital letter (component convention)
  const functionName = functionPath.node.id?.name;
  if (functionName && /^[A-Z]/.test(functionName)) {
    return hasJSXInFunction(functionPath);
  }

  // Check if assigned to a variable with capital letter
  if (
    functionPath.isArrowFunctionExpression() ||
    functionPath.isFunctionExpression()
  ) {
    const parent = functionPath.parent;
    if (
      parent.type === "VariableDeclarator" &&
      parent.id.name &&
      /^[A-Z]/.test(parent.id.name)
    ) {
      return hasJSXInFunction(functionPath);
    }
  }

  return false;
}

module.exports = {
  isInsideReactComponent,
};
