/**
 * RECOLOR SVG - MASTER TEST SUITE
 * Consolidates all verification scripts into a single runfile.
 * Usage: node run_test_suite.js
 */
import { findNearestColorV3, hexToLab } from './color-utils.js';
import { recolorV1 } from './recolor.js';
import { readFileSync, existsSync } from 'fs';

console.log('==========================================');
console.log('       RECOLOR SVG - TEST SUITE           ');
console.log('==========================================\n');

let failures = 0;
let successes = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        successes++;
    } else {
        console.error(`[FAIL] ${message}`);
        failures++;
    }
}

// ==========================================
// TEST SCENARIO A: Comprehensive V3 Logic
// Covers: Pastels, Grayscale thresholds, Hue Priority, Brightness Penalties
// Source: verify_comprehensive.js + verify_v3_strict.js + verify_blues.js + verify_d2.js
// ==========================================
function testV3Logic() {
    console.log('--- Scenario A: V3 Color Logic (Hue Priority) ---');

    const basicPalette = [
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#FFFF00', // Yellow
        '#00FFFF', // Cyan
        '#FF00FF', // Magenta
        '#000000', // Black
        '#FFFFFF', // White
        '#808080'  // Gray
    ];

    const bluePalette = [
        '#FFFFFF',
        '#5553FF', // Bright Blue
        '#EF2E98',
        '#4ADE80',
        '#10265D', // Dark Navy
        '#FFDE00',
        '#0C1322'  // Black-ish
    ];

    const cases = [
        // 1. Basic Pastel Mapping (Source: verify_comprehensive.js)
        { name: 'Light Yellow maps to Yellow', input: '#FEF9C3', palette: basicPalette, expect: '#FFFF00' },
        { name: 'Light Red maps to Red', input: '#FEE2E2', palette: basicPalette, expect: '#FF0000' },
        { name: 'Pastel Blue maps to Cyan/Blue', input: '#ADD8E6', palette: basicPalette, expect: ['#00FFFF', '#0000FF'] },
        { name: 'Mint Green maps to Green', input: '#98FB98', palette: basicPalette, expect: '#00FF00' },

        // 2. Grayscale Thresholds (Source: verify_v3_strict.js)
        // These are extremely faint pastels that should NOT map to White.
        { name: 'Faint Rose (Chroma ~9) maps to Red', input: '#FFE4E6', palette: basicPalette, expect: '#FF0000' },
        { name: 'Faint Sky (Chroma ~8) maps to Cyan/Blue', input: '#E0F2FE', palette: basicPalette, expect: ['#00FFFF', '#0000FF'] },
        { name: 'Very Light Cyan (Chroma ~6) maps to Cyan', input: '#ECFEFF', palette: basicPalette, expect: '#00FFFF' },

        // 3. Dark Logic (Source: verify_d2.js)
        // Dark colors should be allowed to map to Black, but NOT to White.
        { name: 'Dark Text maps to Black', input: '#0A0F25', palette: basicPalette, expect: '#000000' },

        // 4. Blue Fix (Source: verify_blues.js)
        // Sky Blue should map to Bright Blue, NOT Dark Navy.
        { name: 'Sky Blue avoids Dark Navy', input: '#BFDBFE', palette: bluePalette, expect: '#5553FF' },
    ];

    cases.forEach(c => {
        const result = findNearestColorV3(c.input, c.palette);
        const expected = Array.isArray(c.expect) ? c.expect : [c.expect];
        const match = expected.includes(result.color);

        assert(match, `${c.name}: ${c.input} -> ${result.color} (Expected: ${expected.join(' or ')})`);

        if (!match) {
            // Debug info
            const lab = hexToLab(c.input);
            const hue = (Math.atan2(lab.b, lab.a) * 180 / Math.PI + 360) % 360;
            console.log(`       Input attributes: L=${lab.l.toFixed(1)}, Hue=${hue.toFixed(1)}`);
        }
    });
    console.log('');
}

// ==========================================
// TEST SCENARIO B: Background Removal
// Covers: processSvgBackground logic integration via V1
// Source: verify_bg_removal.js
// ==========================================
function testBackgroundRemoval() {
    console.log('--- Scenario B: Background Removal ---');

    if (!existsSync('./test_bg_removal.svg')) {
        console.log('[SKIP] test_bg_removal.svg missing.');
        return;
    }

    const svg = readFileSync('./test_bg_removal.svg', 'utf-8');
    const palette = ['#FF0000'];

    const result = recolorV1(svg, palette, {
        removeViewBoxFill: true,
        removeClasses: true
    });

    assert(result.svg.includes('fill="none"'), 'Background rect fill set to "none"');
    assert(!result.svg.includes('class="fill-N7"'), 'Background class removed');
    console.log('');
}


// RUN TESTS
try {
    testV3Logic();
    testBackgroundRemoval();

    console.log('==========================================');
    console.log(`SUMMARY: ${successes} PASS, ${failures} FAIL`);
    console.log('==========================================');

    if (failures > 0) process.exit(1);

} catch (err) {
    console.error('Fatal Error running tests:', err);
    process.exit(1);
}
