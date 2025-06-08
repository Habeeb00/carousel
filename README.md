# Instagram Carousel Creator & Previewer

A Figma plugin that helps designers create Instagram carousel posts with proper dimensions and preview capabilities.

## Features

- **Resolution Presets**: Choose from Instagram Post (1080×1080), Story (1080×1920), Portrait (1080×1350), and Landscape (1080×608)
- **Frame Count Selector**: Create up to 10 carousel slides at once
- **Single Canvas Design**: Work on one continuous frame with visual guides for slide boundaries
- **Cross-Slide Content**: Easily place images and elements that span multiple slides
- **Visual Indicators**: Clear slide numbers and boundaries to guide your design
- **Interactive Preview**: Preview how your carousel will look with swipeable slides and dot indicators
- **Export Slides**: Export each slide as a separate image ready for Instagram
- **Existing Frame Support**: Convert any existing frame into a properly formatted carousel
- **Compatibility Checker**: Check if your existing frames are compatible with Instagram formats

## How to Use

### Creating a New Carousel

1. Install the plugin from the Figma Plugin Store
2. Run the plugin from the Plugins menu
3. Choose your desired resolution preset (e.g., 1080×1080 for square posts)
4. Set the number of frames you want in your carousel (1-10)
5. Click "Create Carousel" to generate your carousel frame
6. Design your content across the slides using the visual guides

### Converting an Existing Frame

1. Select a frame in your design
2. Run the plugin and go to the "Use Existing" tab
3. Click "Check Compatibility" to see if your frame can be converted
4. Choose your desired resolution preset
5. Click "Convert to Carousel" to add slide guides to your frame

### Previewing and Exporting

1. Select your carousel frame
2. Click "Preview Carousel" to see how it will appear in Instagram
3. Swipe through the slides in the preview window
4. When finished, click "Export Slides" to prepare for export

## Tips for Designing Carousels

- Keep important content away from the slide boundaries to avoid awkward cuts
- Use the visual guides to ensure content is properly positioned within each slide
- Create visual continuity between slides to encourage users to swipe
- Take advantage of the single canvas to create designs that span multiple slides
- Preview frequently to ensure your design works well when split into slides

## Development

This plugin is built using the Figma Plugin API with TypeScript.

To modify or build from source:

1. Clone this repository
2. Run `npm install` to install dependencies
3. Make your changes to the code
4. Run `npm run build` to compile the TypeScript code
5. Load the plugin in Figma by selecting "Import plugin from manifest..."

## License

MIT License
