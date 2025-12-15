# SVG Recoloring Tool

An interactive web application and REST API for recoloring SVG images with intelligent color matching algorithms.

**Web Version**: [https://zuwayr-educative.github.io/svg-recolor/](https://zuwayr-educative.github.io/svg-recolor/)

**API Server**: Run locally on `http://localhost:3000`

## Quick Start

### Web App (No Installation)
Visit [https://zuwayr-educative.github.io/svg-recolor/](https://zuwayr-educative.github.io/svg-recolor/) or open `index.html` locally.

### API (3 Commands)
```bash
npm install
npm start
# API running at http://localhost:3000
```

## Features

### Web Application
- 🎨 Interactive SVG element selection
- 🖌️ Real-time color updates
- 🎨 Create and manage custom color palettes
- 📱 Responsive design that works on all devices
- 💾 Export recolored SVGs with custom dimensions and styling
- 🎯 Preset color palettes for quick styling

### REST API
- 🚀 Two intelligent recoloring algorithms:
  - **V1**: Fast RGB Euclidean distance matching
  - **V2**: Perceptually accurate LAB color space matching (CIE76 Delta E)
- ⚡ High-performance Fastify server
- 🌐 CORS enabled for web integrations
- 📊 Rich metadata in response headers (color mappings, distances)
- 🔄 Handles all SVG color formats (hex, rgb, named colors)
- ✅ Comprehensive error handling and validation

## Getting Started

### Web Application

#### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - works completely client-side

#### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/svg-recolor-tool.git
   cd svg-recolor-tool
   ```

2. Open `index.html` in your web browser

### API Server

#### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

#### Installation
1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/svg-recolor-tool.git
   cd svg-recolor-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. The API will be available at `http://localhost:3000`

## Usage

### Web Application

1. **Upload an SVG**
   - Click "Upload SVG" or drag and drop your SVG file
   - The SVG will appear in the preview area

2. **Recoloring Options**
   - **Manual Recoloring**: Click on any element in the SVG, then choose a color from the palette
   - **Auto Recolor V1**: Fast RGB-based automatic color mapping to your palette
   - **Auto Recolor V2**: Advanced LAB color space for perceptually accurate color matching

3. **Customize Output**
   - Adjust dimensions, padding, and background color
   - Add rounded corners to your output
   - Choose whether to maintain aspect ratio

4. **Export**
   - Click "Download" to save your recolored SVG
   - The exported file will include all your custom styling

### API

#### Endpoints

**Health Check**
```bash
GET http://localhost:3000/health
```

**V1 Recoloring (RGB Distance)**
```bash
curl -X POST http://localhost:3000/api/recolor/v1 \
  -H "Content-Type: application/json" \
  -d '{
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
    "palette": ["#FFFFFF", "#5553FF", "#EF2E98", "#4ADE80"]
  }' \
  -o recolored.svg
```

**V2 Recoloring (LAB Color Space)**
```bash
curl -X POST http://localhost:3000/api/recolor/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
    "palette": ["#FFFFFF", "#5553FF", "#EF2E98", "#4ADE80"]
  }' \
  -o recolored.svg
```

#### Request Format
```json
{
  "svg": "<svg>...</svg>",
  "palette": ["#FFFFFF", "#5553FF", "#EF2E98"]
}
```

- **svg** (string, required): The SVG content as a string
- **palette** (array, required): Array of hex colors in format `#RRGGBB`

#### Response
- **Content-Type**: `image/svg+xml`
- **Body**: Recolored SVG content
- **Headers**:
  - `X-Color-Mapping`: JSON object mapping original → new colors
  - `X-Detected-Colors`: JSON array of all detected colors
  - `X-Color-Distances`: (V2 only) Delta E distances for each mapping

#### Example with JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/recolor/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    svg: '<svg>...</svg>',
    palette: ['#FFFFFF', '#5553FF', '#EF2E98']
  })
});

const recoloredSVG = await response.text();
const mapping = JSON.parse(response.headers.get('X-Color-Mapping'));
console.log('Color mapping:', mapping);
```

For complete API documentation, see [API.md](API.md)

## Color Management

- **Add Colors**: Use the color picker and click "Add Color"
- **Remove Colors**: Hover over a color and click the × button
- **Presets**: Load from predefined color palettes
- **Auto-Matching**: The tool will find the closest color in your palette when using auto-recolor

## Algorithm Comparison

### V1: RGB Distance
- **Method**: Euclidean distance in RGB color space
- **Formula**: `√((r₁-r₂)² + (g₁-g₂)² + (b₁-b₂)²)`
- **Speed**: Fast ⚡
- **Best for**: Quick recoloring, batch processing, simple color schemes

### V2: LAB Color Space
- **Method**: CIE76 Delta E in LAB color space
- **Process**: RGB → XYZ → LAB → Delta E calculation
- **Speed**: Slightly slower but still fast ⚡
- **Best for**: Professional designs, brand colors, perceptually accurate matching
- **Advantage**: Matches how humans perceive color differences

## Development

### Web Application

```bash
# Using Python's built-in server
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

### API Server

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Run in production mode
npm start

# Test the API
node send-svg.js
```

#### Environment Variables
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

Example:
```bash
PORT=8080 HOST=127.0.0.1 npm start
```

### Project Structure

```
recolor-svg/
├── index.html           # Web application
├── index.js             # Web app logic (browser)
├── server.js            # API server (Fastify)
├── recolor.js           # Core recoloring algorithms
├── package.json         # Dependencies and scripts
├── README.md            # This file
├── API.md               # Complete API documentation
├── send-svg.js          # Example API usage script
├── test-api.js          # Automated API tests
├── test-recolor.js      # Unit tests for recolor module
└── testing/             # Test files
    ├── dumbifySvg.js    # SVG simplification utility
    └── run-op.js        # Test runner
```

### Testing

Test the recolor module directly:
```bash
node test-recolor.js
```

Test the API endpoints:
```bash
# In one terminal, start the server
npm start

# In another terminal, run tests
node test-api.js
```

Test with a real SVG (Robot example):
```bash
# Start the server first
npm start
```

Test with any SVG file:
```bash
# Place your SVG file in the testing/ directory as 'test_input.svg'
# Then run:
node send-svg.js
# The recolored SVG will be saved to testing/output.svg
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Technologies

### Web Application
- Vanilla JavaScript, HTML5, and CSS3
- Client-side SVG parsing and manipulation
- Drag-and-drop file upload
- No external dependencies

### API Server
- **Fastify** - Fast and low overhead web framework
- **xmldom** - Server-side XML/SVG parsing
- **@fastify/cors** - CORS support for web integrations
- Node.js ES modules

### Color Science
- RGB Euclidean distance (V1)
- CIE76 Delta E in LAB color space (V2)
- XYZ color space intermediate conversion
- Support for hex, RGB, and named color formats

## Acknowledgments

- Built with vanilla JavaScript, HTML5, and CSS3
- API powered by Fastify for high performance
- Uses LAB color space for advanced perceptually accurate color matching
- Inspired by the need for better SVG manipulation tools

> An original idea by Zuwayr and Usama
