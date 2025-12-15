import { DOMParser, XMLSerializer } from 'xmldom';
import { dumbifySvg } from './dumbifySvg.js';
import {
    normalizeColor,
    findNearestColorV1,
    findNearestColorV2,
    setOrUpdateStyleProp
} from './color-utils.js';

/**
 * Process viewbox fill and class removal from SVG document
 * @param {Document} svgDoc - The SVG document to process
 * @param {boolean} removeFill - Whether to remove the fill and classes
 * @returns {Document} - The processed SVG document
 */
export function processViewBoxFill(svgDoc, removeFill = true) {
    if (!removeFill) return svgDoc;

    const svg = svgDoc.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return svgDoc;

    // Remove fill attribute if it exists and isn't 'none'
    if (svg.hasAttribute('fill') && svg.getAttribute('fill') !== 'none') {
        svg.removeAttribute('fill');
    }

    // Remove class attribute if it exists
    if (svg.hasAttribute('class')) {
        svg.removeAttribute('class');
    }

    // Process style attribute if it exists
    if (svg.hasAttribute('style')) {
        let style = svg.getAttribute('style');

        // Remove fill, fill-rule, and class-related properties from style
        style = style
            .replace(/fill:\s*[^;]+;?/g, '')
            .replace(/fill-rule:\s*[^;]+;?/g, '')
            .replace(/\.?[a-z0-9_-]+\s*{[^}]*}/g, '')  // Remove any class-like definitions
            .replace(/;+/g, ';')
            .replace(/^;|;$/g, '')
            .trim();

        if (style) {
            svg.setAttribute('style', style);
        } else {
            svg.removeAttribute('style');
        }
    }

    return svgDoc;
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
 * Recolor SVG using V1 algorithm (simple RGB distance)
 * @param {string} svgString - The SVG content as a string
 * @param {string[]} palette - Array of hex color codes
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.removeViewBoxFill=true] - Whether to remove fill from the root SVG element
 * @returns {Object} - Object containing the recolored SVG and metadata
 */
export function recolorV1(svgString, palette, {
    removeViewBoxFill = true,
    simplify = false,
    simplifyOptions = {}
} = {}) {
    if (!palette || palette.length === 0) {
        throw new Error('Palette is empty');
    }

    // Simplify SVG if enabled
    const processedSvgString = simplify
        ? dumbifySvg(svgString, {
            replacePaintServers: true,
            defaultPaint: '#000000',
            keepViewBox: true,
            ...simplifyOptions
        })
        : svgString;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(processedSvgString, 'image/svg+xml');

    // Process viewbox fill if needed
    if (removeViewBoxFill) {
        processViewBoxFill(svgDoc, true);
    }

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
 * @param {string} svgString - The SVG content as a string
 * @param {string[]} palette - Array of hex color codes
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.removeViewBoxFill=true] - Whether to remove fill from the root SVG element
 * @returns {Object} - Object containing the recolored SVG and metadata
 */
export function recolorV2(svgString, palette, {
    removeViewBoxFill = true,
    simplify = false,
    simplifyOptions = {}
} = {}) {
    if (!palette || palette.length === 0) {
        throw new Error('Palette is empty');
    }

    // Simplify SVG if enabled
    const processedSvgString = simplify
        ? dumbifySvg(svgString, {
            replacePaintServers: true,
            defaultPaint: '#000000',
            keepViewBox: true,
            ...simplifyOptions
        })
        : svgString;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(processedSvgString, 'image/svg+xml');

    // Process viewbox fill if needed
    if (removeViewBoxFill) {
        processViewBoxFill(svgDoc, true);
    }

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
