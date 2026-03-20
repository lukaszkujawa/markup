# SVG Rendering

Markup supports inline SVG rendering. Simply use a code block with the `svg` language identifier.

## Basic Circle

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#4CAF50" />
  <text x="50" y="55" text-anchor="middle" fill="white" font-size="12">Hello</text>
</svg>
```

## Rectangle with Gradient

```svg
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="100" fill="url(#grad1)" rx="10" />
  <text x="100" y="55" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Gradient</text>
</svg>
```

## Star Shape

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,10 61,35 87,35 66,52 75,78 50,60 25,78 34,52 13,35 39,35" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
</svg>
```

## Path Drawing

```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z" fill="#FF69B4" stroke="#C71585" stroke-width="2"/>
  <text x="50" y="110" text-anchor="middle" fill="#C71585" font-size="14">Heart</text>
</svg>
```

## Multiple Shapes

```svg
<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="#3F51B5" rx="5" />
  <circle cx="150" cy="50" r="40" fill="#FF5722" />
  <polygon points="240,90 280,90 260,30" fill="#4CAF50" />

  <text x="50" y="110" text-anchor="middle" fill="#3F51B5" font-size="12">Square</text>
  <text x="150" y="110" text-anchor="middle" fill="#FF5722" font-size="12">Circle</text>
  <text x="260" y="110" text-anchor="middle" fill="#4CAF50" font-size="12">Triangle</text>
</svg>
```

## Chart Example

```svg
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="150" width="40" height="50" fill="#2196F3" />
  <rect x="80" y="120" width="40" height="80" fill="#4CAF50" />
  <rect x="140" y="80" width="40" height="120" fill="#FF9800" />
  <rect x="200" y="60" width="40" height="140" fill="#F44336" />
  <rect x="260" y="100" width="40" height="100" fill="#9C27B0" />
  <rect x="320" y="130" width="40" height="70" fill="#00BCD4" />

  <line x1="10" y1="200" x2="390" y2="200" stroke="#000" stroke-width="2"/>
  <line x1="10" y1="10" x2="10" y2="200" stroke="#000" stroke-width="2"/>

  <text x="200" y="20" text-anchor="middle" font-size="14" font-weight="bold">Sales by Month</text>
</svg>
```

## Features

- **Responsive**: SVGs automatically scale to fit the container
- **Secure**: Script tags and event handlers are removed for safety
- **Flexible**: Use any valid SVG markup
- **Styled**: Consistent appearance with other code blocks

## Tips

- Always include `xmlns="http://www.w3.org/2000/svg"` in your SVG
- Use `viewBox` for better responsive behavior
- Gradients and patterns should be defined in `<defs>` section
- Keep your SVG code clean and readable
