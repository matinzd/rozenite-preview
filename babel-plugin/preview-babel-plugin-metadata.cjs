const path = require("path");
const crypto = require("crypto");
const { isInsideReactComponent } = require("./react-helper.cjs");

/**
 * Babel plugin that automatically that injects the file path and other metadata
 * to registerPreview() calls imported from "rozenite-preview"
 */
const ROZENITE_PREVIEW_MODULE = "rozenite-preview";
const TARGET_FUNCTION = "registerPreview";
const EXPECTED_ARGS_COUNT = 2;

const cache = {};

function getOrCreateId(file, line) {
  const key = `${file}:${line}`;
  if (cache[key]) return cache[key];

  const hash = crypto.createHash("md5").update(key).digest("hex").slice(0, 6);
  const id = `${path
    .basename(file, path.extname(file))
    .toLowerCase()}_${line}_${hash}`;
  cache[key] = id;
  return id;
}

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program(path, state) {
        const rozenitePreviewImports = collectRozenitePreviewImports(path, t);

        if (rozenitePreviewImports.size === 0) {
          return;
        }

        injectFilePathIntoRegisterPreviewCalls(
          path,
          state,
          rozenitePreviewImports,
          t
        );
      },
    },
  };
};

/**
 * Collects all identifiers imported from "rozenite-preview"
 * @param {Object} programPath - The program AST path
 * @param {Object} t - Babel types helper
 * @returns {Set} Set of imported identifier names
 */
function collectRozenitePreviewImports(programPath, t) {
  const imports = new Set();

  programPath.get("body").forEach((statement) => {
    if (!isRozenitePreviewImportDeclaration(statement)) {
      return;
    }

    statement.node.specifiers.forEach((specifier) => {
      if (isValidImportSpecifier(specifier, t)) {
        imports.add(specifier.local.name);
      }
    });
  });

  return imports;
}

/**
 * Checks if a statement is an import from "rozenite-preview"
 * @param {Object} statement - AST statement node
 * @returns {boolean}
 */
function isRozenitePreviewImportDeclaration(statement) {
  return (
    statement.isImportDeclaration() &&
    statement.node.source.value === ROZENITE_PREVIEW_MODULE
  );
}

/**
 * Checks if a specifier is a valid import specifier (named or default)
 * @param {Object} specifier - Import specifier node
 * @param {Object} t - Babel types helper
 * @returns {boolean}
 */
function isValidImportSpecifier(specifier, t) {
  return (
    t.isImportSpecifier(specifier) || t.isImportDefaultSpecifier(specifier)
  );
}

/**
 * Traverses the AST and injects file paths into registerPreview calls
 * @param {Object} programPath - The program AST path
 * @param {Object} state - Babel plugin state
 * @param {Set} rozenitePreviewImports - Set of imported identifiers from rozenite-preview
 * @param {Object} t - Babel types helper
 */
function injectFilePathIntoRegisterPreviewCalls(
  programPath,
  state,
  rozenitePreviewImports,
  t
) {
  const filename = state.file.opts.filename || "";
  const relativeFilename = path.relative(process.cwd(), filename);

  programPath.traverse({
    CallExpression(callPath) {
      if (isTargetRegisterPreviewCall(callPath, rozenitePreviewImports)) {
        const metadata = getMetadata(callPath);
        const filePath = t.stringLiteral(filename);
        const id = getOrCreateId(relativeFilename, metadata.line);
        const argument = t.objectExpression([
          t.objectProperty(t.identifier("id"), t.stringLiteral(id)),
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
            t.stringLiteral(metadata.name)
          ),
          t.objectProperty(
            t.identifier("nameType"),
            t.stringLiteral(metadata.nameType)
          ),
          t.objectProperty(
            t.identifier("callId"),
            t.stringLiteral(metadata.callId)
          ),
          t.objectProperty(
            t.identifier("componentType"),
            t.stringLiteral(metadata.componentType)
          ),
          t.objectProperty(
            t.identifier("timestamp"),
            t.numericLiteral(metadata.timestamp)
          ),
          t.objectProperty(
            t.identifier("line"),
            t.numericLiteral(metadata.line)
          ),
          t.objectProperty(
            t.identifier("column"),
            t.numericLiteral(metadata.column)
          ),
        ]);
        callPath.node.arguments.push(argument);
      }
    },
  });
}

/**
 * Determines the component type from the second argument
 * @param {Object} componentArg - Component argument AST node
 * @returns {string} Component type description
 */
function getComponentType(componentArg) {
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

/**
 * Extracts detailed information from a registerPreview call
 * @param {Object} callPath - The call expression AST path
 * @returns {Object} Preview details including name, location, and arguments
 */
function getMetadata(callPath) {
  const firstArg = callPath.node.arguments[0];
  const secondArg = callPath.node.arguments[1];
  const loc = callPath.node.loc;

  let name = null;
  let nameType = "unknown";

  if (firstArg && firstArg.type === "StringLiteral") {
    name = firstArg.value;
    nameType = "literal";
  } else if (firstArg && firstArg.type === "Identifier") {
    name = `<dynamic:${firstArg.name}>`;
    nameType = "identifier";
  } else if (firstArg && firstArg.type === "TemplateLiteral") {
    name = `<template:${getTemplateLiteralId(firstArg)}>`;
    nameType = "template";
  }

  // Create a unique identifier for this specific call
  const callId = `${name}:${loc?.start?.line || 0}:${loc?.start?.column || 0}`;

  return {
    name,
    nameType,
    callId,
    line: loc?.start?.line || 0,
    column: loc?.start?.column || 0,
    componentType: getComponentType(secondArg),
    timestamp: Date.now(),
  };
}

/**
 * Determines if a call expression is a registerPreview call that needs modification
 * @param {Object} callPath - The call expression AST path
 * @param {Set} rozenitePreviewImports - Set of imported identifiers from rozenite-preview
 * @returns {boolean}
 */
function isTargetRegisterPreviewCall(callPath, rozenitePreviewImports) {
  const callee = callPath.get("callee");

  return (
    callee.isIdentifier() &&
    callee.node.name === TARGET_FUNCTION &&
    rozenitePreviewImports.has(callee.node.name) &&
    callPath.node.arguments.length === EXPECTED_ARGS_COUNT
  );
}
