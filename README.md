# Meesa — Simple Video Synthesizer

A minimal, ergonomic video synthesizer running in the browser. Inspired by Hydra, but simpler.

## Philosophy

- **Simple**: Minimal API, just enough to make generative visuals
- **Ergonomic**: JavaScript-friendly syntax, no weird DSL
- **Lightweight**: No heavy dependencies, pure WebGL

## Quick Start

```javascript
// Single file usage
import { createMeesa, geo, noise } from './meesa.js';

const m = createMeesa(canvas);

m.render(
  geo.circle(0.3).move(0.2, 0.1).out()
);
```

## Core Concepts

### Sources

Generate visual content.

```javascript
// Geometry
geo.circle(radius, x?, y?)      // Circle, default: center, radius 0.5
geo.rect(width, height, x?, y?) // Rectangle
geo.line(x1, y1, x2, y2)        // Line segment

// Procedural
noise()                         // Fractal noise
gradient()                      // Horizontal gradient

// Media
image(imgOrUrl)                  // Static image
video(url)                      // Video element or URL
```

### Operators

Combine sources with operators.

```javascript
geo.circle(0.3) + noise()       // Additive blend
geo.circle(0.3) * noise()       // Multiply blend
geo.circle(0.3) - noise()       // Difference
geo.circle(0.3) % noise()       // Modulate (Hydra-style blend)
```

### Transforms

Modify source properties.

```javascript
geo.circle(0.3)
  .move(0.2, 0.3)     // Offset position (x, y)
  .scale(1.5)         // Scale uniformly
  .scale(2, 0.5)      // Scale non-uniformly (x, y)
  .rotate(Math.PI / 4) // Rotate by radians
  .repeat(3, 2)       // Tile 3 columns, 2 rows
  .scroll(0.1, 0.05)  // Scroll UV coordinates
```

### Color Adjustments

```javascript
geo.circle(0.3)
  .brightness(1.2)    // Brightness multiplier
  .contrast(1.5)      // Contrast multiplier
  .saturate(0.8)      // Saturation multiplier
  .hue(90)            // Hue shift in degrees
  .invert()           // Invert colors
  .thres(0.5)         // Threshold (hard edge)
  .pixelate(8)        // Pixelate (block size)
```

### Layering

Use `layer()` to composite multiple sources.

```javascript
m.render(
  layer(
    geo.circle(0.4).out(),
    geo.rect(0.2).move(0.3, -0.2).out()
  )
);
```

Layer order matters — later sources are on top.

### Final Output

Every source chain must end with `.out()`.

```javascript
noise().rotate(0.5).out()
```

## API Reference

### `createMeesa(canvas)`

Initialize renderer with a canvas element.

```javascript
const m = createMeesa(document.querySelector('canvas'));
```

### `m.render(source)`

Set the render output.

```javascript
m.render(geo.circle(0.3).out());
```

### `m.play(callback)`

Register a per-frame callback. Receives time and frame count.

```javascript
m.play((t, f) => {
  // t = elapsed time in seconds
  // f = frame count
});
```

### Built-in Time Variables

```javascript
m.play((t, f) => {
  m.render(
    geo.circle(Math.sin(t) * 0.2 + 0.3)
      .move(Math.sin(t) * 0.5, 0)
      .out()
  );
});
```

### `m.width`, `m.height`

Canvas dimensions (read-only).

## Example

### Pulsing Noise

```javascript
import { createMeesa, geo, noise } from './meesa.js';

const canvas = document.querySelector('canvas');
const m = createMeesa(canvas);

m.play((t) => {
  m.render(
    noise()
      .scale(2 + Math.sin(t) * 0.5)
      .rotate(t * 0.2)
      .brightness(0.8 + Math.sin(t * 2) * 0.2)
      .out()
  );
});
```

### Geometric Layers

```javascript
m.render(
  layer(
    geo.rect(0.8, 0.8).rotate(t * 0.1).out(),
    geo.circle(0.4).move(Math.sin(t) * 0.3, 0).out(),
    noise().pixelate(4).out()
  )
);
```

### Image with Effects

```javascript
const img = new Image();
img.src = 'texture.png';
img.onload = () => {
  m.render(
    image(img)
      .contrast(1.5)
      .saturate(0.7)
      .pixelate(4)
      .out()
  );
};
```

## File Structure

```
meesa/
├── meesa.js          # Main library (single file)
├── index.html        # Demo page
└── README.md         # This file
```

## Browser Support

- Modern browsers with WebGL 1.0 support
- Chrome, Firefox, Safari, Edge (latest versions)

## License

MIT
