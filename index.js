import {
    normalizeColor,
    findNearestColorV1,
    findNearestColorV2,
    setOrUpdateStyleProp
} from './color-utils.js';
import { dumbifySvg } from './dumbifySvg.js';

/**
 * Interactive SVG Recoloring App
 * Main application class for handling SVG upload, manipulation, and recoloring
 */
class InteractiveSVGRecolorApp {
    constructor() {
        this.originalSVG = null;
        this.currentSVG = null;
        this.palette = [];
        this.selectedColor = null;
        this.selectedElement = null;
        this.elementColors = new Map(); // Track original colors of elements
        this.currentColors = new Set(); // Track all detected colors

        this.initializeElements();
        this.bindEvents();
        this.loadDefaultPalette();
    }

    initializeElements() {
        this.fileInput = document.getElementById('file-input');
        this.dropArea = document.getElementById('file-drop-area');
        this.originalPreview = document.getElementById('original-preview');
        this.outputPreview = document.getElementById('output-preview');
        this.paletteContainer = document.getElementById('palette-colors');
        this.colorPicker = document.getElementById('color-picker');
        this.addColorBtn = document.getElementById('add-color-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.colorStatus = document.getElementById('color-status');
        this.autoRecolorBtn = document.getElementById('auto-recolor-btn');
        this.autoRecolorV2Btn = document.getElementById('auto-recolor-v2-btn');
        this.restoreOriginalBtn = document.getElementById('restore-original');

        this.outputWidth = document.getElementById('output-width');
        this.outputHeight = document.getElementById('output-height');
        this.padding = document.getElementById('padding');
        this.borderRadius = document.getElementById('border-radius');
        this.backgroundColor = document.getElementById('background-color');
        this.maintainAspect = document.getElementById('maintain-aspect');
        this.removeViewboxFill = document.getElementById('remove-viewbox-fill');
        this.removeClasses = document.getElementById('remove-classes');
    }

    bindEvents() {
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.dropArea.addEventListener('click', () => this.fileInput.click());
        this.dropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.dropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        this.addColorBtn.addEventListener('click', () => this.addColorToPalette());
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.autoRecolorBtn.addEventListener('click', () => this.autoRecolorToPalette());
        this.autoRecolorV2Btn.addEventListener('click', () => this.autoRecolorV2ToPalette());
        this.restoreOriginalBtn.addEventListener('click', () => this.restoreOriginal());
        this.restoreOriginalBtn.addEventListener('click', () => this.restoreOriginal());
        this.removeViewboxFill.addEventListener('change', () => this.displayInteractiveSVG());
        this.removeClasses.addEventListener('change', () => this.displayInteractiveSVG());

        // Add click-outside detection to clear selection
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        this.outputWidth.addEventListener('input', () => this.updateOutput());
        this.outputHeight.addEventListener('input', () => this.updateOutput());
        this.padding.addEventListener('input', () => this.updateOutput());
        this.borderRadius.addEventListener('input', () => this.updateOutput());
        this.backgroundColor.addEventListener('input', () => this.updateOutput());
        this.maintainAspect.addEventListener('change', () => this.updateOutput());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'image/svg+xml') {
            this.processFile(files[0]);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file && file.type === 'image/svg+xml') {
            this.processFile(file);
        }
    }

    isBase64SVG(data) {
        // Check if the data starts with 'data:image/svg+xml;base64,'
        if (typeof data === 'string' && data.startsWith('data:image/svg+xml;base64,')) {
            return true;
        }
        return false;
    }

    extractNestedBase64SVG(svgString) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const images = doc.getElementsByTagName('image');
            let modified = false;

            for (let img of images) {
                const href = img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                if (href && this.isBase64SVG(href)) {
                    const decoded = this.decodeBase64SVG(href);
                    if (decoded && decoded.includes('<svg')) {
                        // Create a temporary div to parse the SVG
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = decoded;
                        const svgElement = tempDiv.querySelector('svg');

                        if (svgElement) {
                            // Copy attributes from image to the new SVG
                            for (let i = 0; i < img.attributes.length; i++) {
                                const attr = img.attributes[i];
                                if (attr.name !== 'xlink:href' && attr.name !== 'xmlns:xlink') {
                                    svgElement.setAttribute(attr.name, attr.value);
                                }
                            }

                            // Replace the image with the decoded SVG
                            img.parentNode.replaceChild(svgElement, img);
                            modified = true;
                        }
                    }
                }
            }

            return modified ? new XMLSerializer().serializeToString(doc.documentElement) : svgString;
        } catch (error) {
            console.error('Error processing nested base64 SVG:', error);
            return svgString;
        }
    }

    decodeBase64SVG(base64Data) {
        try {
            // Remove the data URL prefix
            const base64String = base64Data.split('base64,')[1];
            if (!base64String) return null;

            // Decode the base64 string
            const decodedString = atob(base64String);
            return decodedString;
        } catch (error) {
            console.error('Error decoding base64 SVG:', error);
            return null;
        }
    }

    processFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let fileContent = e.target.result;

                // First, try to read as text
                if (typeof fileContent === 'string') {
                    // Process any nested base64 SVGs in image elements
                    fileContent = this.extractNestedBase64SVG(fileContent);

                    // Check if it's a base64 data URL
                    if (this.isBase64SVG(fileContent)) {
                        const decodedSVG = this.decodeBase64SVG(fileContent);
                        if (decodedSVG && decodedSVG.includes('<svg')) {
                            // Run dumbifySvg on the content
                            const optimizedSVG = dumbifySvg(decodedSVG, { replacePaintServers: true });
                            this.originalSVG = optimizedSVG;
                            this.currentSVG = optimizedSVG;
                            this.displayInteractiveSVG();
                            return;
                        }
                    }

                    // If it's not base64 but contains SVG, use it directly
                    if (fileContent.includes('<svg')) {
                        // Run dumbifySvg on the content
                        const optimizedSVG = dumbifySvg(fileContent, { replacePaintServers: true });
                        this.originalSVG = optimizedSVG;
                        this.currentSVG = optimizedSVG;
                        this.displayInteractiveSVG();
                        return;
                    }
                }

                // If we get here, try reading as binary
                const binaryReader = new FileReader();
                binaryReader.onload = (binaryEvent) => {
                    try {
                        const binaryData = binaryEvent.target.result;
                        const decoder = new TextDecoder('utf-8');
                        const text = decoder.decode(new Uint8Array(binaryData));

                        if (text.includes('<svg')) {
                            // Run dumbifySvg on the content
                            const optimizedSVG = dumbifySvg(text, { replacePaintServers: true });
                            this.originalSVG = optimizedSVG;
                            this.currentSVG = optimizedSVG;
                            this.displayInteractiveSVG();
                        } else {
                            throw new Error('File does not contain valid SVG data');
                        }
                    } catch (error) {
                        console.error('Error processing binary data:', error);
                        alert('Error: Could not process the file. Please make sure it is a valid SVG file.');
                    }
                };

                binaryReader.onerror = (error) => {
                    console.error('Error reading binary data:', error);
                    alert('Error reading file. Please try again.');
                };

                binaryReader.readAsArrayBuffer(file);

            } catch (error) {
                console.error('Error processing file:', error);
                alert('Error processing file. Please try again.');
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };

        // First try reading as text
        reader.readAsText(file);
    }

    processSvgBackground(svgContent) {
        if (!this.removeViewboxFill.checked && !this.removeClasses.checked) {
            return svgContent;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        if (svg) {
            const shouldRemoveFill = this.removeViewboxFill.checked;
            const shouldRemoveClasses = this.removeClasses.checked;

            // Helper to process an element
            const processElement = (el) => {
                let processed = false;

                // Set fill to none if requested
                if (shouldRemoveFill) {
                    if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
                        el.setAttribute('fill', 'none');
                        processed = true;
                    }

                    if (el.hasAttribute('style')) {
                        let style = el.getAttribute('style');
                        if (style.match(/fill:\s*[^;]+/)) {
                            style = style
                                .replace(/fill:\s*[^;]+;?/g, 'fill: none;')
                                .replace(/fill-rule:\s*[^;]+;?/g, '')
                                .replace(/;+/g, ';')
                                .replace(/^;|;$/g, '')
                                .trim();

                            if (style) el.setAttribute('style', style);
                            else el.removeAttribute('style');
                            processed = true;
                        }
                    }
                }

                // Remove classes if requested
                if (shouldRemoveClasses && el.hasAttribute('class')) {
                    el.removeAttribute('class');
                    processed = true;
                }

                return processed;
            };

            // 1. Try the root SVG first
            if (!processElement(svg)) {
                // 2. If root didn't have fill/class to process, look for the first rect
                // BFS traversal to find the first rect
                const queue = [svg];
                let found = false;

                while (queue.length > 0 && !found) {
                    const node = queue.shift();

                    if (node.tagName && node.tagName.toLowerCase() === 'rect') {
                        // Found a candidate background rect
                        if (processElement(node)) {
                            found = true;
                        }
                    }

                    if (!found && node.childNodes) {
                        for (let i = 0; i < node.childNodes.length; i++) {
                            if (node.childNodes[i].nodeType === 1) { // Element node
                                queue.push(node.childNodes[i]);
                            }
                        }
                    }
                }
            }

            return new XMLSerializer().serializeToString(doc.documentElement);
        }
        return svgContent;
    }

    displayInteractiveSVG() {
        // Apply background processing for display
        const svgContent = this.processSvgBackground(this.currentSVG);

        this.originalPreview.innerHTML = svgContent;
        const svgElement = this.originalPreview.querySelector('svg');

        if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            this.makeElementsClickable(svgElement);
            this.extractColors();
            this.updateOutput();
        }
    }

    makeElementsClickable(svg) {
        // Find all elements that have fill or stroke
        const elements = svg.querySelectorAll('*');

        elements.forEach((element, index) => {
            const fill = element.getAttribute('fill');
            const stroke = element.getAttribute('stroke');
            const style = element.getAttribute('style');

            let hasColor = false;
            if (fill && fill !== 'none' && fill !== 'transparent') hasColor = true;
            if (stroke && stroke !== 'none' && stroke !== 'transparent') hasColor = true;
            if (style && (style.includes('fill:') || style.includes('stroke:'))) hasColor = true;

            if (hasColor) {
                element.classList.add('clickable-element');
                element.dataset.elementId = index;

                // Store original color
                this.elementColors.set(index, this.getElementColor(element));

                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectElement(element, index);
                });
            }
        });
    }

    getElementColor(element) {
        const fill = element.getAttribute('fill');
        const stroke = element.getAttribute('stroke');
        const style = element.getAttribute('style');

        // Priority: fill > stroke > style
        if (fill && fill !== 'none' && fill !== 'transparent') {
            return { type: 'fill', color: fill };
        }
        if (stroke && stroke !== 'none' && stroke !== 'transparent') {
            return { type: 'stroke', color: stroke };
        }
        if (style) {
            const fillMatch = style.match(/fill:\s*([^;]+)/);
            const strokeMatch = style.match(/stroke:\s*([^;]+)/);
            if (fillMatch && fillMatch[1] !== 'none' && fillMatch[1] !== 'transparent') {
                return { type: 'style-fill', color: fillMatch[1].trim() };
            }
            if (strokeMatch && strokeMatch[1] !== 'none' && strokeMatch[1] !== 'transparent') {
                return { type: 'style-stroke', color: strokeMatch[1].trim() };
            }
        }
        return null;
    }

    selectElement(element, elementId) {
        this.clearSelection();

        // Select new element
        this.selectedElement = { element, elementId };
        element.classList.add('selected-element');
        element.style.outline = '3px solid #667eea';

        const colorInfo = this.elementColors.get(elementId);
        this.colorStatus.innerHTML = `
            <span class="current-selection">Selected:</span> 
            ${element.tagName.toLowerCase()} element 
            <span style="display:inline-block; width:20px; height:20px; background:${colorInfo.color}; border-radius:3px; vertical-align:middle; margin:0 4px; border:1px solid #ddd;"></span>
            ${colorInfo.color}
        `;
    }

    clearSelection() {
        // Remove previous selection
        const previousSelected = this.originalPreview.querySelector('.selected-element');
        if (previousSelected) {
            previousSelected.classList.remove('selected-element');
            previousSelected.style.outline = '';
        }
        this.selectedElement = null;
    }

    handleDocumentClick(e) {
        // Check if click is outside the SVG preview area
        if (!this.originalPreview.contains(e.target)) {
            this.clearSelection();
            this.colorStatus.innerHTML = 'Click on an SVG element to start recoloring';
        }
    }

    selectPaletteColor(color) {
        // Remove previous selection
        document.querySelectorAll('.palette-color').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new color
        this.selectedColor = color;
        const colorElement = document.querySelector(`[data-color="${color}"]`);
        if (colorElement) {
            colorElement.classList.add('selected');
        }

        // Apply color if element is selected
        if (this.selectedElement) {
            this.applyColorToSelectedElement(color);
        }
    }

    applyColorToSelectedElement(color) {
        if (!this.selectedElement) return;

        const { element, elementId } = this.selectedElement;
        const colorInfo = this.elementColors.get(elementId);

        // Apply color based on original type
        if (colorInfo.type === 'fill') {
            element.setAttribute('fill', color);
        } else if (colorInfo.type === 'stroke') {
            element.setAttribute('stroke', color);
        } else if (colorInfo.type === 'style-fill') {
            let style = element.getAttribute('style') || '';
            style = style.replace(/fill:\s*[^;]+/, `fill: ${color}`);
            element.setAttribute('style', style);
        } else if (colorInfo.type === 'style-stroke') {
            let style = element.getAttribute('style') || '';
            style = style.replace(/stroke:\s*[^;]+/, `stroke: ${color}`);
            element.setAttribute('style', style);
        }

        // Update current SVG
        this.currentSVG = this.originalPreview.innerHTML;
        this.updateOutput();

        // Update status
        this.colorStatus.innerHTML = `
            <span class="current-selection">Applied:</span> 
            ${color} to ${element.tagName.toLowerCase()} element
            <span style="display:inline-block; width:20px; height:20px; background:${color}; border-radius:3px; vertical-align:middle; margin:0 4px; border:1px solid #ddd;"></span>
        `;
    }

    addColorToPalette() {
        const color = this.colorPicker.value;
        if (!this.palette.includes(color)) {
            this.palette.push(color);
            this.updatePaletteDisplay();
        }
    }

    updatePaletteDisplay() {
        this.paletteContainer.innerHTML = '';
        this.palette.forEach((color, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'palette-color';
            colorDiv.style.backgroundColor = color;
            colorDiv.title = color;
            colorDiv.dataset.color = color;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.palette.splice(index, 1);
                this.updatePaletteDisplay();
            };

            colorDiv.appendChild(removeBtn);
            colorDiv.addEventListener('click', () => this.selectPaletteColor(color));
            this.paletteContainer.appendChild(colorDiv);
        });
    }

    loadDefaultPalette() {
        this.palette = ['#FFFFFF', '#5553FF', '#EF2E98', '#4ADE80', '#10265D', '#FFDE00', '#0C1322'];
        this.updatePaletteDisplay();
    }

    extractColors() {
        this.currentColors.clear();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(this.currentSVG, 'image/svg+xml');

        const elements = svgDoc.querySelectorAll('*');
        elements.forEach(el => {
            const fill = el.getAttribute('fill');
            const stroke = el.getAttribute('stroke');

            if (fill && fill !== 'none' && fill !== 'transparent') {
                this.currentColors.add(normalizeColor(fill));
            }
            if (stroke && stroke !== 'none' && stroke !== 'transparent') {
                this.currentColors.add(normalizeColor(stroke));
            }

            const style = el.getAttribute('style');
            if (style) {
                const fillMatch = style.match(/fill:\s*([^;]+)/);
                const strokeMatch = style.match(/stroke:\s*([^;]+)/);

                if (fillMatch && fillMatch[1] !== 'none' && fillMatch[1] !== 'transparent') {
                    this.currentColors.add(normalizeColor(fillMatch[1]));
                }
                if (strokeMatch && strokeMatch[1] !== 'none' && strokeMatch[1] !== 'transparent') {
                    this.currentColors.add(normalizeColor(strokeMatch[1]));
                }
            }
        });
    }



    autoRecolorToPalette() {
        if (!this.originalSVG || this.palette.length === 0) {
            alert('Please upload an SVG and set up your color palette first.');
            return;
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(this.originalSVG, 'image/svg+xml');
        const elements = svgDoc.querySelectorAll('*');

        // Create color mapping
        const colorMap = new Map();
        Array.from(this.currentColors).forEach(originalColor => {
            const nearestColor = findNearestColorV1(originalColor, this.palette);
            colorMap.set(originalColor.toLowerCase(), nearestColor);
        });

        // Update elements
        elements.forEach(el => {
            // Handle fill attribute
            const fill = el.getAttribute('fill');
            if (fill && fill !== 'none' && fill !== 'transparent') {
                const normalizedFill = normalizeColor(fill);
                const newColor = colorMap.get(normalizedFill.toLowerCase());
                if (newColor) {
                    el.setAttribute('fill', newColor);
                }
            }

            // Handle stroke attribute
            const stroke = el.getAttribute('stroke');
            if (stroke && stroke !== 'none' && stroke !== 'transparent') {
                const normalizedStroke = normalizeColor(stroke);
                const newColor = colorMap.get(normalizedStroke.toLowerCase());
                if (newColor) {
                    el.setAttribute('stroke', newColor);
                }
            }

            // Handle style attribute
            const style = el.getAttribute('style');
            if (style) {
                let newStyle = style;

                // Replace fill in style
                const fillMatch = style.match(/fill:\s*([^;]+)/);
                if (fillMatch && fillMatch[1] !== 'none' && fillMatch[1] !== 'transparent') {
                    const normalizedFill = normalizeColor(fillMatch[1].trim());
                    const newColor = colorMap.get(normalizedFill.toLowerCase());
                    if (newColor) {
                        newStyle = newStyle.replace(/fill:\s*[^;]+/, `fill: ${newColor}`);
                    }
                }

                // Replace stroke in style
                const strokeMatch = style.match(/stroke:\s*([^;]+)/);
                if (strokeMatch && strokeMatch[1] !== 'none' && strokeMatch[1] !== 'transparent') {
                    const normalizedStroke = normalizeColor(strokeMatch[1].trim());
                    const newColor = colorMap.get(normalizedStroke.toLowerCase());
                    if (newColor) {
                        newStyle = newStyle.replace(/stroke:\s*[^;]+/, `stroke: ${newColor}`);
                    }
                }

                if (newStyle !== style) {
                    el.setAttribute('style', newStyle);
                }
            }
        });

        this.currentSVG = new XMLSerializer().serializeToString(svgDoc);
        this.displayInteractiveSVG();

        this.colorStatus.innerHTML = `
            <span class="current-selection">Auto Recolored:</span> 
            Applied ${colorMap.size} color mappings to palette
        `;
    }

    restoreOriginal() {
        if (!this.originalSVG) {
            alert('No original SVG to restore.');
            return;
        }

        this.currentSVG = this.originalSVG;
        this.displayInteractiveSVG();

        this.colorStatus.innerHTML = 'Original colors restored - click on an element to start recoloring';
    }



    collectColorsFromStyleAttr(style) {
        const colors = [];
        if (!style) return colors;

        const props = ['fill', 'stroke', 'stop-color'];
        for (const prop of props) {
            const regex = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'gi');
            let match;
            while ((match = regex.exec(style)) !== null) {
                const value = normalizeColor(match[1].trim());
                if (value) {
                    colors.push({ prop, value });
                }
            }
        }
        return colors;
    }



    gatherDetectedColorsV2(svgDoc) {
        const colors = new Set();
        const all = svgDoc.querySelectorAll('*');
        for (const el of all) {
            for (const attr of ['fill', 'stroke', 'stop-color']) {
                const v = el.getAttribute(attr);
                const n = normalizeColor(v);
                if (n) colors.add(n);
            }
            const style = el.getAttribute('style');
            for (const item of this.collectColorsFromStyleAttr(style)) {
                colors.add(item.value);
            }
        }
        return Array.from(colors).sort();
    }

    recolorSvgDocV2(svgDoc, paletteHexes) {
        if (!paletteHexes.length) throw new Error('Palette is empty.');

        const fromColors = this.gatherDetectedColorsV2(svgDoc);
        const mapping = new Map();
        const distances = new Map();

        for (const c of fromColors) {
            const best = findNearestColorV2(c, paletteHexes);
            mapping.set(c, best.color);
            distances.set(c, best.distance);
        }

        const all = svgDoc.querySelectorAll('*');
        for (const el of all) {
            for (const attr of ['fill', 'stroke', 'stop-color']) {
                const v = el.getAttribute(attr);
                const n = normalizeColor(v);
                if (n && mapping.has(n)) el.setAttribute(attr, mapping.get(n));
            }

            const style = el.getAttribute('style');
            if (style) {
                let next = style;
                for (const prop of ['fill', 'stroke', 'stop-color']) {
                    const items = this.collectColorsFromStyleAttr(next).filter(
                        x => x.prop === prop
                    );
                    for (const it of items) {
                        if (mapping.has(it.value)) {
                            next = setOrUpdateStyleProp(next, prop, mapping.get(it.value));
                        }
                    }
                }
                el.setAttribute('style', next);
            }
        }

        return { mapping, distances, fromColors };
    }

    autoRecolorV2ToPalette() {
        if (!this.originalSVG || this.palette.length === 0) {
            alert('Please upload an SVG and set up your color palette first.');
            return;
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(this.currentSVG, 'image/svg+xml');

        this.recolorSvgDocV2(svgDoc, this.palette);

        this.currentSVG = new XMLSerializer().serializeToString(svgDoc);
        this.displayInteractiveSVG();

        this.colorStatus.innerHTML = `
            <span class="current-selection">Auto Recolored (V2):</span> 
            Applied perceptual color matching to palette
        `;
    }

    updateOutput() {
        if (!this.currentSVG) return;

        // Apply background processing for output
        const processedSVG = this.processSvgBackground(this.currentSVG);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(processedSVG, 'image/svg+xml');
        const svg = svgDoc.querySelector('svg');

        const width = parseInt(this.outputWidth.value);
        const height = parseInt(this.outputHeight.value);
        const padding = parseInt(this.padding.value);
        const borderRadius = parseInt(this.borderRadius.value);
        const bgColor = this.backgroundColor.value;

        const container = document.createElement('div');
        container.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            padding: ${padding}px;
            background-color: ${bgColor};
            border-radius: ${borderRadius}px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        `;

        if (svg) {
            const svgClone = svg.cloneNode(true);
            svgClone.style.cssText = `
                max-width: ${width - (padding * 2)}px;
                max-height: ${height - (padding * 2)}px;
                width: auto;
                height: auto;
            `;

            // Clean up selection styles from the preview clone
            const cloneElements = svgClone.querySelectorAll('*');
            cloneElements.forEach(el => {
                el.classList.remove('selected-element');
                el.classList.remove('clickable-element');
                if (el.style.outline) {
                    el.style.outline = '';
                }
            });

            container.appendChild(svgClone);
        }

        this.outputPreview.innerHTML = '';
        this.outputPreview.appendChild(container);
    }

    downloadSVG() {
        if (!this.currentSVG) {
            alert('Please upload and modify an SVG first.');
            return;
        }

        // Clear any selection before download
        this.clearSelection();

        const width = parseInt(this.outputWidth.value);
        const height = parseInt(this.outputHeight.value);
        const padding = parseInt(this.padding.value);
        const borderRadius = parseInt(this.borderRadius.value);
        const bgColor = this.backgroundColor.value;

        // Create a clean copy of the SVG without any selection artifacts
        // And apply background processing
        const processedSVG = this.processSvgBackground(this.currentSVG);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(processedSVG, 'image/svg+xml');
        const recoloredSvgElement = svgDoc.querySelector('svg');

        // Clean up any selection classes or inline styles from the download copy
        const elements = svgDoc.querySelectorAll('*');
        elements.forEach(el => {
            el.classList.remove('selected-element');
            el.classList.remove('clickable-element');
            if (el.style.outline) {
                el.style.outline = '';
            }
        });

        if (!recoloredSvgElement) {
            alert('Error: Could not parse SVG.');
            return;
        }

        let viewBox = recoloredSvgElement.getAttribute('viewBox');
        if (!viewBox) {
            const svgWidth = recoloredSvgElement.getAttribute('width') || '100';
            const svgHeight = recoloredSvgElement.getAttribute('height') || '100';
            viewBox = `0 0 ${svgWidth} ${svgHeight}`;
        }

        const [, , intrinsicWidth, intrinsicHeight] = viewBox.split(' ').map(Number);
        const availableWidth = width - (padding * 2);
        const availableHeight = height - (padding * 2);

        const scaleToFitWidth = availableWidth / intrinsicWidth;
        const scaleToFitHeight = availableHeight / intrinsicHeight;
        const finalScale = Math.min(scaleToFitWidth, scaleToFitHeight);

        const finalSvgWidth = intrinsicWidth * finalScale;
        const finalSvgHeight = intrinsicHeight * finalScale;

        const svgX = padding + (availableWidth - finalSvgWidth) / 2;
        const svgY = padding + (availableHeight - finalSvgHeight) / 2;

        const finalSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
        <clipPath id="roundedCorners">
            <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" ry="${borderRadius}"/>
        </clipPath>
    </defs>
    <rect width="${width}" height="${height}" fill="${bgColor}" rx="${borderRadius}" ry="${borderRadius}"/>
    <g clip-path="url(#roundedCorners)">
        <svg x="${svgX}" y="${svgY}" width="${finalSvgWidth}" height="${finalSvgHeight}" viewBox="${viewBox}">
            ${recoloredSvgElement.innerHTML}
        </svg>
    </g>
</svg>`;

        const blob = new Blob([finalSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'interactive-recolored-svg.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    reset() {
        this.clearSelection();
        this.originalSVG = null;
        this.currentSVG = null;
        this.selectedElement = null;
        this.selectedColor = null;
        this.elementColors.clear();
        this.currentColors.clear();

        this.originalPreview.innerHTML = '<div class="preview-placeholder">No SVG uploaded</div>';
        this.outputPreview.innerHTML = '<div class="preview-placeholder">Recolored SVG will appear here</div>';
        this.colorStatus.innerHTML = 'Click on an SVG element to start recoloring';

        this.outputWidth.value = '400';
        this.outputHeight.value = '400';
        this.padding.value = '24';
        this.borderRadius.value = '16';
        this.backgroundColor.value = '#EEEEFF';
        this.maintainAspect.value = 'true';

        this.fileInput.value = '';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveSVGRecolorApp();
});