/**
 * Shared Color Utilities
 * specific for usage in both Node.js (Backend) and Browser (Frontend)
 */

/**
 * Normalize color to hex format
 */
export function normalizeColor(color) {
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
        'purple': '#800080', 'orange': '#ffa500',
        // Common SVG colors
        'aliceblue': '#f0f8ff', 'antiquewhite': '#faebd7', 'aquamarine': '#7fffd4',
        'azure': '#f0ffff', 'beige': '#f5f5dc', 'bisque': '#ffe4c4',
        'blanchedalmond': '#ffebcd', 'blueviolet': '#8a2be2', 'brown': '#a52a2a',
        'burlywood': '#deb887', 'cadetblue': '#5f9ea0', 'chartreuse': '#7fff00',
        'chocolate': '#d2691e', 'coral': '#ff7f50', 'cornflowerblue': '#6495ed',
        'cornsilk': '#fff8dc', 'crimson': '#dc143c', 'darkblue': '#00008b',
        'darkcyan': '#008b8b', 'darkgoldenrod': '#b8860b', 'darkgray': '#a9a9a9',
        'darkgreen': '#006400', 'darkgrey': '#a9a9a9', 'darkkhaki': '#bdb76b',
        'darkmagenta': '#8b008b', 'darkolivegreen': '#556b2f', 'darkorange': '#ff8c00',
        'darkorchid': '#9932cc', 'darkred': '#8b0000', 'darksalmon': '#e9967a',
        'darkseagreen': '#8fbc8f', 'darkslateblue': '#483d8b', 'darkslategray': '#2f4f4f',
        'darkslategrey': '#2f4f4f', 'darkturquoise': '#00ced1', 'darkviolet': '#9400d3',
        'deeppink': '#ff1493', 'deepskyblue': '#00bfff', 'dimgray': '#696969',
        'dimgrey': '#696969', 'dodgerblue': '#1e90ff', 'firebrick': '#b22222',
        'floralwhite': '#fffaf0', 'forestgreen': '#228b22', 'gainsboro': '#dcdcdc',
        'ghostwhite': '#f8f8ff', 'gold': '#ffd700', 'goldenrod': '#daa520',
        'greenyellow': '#adff2f', 'honeydew': '#f0fff0', 'hotpink': '#ff69b4',
        'indianred': '#cd5c5c', 'indigo': '#4b0082', 'ivory': '#fffff0',
        'khaki': '#f0e68c', 'lavender': '#e6e6fa', 'lavenderblush': '#fff0f5',
        'lawngreen': '#7cfc00', 'lemonchiffon': '#fffacd', 'lightblue': '#add8e6',
        'lightcoral': '#f08080', 'lightcyan': '#e0ffff', 'lightgoldenrodyellow': '#fafad2',
        'lightgray': '#d3d3d3', 'lightgreen': '#90ee90', 'lightgrey': '#d3d3d3',
        'lightpink': '#ffb6c1', 'lightsalmon': '#ffa07a', 'lightseagreen': '#20b2aa',
        'lightskyblue': '#87cefa', 'lightslategray': '#778899', 'lightslategrey': '#778899',
        'lightsteelblue': '#b0c4de', 'lightyellow': '#ffffe0', 'limegreen': '#32cd32',
        'linen': '#faf0e6', 'mediumaquamarine': '#66cdaa', 'mediumblue': '#0000cd',
        'mediumorchid': '#ba55d3', 'mediumpurple': '#9370db', 'mediumseagreen': '#3cb371',
        'mediumslateblue': '#7b68ee', 'mediumspringgreen': '#00fa9a', 'mediumturquoise': '#48d1cc',
        'mediumvioletred': '#c71585', 'midnightblue': '#191970', 'mintcream': '#f5fffa',
        'mistyrose': '#ffe4e1', 'moccasin': '#ffe4b5', 'navajowhite': '#ffdead',
        'oldlace': '#fdf5e6', 'olivedrab': '#6b8e23', 'orangered': '#ff4500',
        'orchid': '#da70d6', 'palegoldenrod': '#eee8aa', 'palegreen': '#98fb98',
        'paleturquoise': '#afeeee', 'palevioletred': '#db7093', 'papayawhip': '#ffefd5',
        'peachpuff': '#ffdab9', 'peru': '#cd853f', 'pink': '#ffc0cb',
        'plum': '#dda0dd', 'powderblue': '#b0e0e6', 'rosybrown': '#bc8f8f',
        'royalblue': '#4169e1', 'saddlebrown': '#8b4513', 'salmon': '#fa8072',
        'sandybrown': '#f4a460', 'seagreen': '#2e8b57', 'seashell': '#fff5ee',
        'sienna': '#a0522d', 'skyblue': '#87ceeb', 'slateblue': '#6a5acd',
        'slategray': '#708090', 'slategrey': '#708090', 'snow': '#fffafa',
        'springgreen': '#00ff7f', 'steelblue': '#4682b4', 'tan': '#d2b48c',
        'thistle': '#d8bfd8', 'tomato': '#ff6347', 'turquoise': '#40e0d0',
        'violet': '#ee82ee', 'wheat': '#f5deb3', 'whitesmoke': '#f5f5f5',
        'yellowgreen': '#9acd32'
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
 * Convert hex to RGB
 */
export function hexToRgb(hex) {
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
 * Convert RGB to XYZ color space
 */
export function rgbToXyz(r, g, b) {
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

/**
 * Convert XYZ to LAB color space
 */
export function xyzToLab(x, y, z) {
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

/**
 * Convert Hex to LAB
 */
export function hexToLab(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
    return xyzToLab(xyz.x, xyz.y, xyz.z);
}

/**
 * Calculate CIE76 Delta E
 */
export function deltaE76(lab1, lab2) {
    if (!lab1 || !lab2) return Infinity;
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * V1: Find nearest color using simple RGB Euclidean distance
 */
export function findNearestColorV1(targetColor, palette) {
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
 * V2: Find nearest color using LAB color space (perceptually accurate)
 */
export function findNearestColorV2(targetColor, palette) {
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
export function setOrUpdateStyleProp(styleValue, prop, newColor) {
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
