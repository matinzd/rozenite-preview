const path = require("path");

const { isInsideReactComponent } = require("./react-helper.cjs");

/**
 * Babel plugin that automatically injects file path, relative filename,
 * React component context, name, call site location, and other metadata
 * into registerPreview() calls imported from "rozenite-preview".
 * Also injects the Metro "module" object as the first argument.
 */
const ROZENITE_PREVIEW_MODULE = "rozenite-preview";
const TARGET_FUNCTION = "registerPreview";
const EXPECTED_ARGS_COUNT = 2;

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program(path, state) {
        const rozenitePreviewImports = collectRozenitePreviewImports(path, t);

        if (rozenitePreviewImports.size === 0) {
          return;
        }

        path.traverse({
          CallExpression(callPath) {
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
 * Traverses the AST and injects metadata into registerPreview calls
 * @param {Object} callPath - The call expression AST path
 * @param {Object} state - Babel plugin state
 * @param {Object} t - Babel types helper
 */
function injectMetadataIntoRegisterPreviewCalls(callPath, state, t) {
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
    t.objectProperty(t.identifier("name"), t.stringLiteral(metadata.name)),
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

/**
 * Injects the Metro module into all registerPreview calls as the first argument.
 * @param callPath - The call expression AST path
 * @param t
 */
function injectMetroModuleIntoRegisterPreviewCalls(callPath, t) {
  const { node } = callPath;
  node.arguments.unshift(t.identifier("module"));
}
