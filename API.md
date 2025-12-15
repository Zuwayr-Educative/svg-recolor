# Recolor SVG API Documentation

A REST API for recoloring SVG images using intelligent color mapping algorithms.

## Quick Start

### Installation

```bash
npm install
```

### Starting the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

### V1 Recoloring (RGB Distance)

**POST** `/api/recolor/v1`

Recolors an SVG using simple RGB Euclidean distance for color matching. This is faster but less perceptually accurate.

**Request Body:**
```json
{
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
  "palette": ["#FFFFFF", "#5553FF", "#EF2E98", "#4ADE80"]
}
```

**Parameters:**
- `svg` (string, required): The SVG content as a string
- `palette` (array, required): Array of hex color codes (must be in format `#RRGGBB`)

**Response:**
- Content-Type: `image/svg+xml`
- Body: Recolored SVG content
- Headers:
  - `X-Color-Mapping`: JSON object mapping original colors to new colors
  - `X-Detected-Colors`: JSON array of all colors detected in the original SVG

**Example:**

```bash
curl -X POST http://localhost:3000/api/recolor/v1 \
  -H "Content-Type: application/json" \
  -d '{
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"25\" cy=\"25\" r=\"20\" fill=\"#FF0000\"/></svg>",
    "palette": ["#FFFFFF", "#5553FF", "#EF2E98", "#4ADE80"]
  }' \
  -o output.svg
```

---

### V2 Recoloring (LAB Color Space)

**POST** `/api/recolor/v2`

Recolors an SVG using LAB color space (CIE76) for perceptually accurate color matching. This provides better visual results but is slightly slower.

**Request Body:**
```json
{
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
  "palette": ["#FFFFFF", "#5553FF", "#EF2E98", "#4ADE80"]
}
```

**Parameters:**
- `svg` (string, required): The SVG content as a string
- `palette` (array, required): Array of hex color codes (must be in format `#RRGGBB`)

**Response:**
- Content-Type: `image/svg+xml`
- Body: Recolored SVG content
- Headers:
  - `X-Color-Mapping`: JSON object mapping original colors to new colors
  - `X-Detected-Colors`: JSON array of all colors detected in the original SVG
  - `X-Color-Distances`: JSON object showing perceptual distance (Delta E) for each color mapping

**Example:**

```bash
curl -X POST http://localhost:3000/api/recolor/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"25\" cy=\"25\" r=\"20\" fill=\"#FF0000\"/></svg>",
    "palette": ["#FFFFFF", "#5553FF", "#EF2E98", "#4ADE80"]
  }' \
  -o output.svg
```

---

## Algorithm Comparison

### V1: RGB Distance
- **Method**: Euclidean distance in RGB color space
- **Speed**: Fast
- **Accuracy**: Good for most use cases
- **Best for**: Quick recoloring, batch processing

### V2: LAB Color Space
- **Method**: CIE76 Delta E in LAB color space
- **Speed**: Slightly slower
- **Accuracy**: Perceptually accurate - matches how humans perceive color differences
- **Best for**: Professional designs, brand colors, when visual accuracy is critical

---

## Error Responses

### 400 Bad Request

Missing or invalid parameters:

```json
{
  "error": "Invalid request",
  "message": "SVG string is required"
}
```

Invalid color format:

```json
{
  "error": "Invalid palette",
  "message": "Invalid hex colors: #fff, #00"
}
```

### 500 Internal Server Error

Recoloring failed:

```json
{
  "error": "Recoloring failed",
  "message": "Error details here"
}
```

---

## Integration Examples

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/api/recolor/v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    svg: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>',
    palette: ['#FFFFFF', '#5553FF', '#EF2E98']
  })
});

const recoloredSVG = await response.text();
const mapping = JSON.parse(response.headers.get('X-Color-Mapping'));
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/api/recolor/v2',
    json={
        'svg': '<svg xmlns="http://www.w3.org/2000/svg">...</svg>',
        'palette': ['#FFFFFF', '#5553FF', '#EF2E98']
    }
)

recolored_svg = response.text
mapping = response.headers['X-Color-Mapping']
```

### cURL

```bash
curl -X POST http://localhost:3000/api/recolor/v2 \
  -H "Content-Type: application/json" \
  -d @request.json \
  -o output.svg
```

Where `request.json` contains:
```json
{
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
  "palette": ["#FFFFFF", "#5553FF", "#EF2E98"]
}
```

---

## Features

- Fast and efficient SVG recoloring
- Two algorithms: simple RGB and perceptually accurate LAB
- Handles fill, stroke, and stop-color attributes
- Handles inline styles
- Color normalization (supports hex, RGB, named colors)
- CORS enabled for web integrations
- Comprehensive error handling
- Metadata in response headers

---

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

Example:
```bash
PORT=8080 HOST=127.0.0.1 npm start
```

---

## Technical Details

### Supported Color Formats in Input SVG

The API automatically normalizes:
- Hex colors: `#FF0000`, `#f00`
- RGB colors: `rgb(255, 0, 0)`
- Named colors: `red`, `blue`, etc.

All colors are converted to lowercase hex format (`#rrggbb`) internally.

### Palette Requirements

- Must be an array of hex colors
- Each color must be in format `#RRGGBB` (6 hex digits)
- Case insensitive
- At least one color required

---

## License

MIT
