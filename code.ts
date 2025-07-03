// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// Instagram Carousel Creator & Previewer Plugin
// This plugin helps designers create Instagram carousel posts with proper dimensions and preview

// Define types for our messages
interface CarouselMessage {
  type: string;
  resolution?: string;
  frameCount?: number;
}

// Define resolution presets
interface ResolutionPreset {
  width: number;
  height: number;
  name: string;
}

const RESOLUTION_PRESETS: { [key: string]: ResolutionPreset } = {
  '1080x1080': { width: 1080, height: 1080, name: 'Instagram Post (Square)' },
  '1080x1920': { width: 1080, height: 1920, name: 'Instagram Story' },
  '1080x1350': { width: 1080, height: 1350, name: 'Instagram Portrait' },
  '1080x608': { width: 1080, height: 608, name: 'Instagram Landscape' }
};

// Show UI
figma.showUI(__html__, { width: 360, height: 920 });

// Listen for selection changes to update preview
figma.on('selectionchange', () => {
  previewCarousel();
});

// Listen for messages from the UI
figma.ui.onmessage = async (msg: CarouselMessage) => {
  if (msg.type === 'create-carousel') {
    await createCarousel(msg.resolution || '1080x1080', msg.frameCount || 3);
  } else if (msg.type === 'convert-to-carousel') {
    await convertToCarousel(msg.resolution || '1080x1080');
  } else if (msg.type === 'check-compatibility') {
    checkCompatibility();
  } else if (msg.type === 'preview-carousel') {
    await previewCarousel();
  } else if (msg.type === 'export-carousel') {
    await exportCarousel();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Create a carousel with the specified resolution and frame count
async function createCarousel(resolutionKey: string, frameCount: number): Promise<void> {
  try {
    // Load fonts first
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    // Get resolution preset
    const resolution = RESOLUTION_PRESETS[resolutionKey];
    if (!resolution) {
      figma.notify('Invalid resolution preset');
      return;
    }
    
    // Get the viewport center position to create frame where user is looking
    const viewport = figma.viewport.center;
    const zoom = figma.viewport.zoom;
    
    // Create a single parent frame for the entire carousel
    const carouselFrame = figma.createFrame();
    carouselFrame.name = `Instagram Carousel - ${resolution.name}`;
    carouselFrame.resize(resolution.width * frameCount, resolution.height);
    
    // Position the frame at the viewport center
    carouselFrame.x = viewport.x - (carouselFrame.width / 2);
    carouselFrame.y = viewport.y - (carouselFrame.height / 2);
    
    // Add a white background
    carouselFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    // Add metadata to identify this as an Instagram carousel
    carouselFrame.setPluginData('isInstagramCarousel', 'true');
    carouselFrame.setPluginData('carouselResolution', resolutionKey);
    carouselFrame.setPluginData('carouselFrameCount', frameCount.toString());
    carouselFrame.setPluginData('carouselSlideWidth', resolution.width.toString());
    
    // Create a group to hold all visual guidance elements
    const guidanceGroup = figma.createFrame();
    guidanceGroup.name = "Visual Guidance (will not export)";
    guidanceGroup.resize(carouselFrame.width, carouselFrame.height);
    guidanceGroup.fills = [];
    guidanceGroup.setPluginData('isGuidanceLayer', 'true');
    
    // Explicitly set visibility before appending
    guidanceGroup.visible = true;
    
    // Add visual separators and slide indicators
    for (let i = 0; i < frameCount; i++) {
      // Create slide boundary guides
      if (i > 0) {
        // Create a more prominent vertical guide line
        const guideLine = figma.createRectangle();
        guideLine.name = `Guide ${i}`;
        guideLine.x = resolution.width * i - 1; // Center the 2px line on the boundary
        guideLine.y = 0;
        guideLine.resize(2, resolution.height);
        guideLine.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 1 }, opacity: 0.7 }];
        guidanceGroup.appendChild(guideLine);
      }
      
      // Add a slide label at the center of each slide area
      const slideLabel = figma.createText();
      slideLabel.characters = `Slide ${i + 1}`;
      slideLabel.fontSize = 24;
      slideLabel.x = resolution.width * i + resolution.width / 2 - slideLabel.width / 2;
      slideLabel.y = resolution.height / 2 - slideLabel.height / 2;
      slideLabel.name = `Slide ${i + 1} Label`;
      slideLabel.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.3 }];
      guidanceGroup.appendChild(slideLabel);
    }
    
    // Lock the guidance layer to prevent accidental edits
    guidanceGroup.locked = true;
    
    // Set the guidance layer to be expanded by default in the layers panel
    guidanceGroup.expanded = true;
    
    // Append the guidance group to the carousel frame
    carouselFrame.appendChild(guidanceGroup);
    
    // Set visibility again after appending and ensure it's expanded in the layers panel
    guidanceGroup.visible = true;
    guidanceGroup.expanded = true;
    
    // Make sure all children of the guidance group are visible
    if (guidanceGroup.children) {
      for (const child of guidanceGroup.children) {
        child.visible = true;
      }
    }
    
    // Select the carousel frame
    figma.currentPage.selection = [carouselFrame];
    
    // Zoom to fit the new frame
    figma.viewport.scrollAndZoomIntoView([carouselFrame]);
    
    // Send preview update to UI
    await sendPreviewUpdate(carouselFrame);
    
    // Final verification after a short delay to ensure UI has updated
    setTimeout(() => {
      try {
        guidanceGroup.visible = true;
        // Also ensure all children are visible
        if (guidanceGroup.children) {
          for (const child of guidanceGroup.children) {
            child.visible = true;
          }
        }
      } catch (error) {
        console.error("Error in visibility timeout:", error);
      }
    }, 100);
    
    // Additional verification with a longer delay
    setTimeout(() => {
      try {
        const guidanceLayers = carouselFrame.findAll(node => {
          try {
            return node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true';
          } catch (e) {
            return false;
          }
        });
        
        for (const layer of guidanceLayers) {
          layer.visible = true;
          // Also ensure all children are visible
          if ('children' in layer) {
            const guidanceFrame = layer as FrameNode;
            for (const child of guidanceFrame.children) {
              child.visible = true;
            }
          }
        }
      } catch (error) {
        console.error("Error in second visibility timeout:", error);
      }
    }, 500);
    
    figma.notify(`Created Instagram carousel with ${frameCount} slides`);
  } catch (error) {
    figma.notify(`Error: ${error}`);
  }
}

// Convert an existing frame to carousel
async function convertToCarousel(resolutionKey: string): Promise<void> {
  try {
    // Check if a frame is selected
    const selection = figma.currentPage.selection;
    
    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
      figma.notify('Please select a single frame to convert to a carousel');
      return;
    }
    
    let selectedFrame = selection[0] as FrameNode;
    const frameId = selectedFrame.id; // Store the ID for later reference
    
    const resolution = RESOLUTION_PRESETS[resolutionKey];
    
    if (!resolution) {
      figma.notify('Invalid resolution preset');
      return;
    }
    
    // Check if this is already a carousel - use try/catch to handle potential errors
    let isAlreadyCarousel = false;
    try {
      isAlreadyCarousel = selectedFrame.getPluginData('isInstagramCarousel') === 'true';
    } catch (error) {
      console.error("Error checking if frame is carousel:", error);
      // Continue with conversion as if it's not a carousel
    }
    
    if (isAlreadyCarousel) {
      figma.notify('This is already an Instagram carousel. Updating guides...');
      // Just update the guides in this case rather than showing an error
    }
    
    // Calculate how many complete slides we can create from this frame
    const frameWidth = selectedFrame.width;
    let slideCount = Math.floor(frameWidth / resolution.width);
    
    // If there's a partial slide at the end (frame width is not a multiple of slide width)
    const remainingWidth = frameWidth % resolution.width;
    let hasPartialSlide = remainingWidth > 0;
    
    // If the frame is too small for even one slide of the selected resolution
    if (frameWidth < resolution.width) {
      // Resize the frame to fit exactly one slide
      selectedFrame.resize(resolution.width, selectedFrame.height);
      figma.notify(`Frame was too small - resized to fit one ${resolution.name} slide`);
      slideCount = 1;
      hasPartialSlide = false;
    } else if (hasPartialSlide) {
      // We have a partial slide at the end - ask user if they want to:
      // 1. Expand the frame to make the partial slide a full slide
      // 2. Trim the frame to remove the partial slide
      // 3. Keep the partial slide as is (but warn that it will be cut off)
      const partialSlideAction = await new Promise<string>((resolve) => {
        figma.ui.postMessage({
          type: 'handle-partial-slide',
          message: `Your frame has ${slideCount} full slides and a partial slide (${Math.round(remainingWidth)}px of ${resolution.width}px). What would you like to do?`,
          remainingWidth: remainingWidth,
          slideWidth: resolution.width
        });
        
        // Set up a one-time listener for the response
        const listener = (msg: any) => {
          if (msg.type === 'partial-slide-response') {
            figma.ui.off('message', listener);
            resolve(msg.action);
          }
        };
        
        figma.ui.on('message', listener);
      });
      
      if (partialSlideAction === 'expand') {
        // Expand the frame to make the partial slide a full slide
        selectedFrame.resize(resolution.width * (slideCount + 1), selectedFrame.height);
        figma.notify(`Frame expanded to fit ${slideCount + 1} full slides`);
        slideCount++;
        hasPartialSlide = false;
      } else if (partialSlideAction === 'trim') {
        // Trim the frame to remove the partial slide
        selectedFrame.resize(resolution.width * slideCount, selectedFrame.height);
        figma.notify(`Frame trimmed to fit ${slideCount} full slides`);
        hasPartialSlide = false;
      } else {
        // Keep the partial slide as is, but it will be cut off at the boundary
        figma.notify(`Keeping partial slide - content beyond ${slideCount * resolution.width}px will be cut off during export`, { timeout: 5000 });
        // We'll still add a guide at the exact boundary
      }
    }
    
    // Check if the frame dimensions match the selected resolution height
    if (selectedFrame.height !== resolution.height) {
      // Ask if we should adjust the frame height
      const shouldResize = await new Promise<boolean>((resolve) => {
        figma.ui.postMessage({
          type: 'confirm-resize',
          message: `The frame height (${Math.round(selectedFrame.height)}px) doesn't match the ${resolution.name} format (${resolution.height}px). Would you like to adjust it?`,
          currentHeight: selectedFrame.height,
          targetHeight: resolution.height
        });
        
        // Set up a one-time listener for the response
        const listener = (msg: any) => {
          if (msg.type === 'resize-response') {
            figma.ui.off('message', listener);
            resolve(msg.shouldResize);
          }
        };
        
        figma.ui.on('message', listener);
      });
      
      if (shouldResize) {
        // Resize the frame height to match the resolution
        selectedFrame.resize(selectedFrame.width, resolution.height);
        figma.notify(`Adjusted frame height to match ${resolution.name} format`);
      } else {
        // Use custom height but warn the user
        figma.notify(`Using custom height (${Math.round(selectedFrame.height)}px) instead of standard ${resolution.name} height (${resolution.height}px)`);
      }
    }
    
    // Preserve existing content
    const existingChildren = [...selectedFrame.children];
    
    // Rename the frame to indicate it's an Instagram carousel
    selectedFrame.name = `Instagram Carousel - ${resolution.name}`;
    
    // Add metadata to identify this as an Instagram carousel - use try/catch for safety
    try {
      selectedFrame.setPluginData('isInstagramCarousel', 'true');
      selectedFrame.setPluginData('carouselResolution', resolutionKey);
      selectedFrame.setPluginData('carouselFrameCount', slideCount.toString());
      selectedFrame.setPluginData('carouselSlideWidth', resolution.width.toString());
    } catch (error) {
      console.error("Error setting plugin data:", error);
      figma.notify('Warning: Could not set carousel metadata. Some features may not work correctly.');
    }
    
    // Remove any existing guidance group - use try/catch for safety
    try {
      const existingGuidanceGroups = selectedFrame.findAll(node => {
        try {
          return node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true';
        } catch (e) {
          return false;
        }
      });
      
      for (const group of existingGuidanceGroups) {
        group.remove();
      }
    } catch (error) {
      console.error("Error removing existing guidance groups:", error);
    }
    
    // Create a new guidance group
    const guidanceGroup = figma.createFrame();
    guidanceGroup.name = "Visual Guidance (will not export)";
    guidanceGroup.resize(selectedFrame.width, selectedFrame.height);
    guidanceGroup.fills = [];
    
    // Set plugin data with try/catch
    try {
      guidanceGroup.setPluginData('isGuidanceLayer', 'true');
    } catch (error) {
      console.error("Error setting guidance layer plugin data:", error);
    }
    
    // Explicitly set visibility before appending
    guidanceGroup.visible = true;
    
    // Add visual separators and slide indicators
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    // Calculate total number of guides needed (including for partial slide)
    const totalGuides = hasPartialSlide ? slideCount + 1 : slideCount;
    
    for (let i = 0; i < totalGuides; i++) {
      // Create slide boundary guides (for all full slides and the partial slide if it exists)
      if (i > 0 && i <= slideCount) {
        // Create a more prominent vertical guide line
        const guideLine = figma.createRectangle();
        guideLine.name = `Guide ${i}`;
        guideLine.x = resolution.width * i - 1; // Center the 2px line on the boundary
        guideLine.y = 0;
        guideLine.resize(2, selectedFrame.height);
        guideLine.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 1 }, opacity: 0.7 }];
        guidanceGroup.appendChild(guideLine);
      }
      
      // Only add slide labels for complete slides
      if (i < slideCount) {
        // Add a slide label at the center of each slide area
        const slideLabel = figma.createText();
        slideLabel.characters = `Slide ${i + 1}`;
        slideLabel.fontSize = 24;
        slideLabel.x = resolution.width * i + resolution.width / 2 - slideLabel.width / 2;
        slideLabel.y = selectedFrame.height / 2 - slideLabel.height / 2;
        slideLabel.name = `Slide ${i + 1} Label`;
        slideLabel.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.3 }];
        guidanceGroup.appendChild(slideLabel);
      }
    }
    
    // If there's a partial slide, add a warning label
    if (hasPartialSlide) {
      const warningLabel = figma.createText();
      warningLabel.characters = `Partial slide\n(will be cut off)`;
      warningLabel.fontSize = 16;
      warningLabel.textAlignHorizontal = 'CENTER';
      warningLabel.x = resolution.width * slideCount + remainingWidth / 2 - warningLabel.width / 2;
      warningLabel.y = selectedFrame.height / 2 - warningLabel.height / 2;
      warningLabel.name = `Partial Slide Warning`;
      warningLabel.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.2, b: 0.2 }, opacity: 0.7 }];
      guidanceGroup.appendChild(warningLabel);
    }
    
    // Lock the guidance layer to prevent accidental edits
    guidanceGroup.locked = true;
    
    // Set the guidance layer to be expanded by default in the layers panel
    guidanceGroup.expanded = true;
    
    // Verify the frame still exists before appending and updating UI
    let frameStillExists = false;
    try {
      // Try to access a property to see if the node still exists
      const _ = selectedFrame.width;
      frameStillExists = true;
    } catch (error) {
      console.error("Frame no longer exists:", error);
    }
    
    if (!frameStillExists) {
      // Try to find the frame by ID
      const frameById = figma.getNodeById(frameId);
      if (frameById && frameById.type === 'FRAME') {
        // Use the found frame instead
        selectedFrame = frameById as FrameNode;
        frameStillExists = true;
      }
    }
    
    if (frameStillExists) {
      // Append the guidance group to the selected frame
      selectedFrame.appendChild(guidanceGroup);
      
      // Set visibility again after appending
      guidanceGroup.visible = true;
      
      // Make sure all children of the guidance group are visible
      if (guidanceGroup.children) {
        for (const child of guidanceGroup.children) {
          child.visible = true;
        }
      }
      
      // Select the carousel frame to ensure it stays selected
      figma.currentPage.selection = [selectedFrame];
      
      // Zoom to fit the new frame
      figma.viewport.scrollAndZoomIntoView([selectedFrame]);
      
      // Send preview update to UI with try/catch
      try {
        await sendPreviewUpdate(selectedFrame);
      } catch (error) {
        console.error("Error sending preview update:", error);
        figma.notify('Preview update failed, but carousel was created successfully.');
      }
      
      // Final verification after a short delay to ensure UI has updated
      setTimeout(() => {
        try {
          guidanceGroup.visible = true;
          // Also ensure all children are visible
          if (guidanceGroup.children) {
            for (const child of guidanceGroup.children) {
              child.visible = true;
            }
          }
        } catch (error) {
          console.error("Error in visibility timeout:", error);
        }
      }, 100);
      
      // Additional verification with a longer delay
      setTimeout(() => {
        try {
          const guidanceLayers = selectedFrame.findAll(node => {
            try {
              return node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true';
            } catch (e) {
              return false;
            }
          });
          
          for (const layer of guidanceLayers) {
            layer.visible = true;
            // Also ensure all children are visible
            if ('children' in layer) {
              const guidanceFrame = layer as FrameNode;
              for (const child of guidanceFrame.children) {
                child.visible = true;
              }
            }
          }
        } catch (error) {
          console.error("Error in second visibility timeout:", error);
        }
      }, 500);
      
      figma.notify(`Converted frame to Instagram carousel with ${slideCount} slides`);
    } else {
      figma.notify('Error: Lost reference to the frame during conversion.');
    }
  } catch (error) {
    console.error("Conversion error:", error);
    figma.notify(`Error: ${error}`);
  }
}

// Check if the selected frame is compatible for conversion
function checkCompatibility(): void {
  try {
    const selection = figma.currentPage.selection;
    
    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
      figma.ui.postMessage({
        type: 'compatibility-result',
        message: 'Please select a single frame to check compatibility'
      });
      return;
    }
    
    const selectedFrame = selection[0] as FrameNode;
    
    // Check if this is already a carousel
    if (selectedFrame.getPluginData('isInstagramCarousel') === 'true') {
      const resKey = selectedFrame.getPluginData('carouselResolution');
      const frameCount = selectedFrame.getPluginData('carouselFrameCount');
      const resolution = RESOLUTION_PRESETS[resKey];
      
      figma.ui.postMessage({
        type: 'compatibility-result',
        message: `This is already an Instagram carousel with ${frameCount} slides in ${resolution?.name || 'custom'} format.`
      });
      return;
    }
    
    // Check dimensions
    let matchedPreset = '';
    let slideCount = 0;
    
    for (const [key, preset] of Object.entries(RESOLUTION_PRESETS)) {
      if (selectedFrame.height === preset.height) {
        const possibleSlides = Math.floor(selectedFrame.width / preset.width);
        if (possibleSlides >= 1) {
          matchedPreset = key;
          slideCount = possibleSlides;
          break;
        }
      }
    }
    
    if (matchedPreset) {
      const preset = RESOLUTION_PRESETS[matchedPreset];
      figma.ui.postMessage({
        type: 'compatibility-result',
        message: `Frame is compatible! Can be converted to ${slideCount} slides in ${preset.name} format (${preset.width}×${preset.height}).`
      });
    } else {
      // Find closest preset
      let closestPreset = '';
      let minDifference = Infinity;
      
      for (const [key, preset] of Object.entries(RESOLUTION_PRESETS)) {
        const difference = Math.abs(selectedFrame.height - preset.height);
        if (difference < minDifference) {
          minDifference = difference;
          closestPreset = key;
        }
      }
      
      const preset = RESOLUTION_PRESETS[closestPreset];
      figma.ui.postMessage({
        type: 'compatibility-result',
        message: `Frame is not compatible with Instagram formats. Closest match is ${preset.name} (${preset.width}×${preset.height}). The frame height will be adjusted during conversion.`
      });
    }
  } catch (error) {
    figma.notify(`Error: ${error}`);
  }
}

// Preview the carousel in the UI
async function previewCarousel(): Promise<void> {
  try {
    // Find the carousel frame
    const selection = figma.currentPage.selection;
    
    if (selection.length !== 1) {
      // Send message that no carousel is selected
      figma.ui.postMessage({
        type: 'no-carousel-selected'
      });
      return;
    }
    
    const selectedNode = selection[0];
    
    // Check if this is a carousel frame
    if (selectedNode.type === 'FRAME') {
      const frame = selectedNode as FrameNode;
      
      // Show loading state
      figma.ui.postMessage({
        type: 'preview-loading',
        message: 'Generating preview...'
      });
      
      // If this is an Instagram carousel we created
      if (frame.getPluginData('isInstagramCarousel') === 'true') {
        await sendPreviewUpdate(frame);
      } else {
        // Try to generate a preview for any frame
        await generatePreviewForRegularFrame(frame);
      }
    } else {
      // Send message that no carousel is selected
      figma.ui.postMessage({
        type: 'no-carousel-selected'
      });
    }
  } catch (error) {
    console.error(`Preview error: ${error}`);
    // Send message that no carousel is selected
    figma.ui.postMessage({
      type: 'no-carousel-selected'
    });
  }
}

// Generate preview for any frame, not just carousel frames
async function generatePreviewForRegularFrame(frame: FrameNode): Promise<void> {
  try {
    // Use an even smaller scale for better performance
    const exportSettings: ExportSettingsImage = {
      format: 'PNG',
      constraint: { type: 'SCALE', value: 0.25 } // Use 25% scale for better performance
    };
    
    // Get image data
    const imageData = await frame.exportAsync(exportSettings);
    
    // Convert to base64
    const base64String = figma.base64Encode(imageData);
    const dataUrl = `data:image/png;base64,${base64String}`;
    
    // Determine the best matching resolution preset based on aspect ratio
    let bestMatchResolution = '1080x1080'; // Default to square
    const frameAspectRatio = frame.width / frame.height;
    
    if (frameAspectRatio > 1.7) { // Landscape (close to 16:9)
      bestMatchResolution = '1080x608';
    } else if (frameAspectRatio < 0.6) { // Portrait/Story (close to 9:16)
      bestMatchResolution = '1080x1920';
    } else if (frameAspectRatio < 0.85) { // Portrait (close to 4:5)
      bestMatchResolution = '1080x1350';
    }
    
    // Determine how many slides this could be if converted
    const resolution = RESOLUTION_PRESETS[bestMatchResolution];
    const possibleSlideCount = Math.max(1, Math.floor(frame.width / resolution.width));
    
    // Send preview update to UI
    figma.ui.postMessage({
      type: 'preview-update',
      frameCount: 1, // Just show as one slide for now
      imageDataUrls: [dataUrl],
      resolution: {
        width: frame.width,
        height: frame.height,
        name: `Frame (${Math.round(frame.width)}×${Math.round(frame.height)})`
      },
      frameName: frame.name,
      isRegularFrame: true,
      possibleSlideCount: possibleSlideCount,
      bestMatchResolution: bestMatchResolution
    });
    
  } catch (error) {
    console.error(`Error generating preview for regular frame: ${error}`);
    figma.ui.postMessage({
      type: 'no-carousel-selected'
    });
  }
}

// Send preview update to UI with image data URLs
async function sendPreviewUpdate(carouselFrame: FrameNode): Promise<void> {
  try {
    // Check if the frame still exists by trying to access a property
    try {
      const _ = carouselFrame.width;
    } catch (error) {
      console.error("Frame no longer exists in sendPreviewUpdate:", error);
      figma.notify('Preview failed: Frame reference is no longer valid');
      return;
    }
    
    // Check if this is a carousel - use try/catch for safety
    let isCarousel = false;
    try {
      isCarousel = carouselFrame.getPluginData('isInstagramCarousel') === 'true';
    } catch (error) {
      console.error("Error checking if frame is carousel in preview:", error);
      figma.notify('Preview failed: Cannot access frame metadata');
      return;
    }
    
    if (!isCarousel) {
      figma.notify('Selected frame is not an Instagram carousel');
      return;
    }
    
    // Get carousel metadata with try/catch for each property
    let frameCount = 0;
    let slideWidth = 0;
    let resolutionKey = '';
    
    try {
      frameCount = parseInt(carouselFrame.getPluginData('carouselFrameCount') || '0', 10);
    } catch (error) {
      console.error("Error getting frameCount:", error);
    }
    
    try {
      slideWidth = parseInt(carouselFrame.getPluginData('carouselSlideWidth') || '0', 10);
    } catch (error) {
      console.error("Error getting slideWidth:", error);
    }
    
    try {
      resolutionKey = carouselFrame.getPluginData('carouselResolution');
    } catch (error) {
      console.error("Error getting resolutionKey:", error);
    }
    
    const resolution = RESOLUTION_PRESETS[resolutionKey];
    
    if (frameCount <= 0 || slideWidth <= 0) {
      figma.notify('Invalid carousel metadata');
      return;
    }
    
    // Find and hide all guidance elements - use try/catch for safety
    let guidanceFrames: SceneNode[] = [];
    let guideElements: SceneNode[] = [];
    
    try {
      // 1. Find the dedicated guidance layer
      guidanceFrames = carouselFrame.findAll(node => {
        try {
          return node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true';
        } catch (e) {
          return false;
        }
      });
    } catch (error) {
      console.error("Error finding guidance frames:", error);
    }
    
    try {
      // 2. Find any other guide-like elements (lines, rectangles with specific names)
      guideElements = carouselFrame.findAll(node => {
        try {
          // Check if the node name contains guide-related keywords
          const nameLower = node.name.toLowerCase();
          const isGuide = nameLower.includes('guide') || 
                          nameLower.includes('grid') || 
                          nameLower.includes('line') ||
                          nameLower.includes('slide') && nameLower.includes('boundary');
          
          // Check if it's a thin line or rectangle that might be a guide
          const isVisualGuide = 
            (node.type === 'LINE') ||
            (node.type === 'RECTANGLE' && 
             (node.width <= 2 || node.height <= 2) && // Thin rectangle
             node.fills && 
             Array.isArray(node.fills) && 
             node.fills.length > 0 && 
             node.fills[0].type === 'SOLID' && 
             'opacity' in node.fills[0] && 
             node.fills[0].opacity < 1); // Semi-transparent
          
          return isGuide || isVisualGuide;
        } catch (e) {
          return false;
        }
      });
    } catch (error) {
      console.error("Error finding guide elements:", error);
    }
    
    // Combine all guide elements
    const allGuideElements = [...guidanceFrames, ...guideElements];
    
    // Store original visibility to restore later
    const originalVisibility = new Map<SceneNode, boolean>();
    
    // Hide all guide elements with try/catch for safety
    for (const element of allGuideElements) {
      try {
        originalVisibility.set(element, element.visible);
        element.visible = false;
      } catch (error) {
        console.error("Error setting visibility:", error);
      }
    }
    
    // Use an even lower scale for better performance
    // Scale dynamically based on frame count - more slides = lower resolution
    const baseScale = 0.25; // 25% of original size
    const previewScale = Math.min(baseScale, baseScale * (10 / Math.max(frameCount, 10))); // Reduce scale for many slides
    
    // Send metadata first to allow UI to prepare
    figma.ui.postMessage({
      type: 'preview-metadata',
      frameCount: frameCount,
      resolution: resolution ? {
        width: resolution.width,
        height: resolution.height,
        name: resolution.name
      } : null,
      frameName: carouselFrame.name
    });
    
    // Prioritize visible slides first (current slide + neighbors)
    const processingOrder = [];
    
    // Get the current slide from the UI if available
    let currentSlide = 0;
    try {
      // Request current slide from UI
      figma.ui.postMessage({ type: 'request-current-slide' });
      
      // Wait for response with a timeout
      const currentSlideResponse = await Promise.race([
        new Promise<number>((resolve) => {
          const handler = (msg: any) => {
            if (msg.type === 'current-slide-response') {
              figma.ui.off('message', handler);
              resolve(msg.currentSlide || 0);
            }
          };
          figma.ui.on('message', handler);
        }),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 100)) // Timeout after 100ms
      ]);
      
      currentSlide = typeof currentSlideResponse === 'number' ? currentSlideResponse : 0;
    } catch (e) {
      currentSlide = 0;
    }
    
    // Create processing order: current slide, neighbors, then others
    processingOrder.push(currentSlide); // Current slide first
    
    // Add neighbors
    const neighborsAdded = new Set([currentSlide]);
    for (let distance = 1; distance <= Math.min(2, Math.floor(frameCount / 2)); distance++) {
      // Add next slide
      const nextSlide = currentSlide + distance;
      if (nextSlide < frameCount && !neighborsAdded.has(nextSlide)) {
        processingOrder.push(nextSlide);
        neighborsAdded.add(nextSlide);
      }
      
      // Add previous slide
      const prevSlide = currentSlide - distance;
      if (prevSlide >= 0 && !neighborsAdded.has(prevSlide)) {
        processingOrder.push(prevSlide);
        neighborsAdded.add(prevSlide);
      }
    }
    
    // Add remaining slides
    for (let i = 0; i < frameCount; i++) {
      if (!neighborsAdded.has(i)) {
        processingOrder.push(i);
      }
    }
    
    // Process slides in optimized order, but in batches
    const batchSize = 2;
    
    for (let batchIndex = 0; batchIndex < Math.ceil(processingOrder.length / batchSize); batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min((batchIndex + 1) * batchSize, processingOrder.length);
      
      const batchUrls: string[] = [];
      const batchIndices: number[] = [];
      
      // Process this batch
      const batchPromises = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        const slideIndex = processingOrder[i];
        batchPromises.push(generateSlidePreview(carouselFrame, slideIndex, slideWidth, previewScale));
      }
      
      // Wait for all slides in this batch to complete
      const results = await Promise.all(batchPromises);
      
      // Collect results
      for (let i = 0; i < results.length; i++) {
        const slideIndex = processingOrder[batchStart + i];
        batchUrls.push(results[i]);
        batchIndices.push(slideIndex);
      }
      
      // Send this batch to the UI
      figma.ui.postMessage({
        type: 'preview-batch',
        imageDataUrls: batchUrls,
        indices: batchIndices
      });
      
      // Small delay to allow UI to process
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Restore original visibility of all guide elements and force guidance layer to be visible
    for (const [element, wasVisible] of originalVisibility.entries()) {
      try {
        // Always make guidance layers visible regardless of previous state
        if (element.getPluginData('isGuidanceLayer') === 'true') {
          element.visible = true;
        } else {
          // Restore original visibility for other elements
          element.visible = wasVisible;
        }
      } catch (error) {
        // Node might no longer exist, just continue
        console.error("Error restoring visibility:", error);
      }
    }
    
    // Find the main guidance layer again and ensure it's visible
    try {
      const mainGuidanceLayers = carouselFrame.findAll(node => {
        try {
          return node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true';
        } catch (e) {
          return false;
        }
      });
      
      for (const layer of mainGuidanceLayers) {
        try {
          layer.visible = true;
          // Also ensure all children are visible
          if ('children' in layer) {
            const guidanceFrame = layer as FrameNode;
            for (const child of guidanceFrame.children) {
              child.visible = true;
            }
          }
        } catch (error) {
          console.error("Error setting main guidance layer visibility:", error);
        }
      }
    } catch (error) {
      console.error("Error finding main guidance layers:", error);
    }
    
    // Send completion message
    figma.ui.postMessage({
      type: 'preview-complete'
    });
    
    // Final verification after a short delay
    setTimeout(() => {
      try {
        const guidanceLayers = carouselFrame.findAll(node => {
          try {
            return node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true';
          } catch (e) {
            return false;
          }
        });
        
        for (const layer of guidanceLayers) {
          layer.visible = true;
          // Also ensure all children are visible
          if ('children' in layer) {
            const guidanceFrame = layer as FrameNode;
            for (const child of guidanceFrame.children) {
              child.visible = true;
            }
          }
        }
      } catch (error) {
        console.error("Error in final visibility timeout:", error);
      }
    }, 300);
    
    figma.notify('Preview updated in the plugin UI');
  } catch (error) {
    console.error("Preview error:", error);
    figma.notify(`Error generating preview: ${error}`);
  }
}

// Helper function to generate a single slide preview
async function generateSlidePreview(
  carouselFrame: FrameNode, 
  slideIndex: number, 
  slideWidth: number, 
  scale: number
): Promise<string> {
  try {
    // Create a temporary slice to export just this section
    const slice = figma.createSlice();
    slice.x = carouselFrame.x + (slideIndex * slideWidth);
    slice.y = carouselFrame.y;
    slice.resize(slideWidth, carouselFrame.height);
    
    // Create export settings with reduced scale
    const exportSettings: ExportSettingsImage = {
      format: 'PNG',
      constraint: { type: 'SCALE', value: scale }
    };
    
    // Get image data
    const imageData = await slice.exportAsync(exportSettings);
    
    // Convert to base64
    const base64String = figma.base64Encode(imageData);
    const dataUrl = `data:image/png;base64,${base64String}`;
    
    // Remove the temporary slice
    slice.remove();
    
    return dataUrl;
  } catch (exportError) {
    console.error(`Error exporting slide ${slideIndex}: ${exportError}`);
    // Return empty string for failed exports
    return '';
  }
}

// Export the carousel slides as separate images
async function exportCarousel(): Promise<void> {
  try {
    // Find the carousel frame
    const selection = figma.currentPage.selection;
    
    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
      figma.notify('Please select a carousel frame to export');
      return;
    }
    
    const carouselFrame = selection[0] as FrameNode;
    
    // Check if this is a carousel
    if (carouselFrame.getPluginData('isInstagramCarousel') !== 'true') {
      figma.notify('Selected frame is not an Instagram carousel');
      return;
    }
    
    // Get carousel metadata
    const frameCount = parseInt(carouselFrame.getPluginData('carouselFrameCount') || '0', 10);
    const slideWidth = parseInt(carouselFrame.getPluginData('carouselSlideWidth') || '0', 10);
    
    if (frameCount <= 0 || slideWidth <= 0) {
      figma.notify('Invalid carousel metadata');
      return;
    }
    
    // Find and hide guidance layers for export
    const guidanceLayers = carouselFrame.findAll(node => 
      node.type === "FRAME" && node.getPluginData('isGuidanceLayer') === 'true'
    );
    
    // Hide guidance layers for export
    for (const layer of guidanceLayers) {
      layer.visible = false;
    }
    
    // Create slices for each slide
    const slices: SliceNode[] = [];
    
    for (let i = 0; i < frameCount; i++) {
      const slice = figma.createSlice();
      slice.name = `Slide ${i + 1}`;
      slice.x = carouselFrame.x + (i * slideWidth);
      slice.y = carouselFrame.y;
      slice.resize(slideWidth, carouselFrame.height);
      
      // Add export settings
      slice.exportSettings = [{
        format: 'PNG',
        constraint: { type: 'SCALE', value: 1 }
      }];
      
      slices.push(slice);
    }
    
    // Select all slices for export
    figma.currentPage.selection = slices;
    
    figma.notify(`Ready to export ${frameCount} slides. Use File > Export to save the images.`);
    
    // Show guidance layers again after a short delay
    setTimeout(() => {
      for (const layer of guidanceLayers) {
        layer.visible = true;
      }
    }, 1000);
  } catch (error) {
    figma.notify(`Error: ${error}`);
  }
}
