import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sendSVG() {
    return new Promise((resolve, reject) => {
        // Read the input SVG file
        const svgPath = path.join(__dirname, 'testing', 'test_input.svg');
        const svgContent = fs.readFileSync(svgPath, 'utf-8');

        // Define the color palette
        const palette = ['#FFFFFF', '#5553FF', '#EF2E98', '#4ADE80', '#10265D', '#FFDE00', '#0C1322'];
        
        // Prepare the request data
        const postData = JSON.stringify({
            svg: svgContent,
            palette: palette
        });

        console.log('Sending SVG to API...');

        // Configure the HTTP request
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/recolor/v2',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            // Collect response data
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            // When response is complete
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Get headers
                    const mapping = JSON.parse(res.headers['x-color-mapping'] || '{}');
                    const detectedColors = JSON.parse(res.headers['x-detected-colors'] || '[]');

                    console.log('✅ Recoloring successful!');
                    console.log('🎨 Detected colors:', detectedColors);
                    console.log('🔄 Color mapping:', mapping);

                    // Save the recolored SVG
                    const outputPath = path.join(__dirname, 'testing', 'output.svg');
                    fs.writeFileSync(outputPath, responseData);
                    console.log(`💾 Recolored SVG saved to: ${outputPath}`);
                    
                    resolve(responseData);
                } else {
                    let errorMessage = `Request failed with status code ${res.statusCode}`;
                    try {
                        const errorData = JSON.parse(responseData);
                        errorMessage += `: ${errorData.message || errorData.error || 'Unknown error'}`;
                    } catch (e) {
                        errorMessage += `: ${responseData}`;
                    }
                    reject(new Error(errorMessage));
                }
            });
        });

        // Handle request errors
        req.on('error', (error) => {
            reject(error);
        });

        // Send the request
        req.write(postData);
        req.end();
    });
}

// Run the function
sendSVG()
    .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
