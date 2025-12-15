import fs from 'fs';

// Simple test SVG with multiple colors
const testSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="25" cy="25" r="20" fill="#FF0000"/>
    <rect x="50" y="5" width="40" height="40" fill="#00FF00"/>
    <polygon points="10,70 50,90 90,70" fill="#0000FF" stroke="#FFFF00" stroke-width="2"/>
</svg>`;

// Test palette
const testPalette = ['#FFFFFF', '#5553FF', '#EF2E98', '#4ADE80', '#10265D', '#FFDE00', '#0C1322'];

async function testEndpoint(version) {
    try {
        console.log(`\nTesting /api/recolor/${version}...`);

        const response = await fetch(`http://localhost:3000/api/recolor/${version}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                svg: testSVG,
                palette: testPalette
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error(`Error: ${error.message}`);
            return;
        }

        const recoloredSVG = await response.text();
        const mapping = JSON.parse(response.headers.get('X-Color-Mapping'));
        const detectedColors = JSON.parse(response.headers.get('X-Detected-Colors'));

        console.log(`✓ Status: ${response.status}`);
        console.log(`✓ Content-Type: ${response.headers.get('Content-Type')}`);
        console.log(`✓ Detected Colors:`, detectedColors);
        console.log(`✓ Color Mapping:`, mapping);
        console.log(`✓ Output SVG length: ${recoloredSVG.length} bytes`);

        // Save to file
        fs.writeFileSync(`test-output-${version}.svg`, recoloredSVG);
        console.log(`✓ Saved to test-output-${version}.svg`);

        if (version === 'v2') {
            const distances = JSON.parse(response.headers.get('X-Color-Distances'));
            console.log(`✓ Color Distances (LAB):`, distances);
        }

    } catch (error) {
        console.error(`Failed to test ${version}:`, error.message);
    }
}

async function runTests() {
    console.log('Starting API tests...');
    console.log('Make sure the server is running on port 3000');

    // Wait a bit to ensure server is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testEndpoint('v1');
    await testEndpoint('v2');

    console.log('\nAll tests completed!');
}

runTests();
