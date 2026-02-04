# Logo Normalizer

A Next.js web application for normalizing and resizing logos to consistent dimensions for use in partner logo sliders and other UI components.

## Features

- **Upload Support**: Drag-and-drop or file picker for PNG, JPEG, WebP, and SVG logos
- **Flexible Resizing**: Choose from multiple fit modes (contain, cover, stretch)
- **Padding & Background**: Add padding and customize background (transparent or solid color)
- **Smart Trimming**: Remove transparent or white margins before resizing with safeguards
- **Enhanced Presets**: Quick buttons for common sizes (120×44 to 320×80)
- **Live Preview**: Real-time preview with server-generated output
- **Multiple Formats**: Output as PNG or WebP
- **Server-side Processing**: Deterministic image processing using Sharp
- **Quality Assurance**: Prevents over-aggressive trimming and pixelation
- **Visual Feedback**: Selected presets are highlighted for better UX

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Image Processing**: Sharp
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3001/tools/logo-normalizer](http://localhost:3001/tools/logo-normalizer) in your browser

> **Note**: Port 3000 may be in use, the app will automatically try port 3001

## Usage

### Basic Workflow

1. **Upload a Logo**: Drag and drop or click to select a logo file (PNG, JPEG, WebP, or SVG)
2. **Configure Settings**:
   - Set target width and height (or use a preset)
   - Choose fit mode (contain preserves aspect ratio, cover fills the slot, stretch forces exact dimensions)
   - Add padding if needed
   - Select background (transparent or custom color)
   - Optionally trim transparent/white margins
3. **Preview**: See the result in the preview area
4. **Download**: Click "Generate & Download" to download the processed image

### Fit Modes

- **Contain** (default): Preserves the logo's aspect ratio and adds padding to fill the target dimensions. Best for most logos.
- **Cover**: Fills the entire target area, cropping the logo if necessary. Use when you want to fill the space completely.
- **Stretch**: Forces the logo to exact dimensions without preserving aspect ratio. Use with caution as it may distort the logo.

### Presets

Quick buttons for common partner logo sizes with visual selection:
- **Small (120×44)**: Compact display
- **Slider (160×48)**: Standard size for partner logo sliders
- **Large (200×56)**: Larger display
- **XLarge (240×64)**: Extra large display
- **2XLarge (280×72)**: Very large display
- **3XLarge (320×80)**: Maximum size for large displays

The selected preset is highlighted in blue for easy identification.

### Trimming

Remove extra whitespace around logos with intelligent safeguards:
- **Transparent trim** (default): Removes transparent areas around the logo
- **White trim**: Removes white areas around the logo (PNG only)

**Smart Trim Features**:
- Conservative thresholds to prevent over-trimming
- 50% reduction limit to maintain logo quality
- Debug logging in development mode
- Only applies trim if it improves the logo size

The trim feature helps logos fill their boxes better while maintaining quality.

## API Endpoints

### POST /api/logo/normalize

Processes and returns a normalized logo image.

**Request**:
```
Content-Type: multipart/form-data

file: <binary image data>
settings: {
  "width": 160,
  "height": 48,
  "fitMode": "contain",
  "padding": 8,
  "background": "transparent",
  "trimMode": "none",
  "outputFormat": "png"
}
```

**Response**:
- Content-Type: image/png or image/webp
- Content-Disposition: attachment; filename="<originalName>__<w>x<h>__<mode>.png"

**Error Response**:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Security

The application includes the following security measures:

- **File Size Limit**: Maximum 5MB per upload
- **MIME Type Validation**: Only accepts image/png, image/jpeg, image/webp, image/svg+xml
- **Dimension Validation**: Rejects images with dimensions exceeding 10,000px
- **In-Memory Processing**: No temporary files written to disk
- **Input Sanitization**: All user inputs are validated before processing

## Configuration

### Environment Variables

Currently, no environment variables are required. The application works out of the box.

**Development Mode**:
- Debug logging is enabled for trim operations
- Detailed Sharp pipeline information is logged
- Resolved settings are displayed in the UI

### Customization

To modify default settings, edit the constants in:
- `app/api/logo/normalize/route.ts` for server-side limits
- `components/SettingsPanel.tsx` for UI presets
- `app/tools/logo-normalizer/page.tsx` for default values

## Building for Production

```bash
pnpm build
pnpm start
```

## Development

### Project Structure

```
logo-normalizer/
├── app/
│   ├── api/
│   │   └── logo/
│   │       └── normalize/
│   │           └── route.ts          # API endpoint for image processing
│   ├── tools/
│   │   └── logo-normalizer/
│   │       └── page.tsx              # Main application page
│   ├── globals.css                   # Global styles
│   └── layout.tsx                    # Root layout
├── components/
│   ├── UploadDropzone.tsx            # File upload component
│   ├── SettingsPanel.tsx             # Settings configuration
│   └── PreviewCanvas.tsx             # Image preview
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

### Adding New Presets

Edit `components/SettingsPanel.tsx` and add to the `PRESETS` array:

```typescript
const PRESETS = [
  { name: 'Slider (160×48)', width: 160, height: 48 },
  { name: 'Small (120×44)', width: 120, height: 44 },
  { name: 'Large (200×56)', width: 200, height: 56 },
  // Add your preset here
  { name: 'Custom (300×100)', width: 300, height: 100 },
]
```

## Recent Improvements

### Output Quality Fixes
- Fixed black strips appearing in contain mode by adding proper background colors to Sharp resize operations
- Implemented smart trim safeguards to prevent over-aggressive trimming
- Added conservative trim thresholds (1 for transparent, 5-15 for white)
- Ensured logos maintain quality suitable for app headers

### Enhanced User Experience
- Added visual selection indicators for presets
- Expanded preset options from 3 to 6 sizes
- Improved error handling and validation
- Better debug information in development mode

### Technical Improvements
- Unified preview and download to use the same server-generated blob
- Fixed Sharp pipeline to handle transparent backgrounds correctly
- Added comprehensive input validation
- Improved memory management for blob URLs

## Troubleshooting

### Black Strips in Output

If you see black strips above or below logos:
1. Ensure the background is set to "transparent" or your desired color
2. The issue has been fixed with proper background handling in Sharp
3. Try regenerating the preview after the fix

### SVG Not Processing Correctly

SVG files are rasterized using Sharp's density setting based on the target dimensions. If the output appears pixelated, the SVG may need to be optimized or have proper viewBox attributes.

### Large File Sizes

The default output format is PNG, which can be larger than WebP. Switch to WebP format in the settings for smaller file sizes while maintaining quality.

### Transparent Background Not Working

Ensure your input image supports transparency (PNG or SVG). JPEG files don't support transparency and will be converted to PNG with a white background by default.

## Integration with Partner Logo Slider

After generating normalized logos, use them in your PartnerLogoSlidingBanner:

```typescript
const partnerLogos = [
  {
    name: 'Partner Name',
    logoSrc: '/partners/partner-logo__160x48__contain.png',
    url: 'https://partner.com',
  },
  // ... more partners
]
```

## License

Internal use only.
