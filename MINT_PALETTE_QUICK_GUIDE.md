# 🎨 Mint Color Palette - Quick Reference

## Color Variables

```css
--mint-dark: #1f7a6e        /* Primary - Deep Teal */
--mint-darker: #155f56      /* Hover/Active - Darker Teal */
--mint-light: #e6f4f1       /* Soft Background - Light Mint */
--mint-accent: #2fb9a7      /* Highlights - Bright Mint */
--bg-white: #ffffff         /* Background - White */
```

## Usage Statistics
- **Mint Dark** - 161 uses (buttons, links, primary elements)
- **Mint Accent** - 86 uses (gradients, highlights)
- **Mint Darker** - 23 uses (hover, active states)
- **Mint Light** - 1 use (subtle backgrounds)

## Common Usage Patterns

### Buttons
```css
background-color: var(--mint-dark);

&:hover {
  background-color: var(--mint-darker);
}
```

### Gradients
```css
background: linear-gradient(135deg, var(--mint-dark) 0%, var(--mint-accent) 100%);
```

### Borders & Accents
```css
border-color: var(--mint-dark);
box-shadow: 0 4px 12px rgba(31, 122, 110, 0.2);
```

### Text Links
```css
a {
  color: var(--mint-accent);
  
  &:hover {
    color: var(--mint-dark);
  }
}
```

## Design Characteristics

✨ **Elegant** - Conveys professionalism and trustworthiness  
🌿 **Fresh** - Clean, modern appearance  
♿ **Accessible** - High contrast against white background  
🔄 **Consistent** - Same palette used throughout  
🎯 **Professional** - Standard for modern web applications  

## Files Updated
26 CSS files across:
- Authentication (Login, Register)
- Admin Dashboard (2 levels: layout + home)
- Donor Dashboard (5 files)
- Volunteer Dashboard (4 files)
- Receiver Dashboard (6 files)
- Profile & Components

---
**Status**: ✅ Complete - Ready for deployment
