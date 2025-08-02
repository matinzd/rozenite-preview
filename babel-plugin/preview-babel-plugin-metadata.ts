import { NodePath, PluginObj, types as t } from "@babel/core";
import path from "path";
import { isInsideReactComponent } from "./react-helper";

/**
 * Babel plugin that automatically injects file path, relative filename,
 * React component context, name, call site location, and other metadata
 * into registerPreview() calls imported from "rozenite-preview".
 * Also injects the Metro "module" object as the first argument.
 */
const ROZENITE_PREVIEW_MODULE = "rozenite-preview";
const TARGET_FUNCTION = "registerPreview";
const EXPECTED_ARGS_COUNT = 2;

type BabelTypes = typeof import("@babel/types");

export default function previewBabelPlugin(): PluginObj {
  return {
    visitor: {
      Program(path: NodePath<t.Program>, state: any) {
        const rozenitePreviewImports = collectRozenitePreviewImports(path, t);

        if (rozenitePreviewImports.size === 0) {
          return;
        }

        path.traverse({
          CallExpression(callPath: NodePath<t.CallExpression>) {
            if (
              !isTargetRegisterPreviewCall(callPath, rozenitePreviewImports)
            ) {
              return;
            }
            injectMetadataIntoRegisterPreviewCalls(callPath, state, t);
            injectMetroModuleIntoRegisterPreviewCalls(callPath, t);
          },
        });
      },
    },
  };
}

function collectRozenitePreviewImports(
  programPath: NodePath<t.Program>,
  t: BabelTypes
) {
  const imports = new Set<string>();
  programPath.get("body").forEach((statement) => {
    if (!isRozenitePreviewImportDeclaration(statement)) {
      return;
    }
    // Only ImportDeclaration nodes have specifiers
    if (statement.isImportDeclaration()) {
      statement.node.specifiers.forEach((specifier: any) => {
        if (isValidImportSpecifier(specifier, t)) {
          imports.add(specifier.local.name);
        }
      });
    }
  });
  return imports;
}

function isRozenitePreviewImportDeclaration(statement: NodePath<any>) {
  return (
    statement.isImportDeclaration() &&
    statement.node.source.value === ROZENITE_PREVIEW_MODULE
  );
}

function isValidImportSpecifier(specifier: any, t: BabelTypes) {
  return (
    t.isImportSpecifier(specifier) || t.isImportDefaultSpecifier(specifier)
  );
}

function injectMetadataIntoRegisterPreviewCalls(
  callPath: NodePath<t.CallExpression>,
  state: any,
  t: BabelTypes
) {
  const filename = state.file.opts.filename || "";
  const relativeFilename = path.relative(process.cwd(), filename);
  const metadata = getMetadata(callPath);
  const filePath = t.stringLiteral(filename);
  const argument = t.objectExpression([
    t.objectProperty(t.identifier("filePath"), filePath),
    t.objectProperty(
      t.identifier("relativeFilename"),
      t.stringLiteral(relativeFilename)
    ),
    t.objectProperty(
      t.identifier("isInsideReactComponent"),
      t.booleanLiteral(isInsideReactComponent(callPath))
    ),
    t.objectProperty(
      t.identifier("name"),
      t.stringLiteral(metadata.name ?? "")
    ),
    t.objectProperty(
      t.identifier("nameType"),
      t.stringLiteral(metadata.nameType)
    ),
    t.objectProperty(t.identifier("callId"), t.stringLiteral(metadata.callId)),
    t.objectProperty(
      t.identifier("componentType"),
      t.stringLiteral(metadata.componentType)
    ),
    t.objectProperty(t.identifier("line"), t.numericLiteral(metadata.line)),
    t.objectProperty(t.identifier("column"), t.numericLiteral(metadata.column)),
  ]);
  callPath.node.arguments.push(argument);
}

function getComponentType(componentArg: any): string {
  if (!componentArg) return "unknown";
  switch (componentArg.type) {
    case "Identifier":
      return `component:${componentArg.name}`;
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return "inline-function";
    case "CallExpression":
      return "call-expression";
    default:
      return componentArg.type.toLowerCase();
  }
}

function getMetadata(callPath: NodePath<t.CallExpression>) {
  const firstArg = callPath.node.arguments[0];
  const secondArg = callPath.node.arguments[1];
  const loc = callPath.node.loc;
  let name: string | null = null;
  let nameType = "unknown";
  if (firstArg && firstArg.type === "StringLiteral") {
    name = firstArg.value;
    nameType = "literal";
  } else if (firstArg && firstArg.type === "Identifier") {
    name = `<dynamic:${firstArg.name}>`;
    nameType = "identifier";
  }
  const callId = `${name}:${loc?.start?.line || 0}:${loc?.start?.column || 0}`;
  return {
    name,
    nameType,
    callId,
    line: loc?.start?.line || 0,
    column: loc?.start?.column || 0,
    componentType: getComponentType(secondArg),
  };
}

function isTargetRegisterPreviewCall(
  callPath: NodePath<t.CallExpression>,
  rozenitePreviewImports: Set<string>
) {
  const callee = callPath.get("callee");
  return (
    callee.isIdentifier() &&
    callee.node.name === TARGET_FUNCTION &&
    rozenitePreviewImports.has(callee.node.name) &&
    callPath.node.arguments.length === EXPECTED_ARGS_COUNT
  );
}

function injectMetroModuleIntoRegisterPreviewCalls(
  callPath: NodePath<t.CallExpression>,
  t: BabelTypes
) {
  const { node } = callPath;
  node.arguments.unshift(t.identifier("module"));
}
