import { optimize } from "svgo";

/**
 * Simplify SVG by removing unnecessary elements and flattening transforms
 * @param {string} svgString - The SVG content as a string
 * @param {Object} [options] - Options for simplification
 * @param {boolean} [options.replaceGradients=true] - Replace gradients with solid colors
 * @param {string} [options.defaultColor="#000000"] - Default color to use when replacing gradients
 * @param {boolean} [options.keepViewBox=true] - Whether to keep the viewBox attribute
 * @returns {string} - The simplified SVG as a string
 */
export function simplifySvg(svgString, options = {}) {
    const {
        replaceGradients = true,
        defaultColor = "#000000",
        keepViewBox = true,
    } = options;

    // SVGO plugin: replace fill/stroke="url(#something)" with a solid color.
    const replaceUrlPaintPlugin = {
        name: "replaceUrlPaint",
        type: "visitor",
        fn: () => {
            const paintById = new Map();

            function pickFirstStopColor(node) {
                if (!node.children) return null;
                for (const ch of node.children) {
                    if (ch.type === "element" && ch.name === "stop") {
                        const c = ch.attributes && ch.attributes["stop-color"];
                        if (c) return c;
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
                                const rep = paintById.get(id) || defaultColor;
                                node.attributes[attrName] = rep;
                            }

                            // Also replace paint in style="fill:url(#...)"
                            if (node.attributes.style) {
                                node.attributes.style = node.attributes.style.replace(
                                    /(\bfill|\bstroke)\s*:\s*url\(#([^)]+)\)\s*;?/gi,
                                    (full, prop, id) => `${prop}:${paintById.get(id) || defaultColor};`
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

    // This SVGO config is tuned for "editor friendliness" rather than max compression.
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
            ...(replaceGradients ? [replaceUrlPaintPlugin] : []),
        ],
    });

    return result.data;
}
