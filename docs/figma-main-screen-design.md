# LexiSearch — Main Screen (Figma Design Spec)

**Figma file:** [LexiSearch - Main Screen](https://www.figma.com/design/nilvHdWHgr8xhXDaac3aFu)

**Screen source:** `src/screens/SearchScreen.js`  
**Frame size:** 390 × 844 px (mobile portrait)

---

## Design tokens (from app code)

| Token | Hex | Usage |
|-------|-----|--------|
| Primary | `#1A73E8` | Header, search button |
| Primary Dark | `#0D47A1` | Hero title |
| Primary Light | `#E8F0FE` | Tip chips background |
| Background | `#F8F9FF` | Screen background |
| Surface | `#FFFFFF` | Search card |
| Text | `#1C1C1E` | Input text |
| Text Secondary | `#6E6E73` | Labels, subtitle |
| Input Border | `#DADCE0` | Search field border |
| Placeholder | `#ABABAB` | Input placeholder |
| Chip Border | `#C5D8FB` | Tip chip outline |

---

## Screen structure

```
LexiSearch / Search Screen (390×844)
├── Status Bar (44h, primary blue)
│   └── Time "9:41"
├── Header (primary blue, px 20, pb 14)
│   ├── Menu icon (3 white lines)
│   ├── Title "LexiSearch" (20px Extra Bold, white)
│   └── Spacer (32×32)
└── Body Content (px 20, pt 24, gap 28)
    ├── Hero Section
    │   ├── Book emoji 📖 (52px)
    │   ├── "Dictionary" (30px Extra Bold, primary dark)
    │   └── Subtitle (14px Regular, centered, 2 lines)
    ├── Search Card (white, radius 20, padding 20, shadow)
    │   ├── Label "SEARCH FOR A WORD" (13px Semi Bold, uppercase)
    │   ├── Input row (radius 14, border 1.5, bg #FAFAFA)
    │   │   ├── 🔍 icon
    │   │   └── Placeholder "e.g. serendipity, eloquent..."
    │   └── Search button (primary blue, radius 14, py 15)
    └── Quick Tips
        ├── Label "QUICK TIPS" (12px Semi Bold, uppercase)
        └── Chips row (wrap)
            ├── 💡 Try "ephemeral"
            ├── 📚 Try "ubiquitous"
            └── 🌟 Try "serendipity"
```

---

## Spacing & typography

| Element | Size / spacing |
|---------|----------------|
| Screen horizontal padding | 20px |
| Hero bottom margin | 28px |
| Search card corner radius | 20px |
| Search card padding | 20px |
| Input corner radius | 14px |
| Input padding | 14px horizontal |
| Search button corner radius | 14px |
| Search button vertical padding | 15px |
| Tip chip corner radius | 20px |
| Tip chip padding | 8px vertical, 14px horizontal |
| Card shadow | y:4, blur:12, opacity 8% |

---

## Figma build scripts

When Figma MCP limits reset, run these `use_figma` scripts against file key `nilvHdWHgr8xhXDaac3aFu` in order.

### Script 1 — Phone frame + header

```javascript
const hex = (h) => {
  const n = h.replace('#', '');
  return { r: parseInt(n.slice(0,2),16)/255, g: parseInt(n.slice(2,4),16)/255, b: parseInt(n.slice(4,6),16)/255 };
};
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Extra Bold' }),
]);
const createdNodeIds = [];
let maxX = 0;
for (const child of figma.currentPage.children) maxX = Math.max(maxX, child.x + child.width);

const screen = figma.createAutoLayout('VERTICAL', { name: 'LexiSearch / Search Screen', itemSpacing: 0 });
screen.resize(390, 844);
screen.x = maxX + 200;
screen.clipsContent = true;
screen.layoutSizingHorizontal = 'FIXED';
screen.layoutSizingVertical = 'FIXED';
screen.fills = [{ type: 'SOLID', color: hex('#F8F9FF') }];
figma.currentPage.appendChild(screen);
createdNodeIds.push(screen.id);

const statusBar = figma.createAutoLayout('HORIZONTAL', { name: 'Status Bar', paddingLeft: 24, paddingRight: 24, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
statusBar.resize(390, 44);
statusBar.fills = [{ type: 'SOLID', color: hex('#1A73E8') }];
screen.appendChild(statusBar);
statusBar.layoutSizingHorizontal = 'FILL';
const timeText = figma.createText();
timeText.characters = '9:41';
timeText.fontSize = 15;
timeText.fontName = { family: 'Inter', style: 'Semi Bold' };
timeText.fills = [{ type: 'SOLID', color: { r:1,g:1,b:1 } }];
statusBar.appendChild(timeText);
createdNodeIds.push(statusBar.id, timeText.id);

const header = figma.createAutoLayout('HORIZONTAL', { name: 'Header', paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 14, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
header.fills = [{ type: 'SOLID', color: hex('#1A73E8') }];
screen.appendChild(header);
header.layoutSizingHorizontal = 'FILL';
// menu + title + spacer (same as SearchScreen.js)
const menuBtn = figma.createAutoLayout('VERTICAL', { itemSpacing: 5 });
menuBtn.resize(32, 32); menuBtn.fills = [];
for (let i = 0; i < 3; i++) {
  const line = figma.createRectangle();
  line.resize(i === 1 ? 16 : 22, 2);
  line.cornerRadius = 2;
  line.fills = [{ type: 'SOLID', color: { r:1,g:1,b:1 } }];
  menuBtn.appendChild(line);
}
header.appendChild(menuBtn);
const titleWrap = figma.createAutoLayout('HORIZONTAL', { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
titleWrap.fills = [];
header.appendChild(titleWrap);
titleWrap.layoutSizingHorizontal = 'FILL';
const title = figma.createText();
title.characters = 'LexiSearch';
title.fontSize = 20;
title.fontName = { family: 'Inter', style: 'Extra Bold' };
title.fills = [{ type: 'SOLID', color: { r:1,g:1,b:1 } }];
titleWrap.appendChild(title);
const spacer = figma.createFrame();
spacer.resize(32, 32); spacer.fills = [];
header.appendChild(spacer);
createdNodeIds.push(header.id, menuBtn.id, titleWrap.id, title.id, spacer.id);

const body = figma.createAutoLayout('VERTICAL', { name: 'Body Content', paddingLeft: 20, paddingRight: 20, paddingTop: 24, itemSpacing: 28, primaryAxisAlignItems: 'CENTER' });
body.fills = [];
screen.appendChild(body);
body.layoutSizingHorizontal = 'FILL';
body.layoutSizingVertical = 'FILL';
createdNodeIds.push(body.id);

return { screenId: screen.id, bodyId: body.id, createdNodeIds };
```

### Script 2 — Hero + search card + tips

Replace `BODY_ID` with the `bodyId` from Script 1.

```javascript
const hex = (h) => {
  const n = h.replace('#', '');
  return { r: parseInt(n.slice(0,2),16)/255, g: parseInt(n.slice(2,4),16)/255, b: parseInt(n.slice(4,6),16)/255 };
};
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Extra Bold' }),
]);
const body = await figma.getNodeByIdAsync('BODY_ID');
const createdNodeIds = [];

const hero = figma.createAutoLayout('VERTICAL', { name: 'Hero Section', itemSpacing: 8, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
hero.fills = [];
body.appendChild(hero);
hero.layoutSizingHorizontal = 'FILL';

const emoji = figma.createText();
emoji.characters = '📖'; emoji.fontSize = 52;
hero.appendChild(emoji);
const heroTitle = figma.createText();
heroTitle.characters = 'Dictionary';
heroTitle.fontSize = 30;
heroTitle.fontName = { family: 'Inter', style: 'Extra Bold' };
heroTitle.fills = [{ type: 'SOLID', color: hex('#0D47A1') }];
hero.appendChild(heroTitle);
const heroSub = figma.createText();
heroSub.characters = 'Discover meanings, pronunciations,\nand usage examples';
heroSub.fontSize = 14;
heroSub.fontName = { family: 'Inter', style: 'Regular' };
heroSub.textAlignHorizontal = 'CENTER';
heroSub.fills = [{ type: 'SOLID', color: hex('#6E6E73') }];
hero.appendChild(heroSub);
createdNodeIds.push(hero.id, emoji.id, heroTitle.id, heroSub.id);

const card = figma.createAutoLayout('VERTICAL', { name: 'Search Card', paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, itemSpacing: 10, cornerRadius: 20 });
card.fills = [{ type: 'SOLID', color: { r:1,g:1,b:1 } }];
card.effects = [{ type: 'DROP_SHADOW', color: { r:0,g:0,b:0,a:0.08 }, offset: { x:0, y:4 }, radius: 12, visible: true, blendMode: 'NORMAL' }];
body.appendChild(card);
card.layoutSizingHorizontal = 'FILL';

const label = figma.createText();
label.characters = 'SEARCH FOR A WORD';
label.fontSize = 13;
label.fontName = { family: 'Inter', style: 'Semi Bold' };
label.fills = [{ type: 'SOLID', color: hex('#6E6E73') }];
card.appendChild(label);

const inputRow = figma.createAutoLayout('HORIZONTAL', { name: 'Search Input', paddingLeft: 14, paddingRight: 14, paddingTop: 14, paddingBottom: 14, itemSpacing: 10, cornerRadius: 14, primaryAxisAlignItems: 'CENTER' });
inputRow.fills = [{ type: 'SOLID', color: hex('#FAFAFA') }];
inputRow.strokes = [{ type: 'SOLID', color: hex('#DADCE0') }];
inputRow.strokeWeight = 1.5;
card.appendChild(inputRow);
inputRow.layoutSizingHorizontal = 'FILL';
const searchIcon = figma.createText(); searchIcon.characters = '🔍'; searchIcon.fontSize = 16;
inputRow.appendChild(searchIcon);
const placeholder = figma.createText();
placeholder.characters = 'e.g. serendipity, eloquent...';
placeholder.fontSize = 16;
placeholder.fontName = { family: 'Inter', style: 'Regular' };
placeholder.fills = [{ type: 'SOLID', color: hex('#ABABAB') }];
inputRow.appendChild(placeholder);
placeholder.layoutSizingHorizontal = 'FILL';

const searchBtn = figma.createAutoLayout('HORIZONTAL', { name: 'Search Button', paddingTop: 15, paddingBottom: 15, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER', cornerRadius: 14 });
searchBtn.fills = [{ type: 'SOLID', color: hex('#1A73E8') }];
searchBtn.effects = [{ type: 'DROP_SHADOW', color: { r:0.102,g:0.451,b:0.910,a:0.3 }, offset: { x:0, y:4 }, radius: 8, visible: true, blendMode: 'NORMAL' }];
card.appendChild(searchBtn);
searchBtn.layoutSizingHorizontal = 'FILL';
const btnText = figma.createText();
btnText.characters = 'Search';
btnText.fontSize = 16;
btnText.fontName = { family: 'Inter', style: 'Bold' };
btnText.fills = [{ type: 'SOLID', color: { r:1,g:1,b:1 } }];
searchBtn.appendChild(btnText);
createdNodeIds.push(card.id, label.id, inputRow.id, searchIcon.id, placeholder.id, searchBtn.id, btnText.id);

const tips = figma.createAutoLayout('VERTICAL', { name: 'Quick Tips', itemSpacing: 10 });
tips.fills = [];
body.appendChild(tips);
tips.layoutSizingHorizontal = 'FILL';
const tipsLabel = figma.createText();
tipsLabel.characters = 'QUICK TIPS';
tipsLabel.fontSize = 12;
tipsLabel.fontName = { family: 'Inter', style: 'Semi Bold' };
tipsLabel.fills = [{ type: 'SOLID', color: hex('#6E6E73') }];
tips.appendChild(tipsLabel);
const chipsRow = figma.createAutoLayout('HORIZONTAL', { name: 'Tip Chips', itemSpacing: 8, layoutWrap: 'WRAP' });
chipsRow.fills = [];
tips.appendChild(chipsRow);
chipsRow.layoutSizingHorizontal = 'FILL';
for (const tip of ['💡 Try "ephemeral"', '📚 Try "ubiquitous"', '🌟 Try "serendipity"']) {
  const chip = figma.createAutoLayout('HORIZONTAL', { paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8, cornerRadius: 20 });
  chip.fills = [{ type: 'SOLID', color: hex('#E8F0FE') }];
  chip.strokes = [{ type: 'SOLID', color: hex('#C5D8FB') }];
  chip.strokeWeight = 1;
  const chipText = figma.createText();
  chipText.characters = tip;
  chipText.fontSize = 13;
  chipText.fontName = { family: 'Inter', style: 'Regular' };
  chipText.fills = [{ type: 'SOLID', color: hex('#1A73E8') }];
  chip.appendChild(chipText);
  chipsRow.appendChild(chip);
  createdNodeIds.push(chip.id, chipText.id);
}
createdNodeIds.push(tips.id, tipsLabel.id, chipsRow.id);

return { createdNodeIds };
```

---

## Visual reference (layout)

```
┌──────────────────────────────┐
│ 9:41              ▪▪▪ ▓ WiFi │  Status bar (blue)
├──────────────────────────────┤
│ ☰      LexiSearch            │  Header (blue)
├──────────────────────────────┤
│                              │
│            📖                │
│         Dictionary           │
│  Discover meanings,          │
│  pronunciations, and         │
│  usage examples              │
│                              │
│  ┌────────────────────────┐  │
│  │ SEARCH FOR A WORD      │  │
│  │ ┌────────────────────┐ │  │
│  │ │ 🔍 e.g. serendipity│ │  │
│  │ └────────────────────┘ │  │
│  │ ┌────────────────────┐ │  │
│  │ │      Search        │ │  │
│  │ └────────────────────┘ │  │
│  └────────────────────────┘  │
│                              │
│  QUICK TIPS                  │
│  [ephemeral] [ubiquitous]    │
│  [serendipity]               │
└──────────────────────────────┘
```
