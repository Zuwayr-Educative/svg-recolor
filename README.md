# SVG Recoloring Tool

An interactive web application for recoloring SVG images with an intuitive interface and advanced color management features.

You can access the web version here: [https://zuwayr-educative.github.io/svg-recolor/](https://zuwayr-educative.github.io/svg-recolor/)

## Features

- 🎨 Interactive SVG element selection
- 🖌️ Real-time color updates
- 🎨 Create and manage custom color palettes
- 🚀 Two auto-recoloring algorithms:
  - Basic RGB-based color matching
  - Advanced LAB color space matching
- 📱 Responsive design that works on all devices
- 💾 Export recolored SVGs with custom dimensions and styling
- 🎯 Preset color palettes for quick styling

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - works completely client-side

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/svg-recolor-tool.git
   cd svg-recolor-tool
   ```

2. Open `index.html` in your web browser

## Usage

1. **Upload an SVG**
   - Click "Upload SVG" or drag and drop your SVG file
   - The SVG will appear in the preview area

2. **Recoloring Options**
   - **Manual Recoloring**: Click on any element in the SVG, then choose a color from the palette
   - **Auto Recolor**: Use the "Auto Recolor" buttons to automatically map colors to your palette
   - **Advanced Recoloring**: Use the V2 algorithm for more accurate color matching in LAB color space

3. **Customize Output**
   - Adjust dimensions, padding, and background color
   - Add rounded corners to your output
   - Choose whether to maintain aspect ratio

4. **Export**
   - Click "Download" to save your recolored SVG
   - The exported file will include all your custom styling

## Color Management

- **Add Colors**: Use the color picker and click "Add Color"
- **Remove Colors**: Hover over a color and click the × button
- **Presets**: Load from predefined color palettes
- **Auto-Matching**: The tool will find the closest color in your palette when using auto-recolor

## Development

### Running Locally

```bash
# Using Python's built-in server
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

### Project Structure

- `index.html` - Main application file
- `README.md` - This documentation file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses LAB color space for advanced color matching
- Inspired by the need for better SVG manipulation tools
- An original idea by Zuwayr and Usama
