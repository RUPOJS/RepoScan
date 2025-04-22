/* ==================================================================================
   Simple static heuristics for the most frequent JS / TS code‑smells (2025 edition)
   ----------------------------------------------------------------------------------
   ⚠️  This is **not** a replacement for a real linter / AST‑based tool; it’s quick,
      dependency‑free and works in any runtime where RegExp is good enough.
=================================================================================== */
export function analyzeCodeChunk(code: string) {
  const complexity = approximateCyclomaticComplexity(code);
  const antiPatterns: string[] = [];

  /* ----------  1. Language‑level dangers  -------------------- */
  if (/\bvar\s+/.test(code))
    antiPatterns.push("Use of var (prefer let / const)");
  if (/\bwith\s*\(/.test(code))
    antiPatterns.push("with statement (creates scope confusion)");
  if (/\beval\s*\(/.test(code)) antiPatterns.push("eval usage");
  if (/\bnew Function\s*\(/.test(code))
    antiPatterns.push("new Function constructor");

  /* ----------  2. Logic & safety smells  -------------------- */
  if (/==[^=]/.test(code) || /[^!]==[^=]/.test(code))
    antiPatterns.push("Loose equality (== / !=) – prefer strict");
  if (/!\s*==/.test(code))
    antiPatterns.push("Negated equality (use !== instead)");
  if (/\bPromise\.then\s*\([^)]*\)\s*(?!\.catch|\.finally)/s.test(code))
    antiPatterns.push("Promise without .catch() / .finally()");
  if (
    /async\s+function[^\{]+\{[^]*?\breturn\b[^]*?}\s*$/.test(code) &&
    !/\bawait\b/.test(code)
  )
    antiPatterns.push("async function without await");
  if (/\bcatch\s*\(\w*\)\s*\{\s*\}/s.test(code))
    antiPatterns.push("Empty catch block");

  /* ----------  3. Readability & maintainability  ------------- */
  if (/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(code))
    antiPatterns.push("console.* left in production code");
  if (/\/\/\s*TODO\b|\/\*\s*TODO\b/.test(code))
    antiPatterns.push("TODO/FIXME left in code");
  if (/\bfunction\b[^{]+\([^)]{41,}\)/.test(code))
    antiPatterns.push("Function has > 6 parameters");
  if (/(if|for|while|switch)[^{]*\{\s*\}/.test(code))
    antiPatterns.push("Empty control structure");
  if (/if\s*\([^\)]*\)\s*;/.test(code)) antiPatterns.push("Empty if statement");
  if (/for\s*\(\s*var\s+\w+\s+in\s+\w+\s*\)/.test(code))
    antiPatterns.push("for‑in loop over array (use for‑of)");
  if (/\b(?:0x[0-9a-fA-F]+|\d{3,})\b/.test(code))
    antiPatterns.push("Magic number literal");
  if (deeplyNested(code)) antiPatterns.push("Nested blocks > 3 levels deep");
  if (longFunction(code)) antiPatterns.push("Function longer than 100 LOC");
  if (/\bany\b/.test(code)) antiPatterns.push("TypeScript “any” type");
  if (/\b!\./.test(code))
    antiPatterns.push("Non‑null assertion operator (!) – brittle");
  if (/as\s+any\b/.test(code)) antiPatterns.push("Type assertion to any");
  if (/\bexport\s+default\s+function\s*\*/.test(code))
    antiPatterns.push("Default‑exporting generator function (rarely desired)");

  return { complexity, antiPatterns };
}

/* ----------------------------------------------------------------
   Heuristic helpers
---------------------------------------------------------------- */
function approximateCyclomaticComplexity(code: string) {
  const matches = code.match(/\b(if|for|while|case|catch|&&|\|\|)\b/g);
  return matches ? matches.length + 1 : 1;
}

function deeplyNested(code: string, maxDepth = 3) {
  let depth = 0,
    max = 0;
  for (const ch of code) {
    if (ch === "{") max = Math.max(max, ++depth);
    else if (ch === "}") depth--;
  }
  return max > maxDepth;
}

function longFunction(code: string, limit = 100) {
  return code.split(/\n/).length > limit;
}
