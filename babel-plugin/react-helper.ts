import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function isInsideReactComponent(
  path: NodePath<t.CallExpression>
): boolean {
  // inside JSX
  if (
    path.findParent(
      (p) =>
        p.isJSXElement() || p.isJSXFragment() || p.isJSXExpressionContainer()
    )
  ) {
    return true;
  }

  // hook
  if (
    path.findParent((p) => {
      if (!p.isCallExpression()) return false;
      const callee = p.node.callee;
      return t.isIdentifier(callee) && /^use[A-Z]/.test(callee.name);
    })
  ) {
    return true;
  }

  // class components
  if (
    path.findParent((p) => {
      if (!p.isClassMethod()) return false;
      return isReactClassComponent(p as NodePath<t.ClassMethod>);
    })
  ) {
    return true;
  }

  // if inside a function that returns JSX
  const functionParent = path.getFunctionParent();
  if (functionParent && hasJSXReturn(functionParent)) {
    return true;
  }

  return false;
}

function isReactClassComponent(methodPath: NodePath<t.ClassMethod>): boolean {
  const classPath = methodPath.findParent((p) => p.isClassDeclaration());
  if (!classPath || !classPath.isClassDeclaration()) return false;

  const superClass = classPath.node.superClass;
  if (!superClass) return false;

  if (t.isIdentifier(superClass)) {
    return ["Component", "PureComponent"].includes(superClass.name);
  }

  if (
    t.isMemberExpression(superClass) &&
    t.isIdentifier(superClass.object) &&
    t.isIdentifier(superClass.property)
  ) {
    return (
      superClass.object.name === "React" &&
      ["Component", "PureComponent"].includes(superClass.property.name)
    );
  }

  return false;
}

function hasJSXReturn(functionPath: NodePath<t.Function>): boolean {
  let hasJSX = false;

  functionPath.traverse({
    ReturnStatement(returnPath) {
      const argument = returnPath.node.argument;
      if (argument && (t.isJSXElement(argument) || t.isJSXFragment(argument))) {
        hasJSX = true;
        returnPath.stop();
      }
    },
    JSXElement() {
      hasJSX = true;
    },
    JSXFragment() {
      hasJSX = true;
    },
  });

  return hasJSX;
}
