import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = fileURLToPath(new URL("./", import.meta.url));

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const basePath = path.join(projectRoot, specifier.slice(2));
    for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
      const candidate = `${basePath}${ext}`;
      try {
        await access(candidate);
        return defaultResolve(pathToFileURL(candidate).href, context, defaultResolve);
      } catch {
        // continue
      }
    }
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
      const candidate = path.resolve(parentDir, `${specifier}${ext}`);
      try {
        await access(candidate);
        return defaultResolve(pathToFileURL(candidate).href, context, defaultResolve);
      } catch {
        // continue
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const source = await readFile(new URL(url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        strict: false,
        skipLibCheck: true,
        baseUrl: projectRoot,
        paths: { "@/*": ["*"] },
      },
      fileName: fileURLToPath(url),
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }

  return defaultLoad(url, context, defaultLoad);
}
