const fs = require('fs');
const path = require('path');

const srcPath = '/Users/fernandocunhamw/Documents/apple.com_br_macbook_neo/index.html';
const destPath = '/Users/fernandocunhamw/Documents/apple.com_br_macbook_neo/design-system.html';

const html = fs.readFileSync(srcPath, 'utf8');

// Extract head
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
const headContent = headMatch ? headMatch[1] : '';

// Hero section
let heroContent = '';
const heroMatch = html.match(/<section[^>]*class="[^"]*section-welcome[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
if (heroMatch) {
    heroContent = heroMatch[0];
    
    // Replace text in hero
    heroContent = heroContent.replace(
        /MacBook(?:&nbsp;|\s)Neo/i, 
        'Design System'
    ).replace(
        /<h2[^>]*class="typography-welcome-headline"[^>]*>[\s\S]*?<\/h2>/i,
        '<h2 class="typography-welcome-headline">Pattern<br/> Library.</h2>'
    ).replace(
        /A partir de.*?<\/span>/i,
        'The definitive pattern library for MacBook Neo.</span>'
    ).replace(
        /<a[^>]*class="marquee-ctas-link button"[^>]*>.*?<\/a>/i,
        '<a href="#typography" class="marquee-ctas-link button button-elevated">Explore Patterns</a>'
    );
}

const customCSS = `
<style>
/* Design System Specific Styles */
html { scroll-behavior: smooth; }
body { padding-top: 50px; }
.ds-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 9999;
    padding: 15px 30px;
    display: flex;
    gap: 20px;
    justify-content: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
.ds-nav a {
    color: #f5f5f7;
    text-decoration: none;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.01em;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    opacity: 0.8;
    transition: opacity 0.2s;
}
.ds-nav a:hover { opacity: 1; }

.ds-section {
    padding: 100px 20px;
    max-width: 980px;
    margin: 0 auto;
    border-bottom: 1px solid #d2d2d7;
}
.theme-dark .ds-section { border-color: #424245; }

.ds-section-title {
    font-size: 40px;
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: 0em;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    margin-bottom: 60px;
}

/* Typo table */
.ds-typo-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
.ds-typo-table th, .ds-typo-table td {
    padding: 20px;
    text-align: left;
    border-bottom: 1px solid #d2d2d7;
    vertical-align: middle;
}
.theme-dark .ds-typo-table th, .theme-dark .ds-typo-table td { border-color: #424245; }
.ds-typo-table th { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #86868b; }
.ds-typo-label { font-size: 14px; font-family: monospace; color: #ff3b30; }
.ds-typo-spec { font-size: 12px; color: #86868b; }

/* Colors */
.ds-color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 30px; }
.ds-color-card { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); }
.ds-color-swatch { height: 100px; width: 100%; }
.ds-color-info { padding: 15px; background: #fff; }
.theme-dark .ds-color-info { background: #1d1d1f; color: #f5f5f7; }
.ds-color-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; display: block; }
.ds-color-hex { font-size: 12px; font-family: monospace; color: #86868b; }

/* Components */
.ds-comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.ds-comp-box { background: #f5f5f7; border-radius: 18px; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; }
.theme-dark .ds-comp-box { background: #1d1d1f; }
.ds-comp-label { width: 100%; text-align: left; font-size: 12px; color: #86868b; margin-bottom: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }

/* Motion */
.ds-motion-box { height: 150px; background: #fff; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid #d2d2d7; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.theme-dark .ds-motion-box { background: #000; border-color: #424245; }
</style>
`;

const typographyClasses = [
    'typography-welcome-headline',
    'typography-welcome-headline-elevated',
    'typography-welcome-subhead',
    'typography-marquee-eyebrow-base',
    'typography-marquee-detail',
    'typography-section-header-headline',
    'typography-media-card-gallery-headline',
    'typography-ps-headline-standalone',
    'typography-ps-body',
    'typography-section-header-link',
    'typography-tout-reduced',
    'typography-all-access-pass-pv-item-label',
    'typography-all-access-pass-pv-item-body',
    'typography-all-access-pass-pv-item-title',
    'typography-ps-callout',
    'typography-ps-performance-copy',
    'typography-body'
];

let typoRows = '';
typographyClasses.forEach(c => {
    typoRows += `
    <tr>
        <td>
            <span class="ds-typo-label">.${c}</span><br>
            <span class="ds-typo-spec ds-spec-calc" data-target="${c}">Calculating...</span>
        </td>
        <td style="max-width: 500px">
            <div class="${c}">The quick brown fox jumps over the lazy dog.</div>
        </td>
    </tr>`;
});

const scriptInject = `
<script>
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ds-spec-calc').forEach(el => {
        const targetClass = el.getAttribute('data-target');
        const exampleNode = el.parentElement.nextElementSibling.querySelector('.' + targetClass);
        if (exampleNode) {
            const style = window.getComputedStyle(exampleNode);
            const size = style.fontSize;
            const lh = style.lineHeight;
            const fw = style.fontWeight;
            const ls = style.letterSpacing;
            el.innerHTML = size + ' / ' + lh + ' &middot; W:' + fw + ' &middot; LS:' + ls;
        }
    });
});
</script>`;

const finalHtml = `<!DOCTYPE html>
<html class="no-js br js no-touch no-reduced-motion inline-media no-safari inline-media-alpha desktop no-ar-quicklook no-small-breakpoint ac-ls-visible enhanced display-enhanced performance-enhanced continuity-enhanced no-firefox media-card-gallery-focusable" dir="ltr" lang="pt-BR">
<head>
    <meta charset="utf-8">
${headContent}
${customCSS}
<title>MacBook Neo - Design System</title>
</head>
<body class="page-overview ac-nav-overlap">

<nav class="ds-nav">
  <a href="#hero">Hero</a>
  <a href="#typography">Typography</a>
  <a href="#colors">Colors & Surfaces</a>
  <a href="#components">UI Components</a>
  <a href="#layout">Layout & Spacing</a>
  <a href="#motion">Motion</a>
</nav>

<div id="hero" style="position:relative; margin-top:0;">
  ${heroContent ? heroContent : '<div style="padding:100px; text-align:center;"><h2>Hero Section</h2><p>Extracted from reference</p></div>'}
</div>

<main class="main" role="main" style="background:#fff;">

  <!-- Typography -->
  <section id="typography" class="ds-section">
    <h2 class="ds-section-title typography-section-header-headline">Typography Pattern Library</h2>
    <table class="ds-typo-table">
        <thead>
            <tr>
                <th>Style Identity</th>
                <th>Live Rendering</th>
            </tr>
        </thead>
        <tbody>
            ${typoRows}
        </tbody>
    </table>
  </section>

  <!-- Colors & Surfaces -->
  <section id="colors" class="ds-section">
    <h2 class="ds-section-title typography-section-header-headline">Colors & Surfaces</h2>
    
    <div class="ds-color-grid">
      <div class="ds-color-card">
        <div class="ds-color-swatch" style="background-color: #f5f5f7;"></div>
        <div class="ds-color-info">
          <span class="ds-color-name">Light Gray</span>
          <span class="ds-color-hex">#f5f5f7</span>
        </div>
      </div>
      <div class="ds-color-card">
        <div class="ds-color-swatch" style="background-color: #1d1d1f;"></div>
        <div class="ds-color-info">
          <span class="ds-color-name">Dark Surface</span>
          <span class="ds-color-hex">#1d1d1f</span>
        </div>
      </div>
      <div class="ds-color-card">
        <div class="ds-color-swatch" style="background-color: #000000;"></div>
        <div class="ds-color-info">
          <span class="ds-color-name">Black</span>
          <span class="ds-color-hex">#000000</span>
        </div>
      </div>
      <div class="ds-color-card">
        <div class="ds-color-swatch" style="background-color: #ff3b30;"></div>
        <div class="ds-color-info">
          <span class="ds-color-name">Apple Red</span>
          <span class="ds-color-hex">#ff3b30</span>
        </div>
      </div>
      <div class="ds-color-card">
        <div class="ds-color-swatch" style="background-color: #86868b;"></div>
        <div class="ds-color-info">
          <span class="ds-color-name">Secondary Text</span>
          <span class="ds-color-hex">#86868b</span>
        </div>
      </div>
      <div class="ds-color-card">
        <div class="ds-color-swatch" style="background-color: #0071e3;"></div>
        <div class="ds-color-info">
          <span class="ds-color-name">Apple Blue (Links)</span>
          <span class="ds-color-hex">#0071e3</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Content Components -->
  <section id="components" class="ds-section theme-dark" style="background:black; border-radius:30px; margin-top:40px; margin-bottom: 40px; color:#fff;">
    <h2 class="ds-section-title typography-section-header-headline" style="color:#fff;">UI Components</h2>
    <div class="ds-comp-grid">
      <div class="ds-comp-box">
        <div class="ds-comp-label" style="color:#d2d2d7">Standard Button Primary</div>
        <a href="#" class="button button-elevated">Explore Features</a>
      </div>
      <div class="ds-comp-box">
        <div class="ds-comp-label" style="color:#d2d2d7">Inline Links</div>
        <a href="#" class="icon icon-after icon-standalone icon-chevronright">Learn more</a>
      </div>
      <div class="ds-comp-box">
        <div class="ds-comp-label" style="color:#d2d2d7">Pricing Callout</div>
        <p class="typography-ps-callout" style="color:#f5f5f7">From $1299 or $108.25/mo. for 12 mo.</p>
      </div>
      <div class="ds-comp-box">
        <div class="ds-comp-label" style="color:#d2d2d7">Play Button</div>
        <a href="#" class="button popup-action-button popup-action-button-play">Watch the film</a>
      </div>
    </div>
  </section>

  <!-- Layout -->
  <section id="layout" class="ds-section">
    <h2 class="ds-section-title typography-section-header-headline">Layout & Grid</h2>
    <div class="ds-comp-label">Section Padding: .section-padding</div>
    <div style="background:#f5f5f7; padding: 100px 0; text-align:center; border: 1px dashed #86868b; border-radius: 12px; margin-bottom: 20px;">
        100px Standard Vertical Padding
    </div>
    
    <div class="ds-comp-label">Grid Layout: Columns</div>
    <div class="row" style="background:#f5f5f7; padding: 20px; border-radius: 12px; border: 1px dashed #86868b; display:flex;">
        <div class="column large-6 small-12" style="background:#fff; padding:20px; text-align:center; border-radius:8px; margin-right: 10px; flex:1;">large-6 small-12</div>
        <div class="column large-6 small-12" style="background:#fff; padding:20px; text-align:center; border-radius:8px; flex:1;">large-6 small-12</div>
    </div>
  </section>

  <!-- Motion -->
  <section id="motion" class="ds-section">
    <h2 class="ds-section-title typography-section-header-headline">Motion & Interactions</h2>
    <div class="ds-comp-grid">
      <div>
        <div class="ds-comp-label">Link Transition (.ar-link:hover)</div>
        <div class="ds-motion-box ar-link section-header-cta-link text-center" style="display:flex;">
          <a class="icon icon-arkit icon-after" style="color:#0071e3">Hover over me</a>
        </div>
      </div>
      <div>
        <div class="ds-comp-label">Button Transition (.button:hover)</div>
        <div class="ds-motion-box p-4" style="background:transparent; border:none; box-shadow:none;">
          <a href="#" class="button button-elevated">Hover me</a>
        </div>
      </div>
    </div>
  </section>

</main>

${scriptInject}
</body>
</html>`;

fs.writeFileSync(destPath, finalHtml);
console.log('Design System file written successfully to:', destPath);
