# Figma Plugin Development Plan: Instagram Carousel Creator & Previewer

This plugin aims to provide a seamless design and preview experience for creating connected Instagram carousel posts directly inside Figma. It helps designers avoid manual slicing, preview alignment issues, and ensures pixel-perfect exports tailored for Instagram.

---

## 🧱 Phase 1: MVP — Carousel Frame Generator & Exporter

### 🎯 Goal: Let users:
- Choose resolution preset (e.g., 1080×1080)
- Select number of frames (e.g., 5)
- Auto-generate one wide design frame
- Preview frame slices
- Export as separate images

### ✅ Features
- Resolution Presets: Instagram Post, Story, Reel Cover, etc.
- Frame Count Selector: Number of slides (1–10)
- Combined Design Frame Generator
- Named Guide Frames
- Export Slices
- Simple Preview Mode (Horizontal Scroll)

### 📦 Tech Stack
- UI: HTML + CSS + TypeScript (Figma Plugin UI)
- Figma API: createFrame, exportAsync, clientStorage
- Preview Carousel: HTML scroll container

---

## 🔍 Phase 2: Smart Preview System

### 🎯 Goal: 
Give users full clarity on how their carousel will look once posted, avoiding cutoffs, alignment issues, and empty edges.

### ✅ Key Preview Features
- **Live Carousel Swipe Preview**: Simulate swiping behavior with dot indicators.
- **Edge Cutoff Detector**: Warn users of empty or awkward endings.
- **Viewport Previews**: Show slide previews in small/medium/large screen mocks.
- **Overlay Grid/Guides**: Optional toggle for design-safe areas and bleed.
- **Auto Snap Checker**: Warn about partially overlapping or misaligned elements.
- **Zoomable Mini Map View**: Full scrollable map of the full carousel layout.

---

## 🚀 Phase 3: Pro Features (Optional Micro-SaaS)

### 🎯 Goal: 
Add monetizable or team-collaboration features.

- **Cloud Save**: Store layouts using Supabase or Firebase.
- **Team Sharing**: Collaborate on carousels with team members.
- **Premium Templates**: Built-in layouts for quotes, guides, reels, etc.

---

## 🧭 Development Workflow

### Week 1:
- Setup plugin boilerplate
- Implement frame generator UI
- Create frame & slice logic

### Week 2:
- Implement preview carousel
- Add export logic

### Week 3+:
- Smart previews (cutoff checker, viewport simulation)
- Add overlay/grid system
