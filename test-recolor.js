import { recolorV1, recolorV2 } from './recolor.js';

const testSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="25" cy="25" r="20" fill="#FF0000"/>
    <rect x="50" y="5" width="40" height="40" fill="#00FF00"/>
</svg>`;

const testPalette = ['#FFFFFF', '#5553FF', '#EF2E98', '#4ADE80'];

try {
    console.log('Testing V1 recoloring...');
    const resultV1 = recolorV1(testSVG, testPalette);
    console.log('V1 Result:');
    console.log('- Mapping:', resultV1.mapping);
    console.log('- Detected colors:', resultV1.detectedColors);
    console.log('- SVG length:', resultV1.svg.length);
    console.log('- SVG preview:', resultV1.svg.substring(0, 200) + '...\n');

    console.log('Testing V2 recoloring...');
    const resultV2 = recolorV2(testSVG, testPalette);
    console.log('V2 Result:');
    console.log('- Mapping:', resultV2.mapping);
    console.log('- Detected colors:', resultV2.detectedColors);
    console.log('- Distances:', resultV2.distances);
    console.log('- SVG length:', resultV2.svg.length);
    console.log('- SVG preview:', resultV2.svg.substring(0, 200) + '...');

} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
}
