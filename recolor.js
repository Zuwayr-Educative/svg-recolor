import { DOMParser, XMLSerializer } from 'xmldom';

/**
 * Normalize color to hex format
 */
function normalizeColor(color) {
    if (!color || typeof color !== 'string') return null;

    const trimmedColor = color.trim();
    if (!trimmedColor || trimmedColor === 'none' || trimmedColor === 'transparent') return null;

    // If already hex, validate and return
    if (trimmedColor.startsWith('#')) {
        if (trimmedColor.length === 7) {
            return trimmedColor.toLowerCase();
        }
        // Handle shorthand hex
        if (trimmedColor.length === 4) {
            const r = trimmedColor[1];
            const g = trimmedColor[2];
            const b = trimmedColor[3];
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
    }

    // Handle named colors
    const namedColors = {
        'black': '#000000', 'white': '#ffffff', 'red': '#ff0000',
        'green': '#008000', 'blue': '#0000ff', 'yellow': '#ffff00',
        'cyan': '#00ffff', 'magenta': '#ff00ff', 'gray': '#808080',
        'grey': '#808080', 'silver': '#c0c0c0', 'maroon': '#800000',
        'olive': '#808000', 'lime': '#00ff00', 'aqua': '#00ffff',
        'teal': '#008080', 'navy': '#000080', 'fuchsia': '#ff00ff',
        'purple': '#800080', 'orange': '#ffa500'
    };

    if (namedColors[trimmedColor.toLowerCase()]) {
        return namedColors[trimmedColor.toLowerCase()];
    }

    // Handle rgb/rgba format
    const rgbMatch = trimmedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    return trimmedColor.toLowerCase();
}

/**
 * Gather all colors from SVG document
 */
function gatherColors(svgDoc) {
    const colors = new Set();
    const elements = svgDoc.getElementsByTagName('*');

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // Check fill, stroke, and stop-color attributes
        for (const attr of ['fill', 'stroke', 'stop-color']) {
            const value = el.getAttribute(attr);
            const normalized = normalizeColor(value);
            if (normalized) {
                colors.add(normalized);
            }
        }

        // Check style attribute
        const style = el.getAttribute('style');
        if (style) {
            const fillMatch = style.match(/fill\s*:\s*([^;]+)/);
            const strokeMatch = style.match(/stroke\s*:\s*([^;]+)/);
            const stopColorMatch = style.match(/stop-color\s*:\s*([^;]+)/);

            if (fillMatch) {
                const normalized = normalizeColor(fillMatch[1].trim());
                if (normalized) colors.add(normalized);
            }
            if (strokeMatch) {
                const normalized = normalizeColor(strokeMatch[1].trim());
                if (normalized) colors.add(normalized);
            }
            if (stopColorMatch) {
                const normalized = normalizeColor(stopColorMatch[1].trim());
                if (normalized) colors.add(normalized);
            }
        }
    }

    return Array.from(colors).sort();
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
        return null;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
}

/**
 * V1: Find nearest color using simple RGB Euclidean distance
 */
function findNearestColorV1(targetColor, palette) {
    if (palette.length === 0) return targetColor;

    const target = hexToRgb(targetColor);
    if (!target) return targetColor;

    let nearest = palette[0];
    let minDistance = Infinity;

    palette.forEach(paletteColor => {
        const paletteRgb = hexToRgb(paletteColor);
        if (!paletteRgb) return;

        const distance = Math.sqrt(
            Math.pow(target.r - paletteRgb.r, 2) +
            Math.pow(target.g - paletteRgb.g, 2) +
            Math.pow(target.b - paletteRgb.b, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearest = paletteColor;
        }
    });

    return nearest;
}

/**
 * V2: Advanced LAB color space functions
 */
function rgbToXyz(r, g, b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    r *= 100;
    g *= 100;
    b *= 100;

    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    return { x, y, z };
}

function xyzToLab(x, y, z) {
    const xn = 95.047;
    const yn = 100.000;
    const zn = 108.883;

    x = x / xn;
    y = y / yn;
    z = z / zn;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);

    return { l, a, b };
}

function hexToLab(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
    return xyzToLab(xyz.x, xyz.y, xyz.z);
}

function deltaE76(lab1, lab2) {
    if (!lab1 || !lab2) return Infinity;
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * V2: Find nearest color using LAB color space (perceptually accurate)
 */
function findNearestColorV2(targetColor, palette) {
    const fromLab = hexToLab(targetColor);
    if (!fromLab) return { color: targetColor, distance: 0 };

    let best = null;
    for (const paletteColor of palette) {
        const pLab = hexToLab(paletteColor);
        if (!pLab) continue;
        const d = deltaE76(fromLab, pLab);
        if (!best || d < best.distance) {
            best = { color: paletteColor, distance: d };
        }
    }

    return best || { color: targetColor, distance: 0 };
}

/**
 * Update style property in style string
 */
function setOrUpdateStyleProp(styleValue, prop, newColor) {
    const decls = styleValue
        ? styleValue.split(';').map(s => s.trim()).filter(Boolean)
        : [];
    let replaced = false;
    const out = decls.map(d => {
        const m = d.match(/^([a-z-]+)\s*:\s*(.+)$/i);
        if (!m) return d;
        if (m[1].toLowerCase() === prop.toLowerCase()) {
            replaced = true;
            return `${prop}:${newColor}`;
        }
        return d;
    });
    if (!replaced) out.push(`${prop}:${newColor}`);
    return out.join('; ');
}

/**
 * Recolor SVG using V1 algorithm (simple RGB distance)
 */
export function recolorV1(svgString, palette) {
    if (!palette || palette.length === 0) {
        throw new Error('Palette is empty');
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    // Gather all colors from the SVG
    const detectedColors = gatherColors(svgDoc);

    // Create color mapping
    const colorMap = new Map();
    detectedColors.forEach(originalColor => {
        const nearestColor = findNearestColorV1(originalColor, palette);
        colorMap.set(originalColor.toLowerCase(), nearestColor);
    });

    // Update all elements
    const elements = svgDoc.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // Handle fill, stroke, and stop-color attributes
        for (const attr of ['fill', 'stroke', 'stop-color']) {
            const value = el.getAttribute(attr);
            if (value && value !== 'none' && value !== 'transparent') {
                const normalized = normalizeColor(value);
                const newColor = normalized ? colorMap.get(normalized.toLowerCase()) : null;
                if (newColor) {
                    el.setAttribute(attr, newColor);
                }
            }
        }

        // Handle style attribute
        const style = el.getAttribute('style');
        if (style) {
            let newStyle = style;

            for (const prop of ['fill', 'stroke', 'stop-color']) {
                const regex = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'gi');
                let match;
                while ((match = regex.exec(style)) !== null) {
                    const value = match[1].trim();
                    if (value !== 'none' && value !== 'transparent') {
                        const normalized = normalizeColor(value);
                        const newColor = normalized ? colorMap.get(normalized.toLowerCase()) : null;
                        if (newColor) {
                            newStyle = setOrUpdateStyleProp(newStyle, prop, newColor);
                        }
                    }
                }
            }

            if (newStyle !== style) {
                el.setAttribute('style', newStyle);
            }
        }
    }

    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(svgDoc);

    return {
        svg: result,
        mapping: Object.fromEntries(colorMap),
        detectedColors
    };
}

/**
 * Recolor SVG using V2 algorithm (LAB color space)
 */
export function recolorV2(svgString, palette) {
    if (!palette || palette.length === 0) {
        throw new Error('Palette is empty');
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    // Gather all colors from the SVG
    const detectedColors = gatherColors(svgDoc);

    // Create color mapping with distances
    const colorMap = new Map();
    const distances = new Map();

    detectedColors.forEach(originalColor => {
        const result = findNearestColorV2(originalColor, palette);
        colorMap.set(originalColor.toLowerCase(), result.color);
        distances.set(originalColor.toLowerCase(), result.distance);
    });

    // Update all elements
    const elements = svgDoc.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // Handle fill, stroke, and stop-color attributes
        for (const attr of ['fill', 'stroke', 'stop-color']) {
            const value = el.getAttribute(attr);
            if (value && value !== 'none' && value !== 'transparent') {
                const normalized = normalizeColor(value);
                const newColor = normalized ? colorMap.get(normalized.toLowerCase()) : null;
                if (newColor) {
                    el.setAttribute(attr, newColor);
                }
            }
        }

        // Handle style attribute
        const style = el.getAttribute('style');
        if (style) {
            let newStyle = style;

            for (const prop of ['fill', 'stroke', 'stop-color']) {
                const regex = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'gi');
                let match;
                while ((match = regex.exec(style)) !== null) {
                    const value = match[1].trim();
                    if (value !== 'none' && value !== 'transparent') {
                        const normalized = normalizeColor(value);
                        const newColor = normalized ? colorMap.get(normalized.toLowerCase()) : null;
                        if (newColor) {
                            newStyle = setOrUpdateStyleProp(newStyle, prop, newColor);
                        }
                    }
                }
            }

            if (newStyle !== style) {
                el.setAttribute('style', newStyle);
            }
        }
    }

    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(svgDoc);

    return {
        svg: result,
        mapping: Object.fromEntries(colorMap),
        distances: Object.fromEntries(distances),
        detectedColors
    };
}
