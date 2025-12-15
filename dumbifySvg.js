import { optimize } from "svgo";

/**
 * Convert a "complex" SVG into a simpler, more editor-friendly SVG.
 *
 * What it does well:
 * - Inline CSS styles into attributes (so no class/defs dependency)
 * - Expand <use> references
 * - Simplify paths / flatten transforms (within SVGO limits)
 * - Remove unused defs and cleanup IDs
 *
 * Optional "dumbing down" (lossy):
 * - Replace gradients/patterns with solid fills (first stop)
 * - Drop filters/masks/blend-modes (or keep, depending on editor support)
 *
 * @param {string} svgString
 * @param {object} opts
 * @param {boolean} [opts.replacePaintServers=true]  // turn url(#...) fills/strokes into solid colors
 * @param {string}  [opts.defaultPaint="#000000"]    // fallback if we can't resolve a color
 * @param {boolean} [opts.keepViewBox=true]
 * @returns {string}
 */
export function dumbifySvg(svgString, opts = {}) {
  const {
    replacePaintServers = true,
    defaultPaint = "#000000",
    keepViewBox = true,
  } = opts;

  // SVGO plugin: replace fill/stroke="url(#something)" with a solid color.
  // This is intentionally lossy but makes the result editable in more tools.
  const replaceUrlPaintPlugin = {
    name: "replaceUrlPaint",
    type: "visitor",
    fn: () => {
      // Build a quick lookup for gradients/patterns by id -> a representative color.
      // We'll pick the first <stop stop-color="..."> we find.
      const paintById = new Map();

      function pickFirstStopColor(node) {
        if (!node.children) return null;
        for (const ch of node.children) {
          if (ch.type === "element" && ch.name === "stop") {
            const c = ch.attributes && ch.attributes["stop-color"];
            if (c) return c;
            // Sometimes it's inside style="stop-color:..."
            const style = ch.attributes && ch.attributes.style;
            if (style) {
              const m = style.match(/stop-color\s*:\s*([^;]+)/i);
              if (m) return m[1].trim();
            }
          }
          const nested = pickFirstStopColor(ch);
          if (nested) return nested;
        }
        return null;
      }

      function indexPaintServers(node) {
        if (node.type === "element") {
          const id = node.attributes && node.attributes.id;
          if (id && (node.name === "linearGradient" || node.name === "radialGradient" || node.name === "pattern")) {
            const c = pickFirstStopColor(node);
            if (c) paintById.set(id, c);
          }
        }
        if (node.children) node.children.forEach(indexPaintServers);
      }

      return {
        root: {
          enter(root) {
            // Index defs first
            indexPaintServers(root);

            // Replace url(#id) usage in fill/stroke
            const replaceOnNode = (node) => {
              if (node.type !== "element" || !node.attributes) return;

              for (const attrName of ["fill", "stroke"]) {
                const v = node.attributes[attrName];
                if (!v) continue;
                const m = v.match(/^url\(#([^)]+)\)$/);
                if (!m) continue;

                const id = m[1];
                const rep = paintById.get(id) || defaultPaint;
                node.attributes[attrName] = rep;
              }

              // Also nuke paint in style="fill:url(#...)"
              if (node.attributes.style) {
                node.attributes.style = node.attributes.style.replace(
                  /(\bfill|\bstroke)\s*:\s*url\(#([^)]+)\)\s*;?/gi,
                  (full, prop, id) => `${prop}:${paintById.get(id) || defaultPaint};`
                );
              }
            };

            const walk = (node) => {
              replaceOnNode(node);
              if (node.children) node.children.forEach(walk);
            };
            walk(root);
          },
        },
      };
    },
  };

  // This SVGO config is tuned for “editor friendliness” rather than max compression.
  const result = optimize(svgString, {
    multipass: true,
    plugins: [
      // Keep viewBox (many tools need it)
      { name: "preset-default", params: { overrides: { removeViewBox: !keepViewBox } } },

      // Make styles editable
      { name: "inlineStyles", params: { onlyMatchedOnce: false } },
      "convertStyleToAttrs",

      // Make references concrete
      "reusePaths",   // helps sometimes, but combined with inline styles still OK
      "removeUselessDefs",
      "cleanupIds",

      // Shape simplification / transform flattening
      "convertTransform",
      "convertPathData",
      "mergePaths",

      // Optional lossy paint-server replacement
      ...(replacePaintServers ? [replaceUrlPaintPlugin] : []),

      // These can *improve* editability in some editors by reducing weird group behavior
      // but can also change visuals; toggle if needed:
      // "removeUnknownsAndDefaults",
      // "removeHiddenElems",
    ],
  });

  return result.data;
}
