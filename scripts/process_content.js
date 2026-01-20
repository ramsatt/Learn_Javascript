
const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const sourceDir = String.raw`D:\A21\web scrapper\w3schools\www.w3schools.com\js`;
const outputBaseDir = String.raw`d:\a20\javascript\js-learning-app\src\assets`;
const contentDir = path.join(outputBaseDir, 'content');
const imagesDir = path.join(outputBaseDir, 'images');

if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const menuPath = path.join(outputBaseDir, 'menu_data.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Helper to copy image
function copyImage(src, currentFileDir) {
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    
    // Resolve source path
    // src might be "img_foo.jpg" or "../images/foo.jpg"
    let absoluteSrcPath = path.resolve(currentFileDir, src);
    
    // Check if exists
    if (!fs.existsSync(absoluteSrcPath)) {
        // Try looking in the local js folder if it was ../ and failed, or vice versa?
        // But trust the resolve first.
        console.warn(`Image not found: ${absoluteSrcPath}`);
        return src;
    }

    const basename = path.basename(absoluteSrcPath);
    const destPath = path.join(imagesDir, basename);
    
    // Copy if not exists
    if (!fs.existsSync(destPath)) {
        fs.copyFileSync(absoluteSrcPath, destPath);
    }
    
    return 'assets/images/' + basename;
}

// Process a single file
function processFile(fileName) {
    const fullPath = path.join(sourceDir, fileName);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return null;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    
    const main = doc.querySelector("#main");
    if (!main) return null;

    // clean up
    const selectorsToRemove = [
        'script',
        '[id*="google"]',
        '[class*="ad"]',
        '#right',
        '#mainLeaderboard',
        '#midcontentadcontainer',
        '.user-profile-bottom-wrapper',
        '#getdiploma',
        '.w3s-pathfinder',
        'style',
        '#exercisecontainer'
    ];
    
    selectorsToRemove.forEach(selector => {
        main.querySelectorAll(selector).forEach(el => el.remove());
    });

    
    // Process Images
    main.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
            const newSrc = copyImage(src, sourceDir); // Files are in sourceDir
            img.setAttribute('src', newSrc);
        }
    });

    // Remove top navigation (only keep the bottom one)
    const navs = main.querySelectorAll('.nextprev');
    if (navs.length > 0) {
        // Assume the first one is the top one (w3schools standard)
        // Check if there's a second one to ensuring we don't remove the ONLY one
        if (navs.length > 1) {
             navs[0].remove();
        }
    }

    // Transform w3-code blocks to clean <pre><code> for PrismJS
    main.querySelectorAll('.w3-code').forEach(el => {
        let lang = 'javascript';
        if (el.classList.contains('htmlHigh')) lang = 'html';
        if (el.classList.contains('cssHigh')) lang = 'css';
        
        // Clone to preserve original, then clean
        let text = el.innerHTML;
        
        // 1. Normalize source whitespace (newlines/tabs/spaces -> single space)
        // avoiding \s to preserve &nbsp; (\u00A0)
        text = text.replace(/[ \t\r\n]+/g, ' ');
        
        // 2. Wrap <br> to newline, consuming surrounding spaces
        text = text.replace(/ *<br\s*\/?> */gi, '\n');
        
        // 3. Convert indentation entities
        text = text.replace(/(&nbsp;|\u00A0)/g, ' ');

        // 4. Collapse ALL multiple newlines to single newline for tight code
        text = text.replace(/\n{2,}/g, '\n');
        
        text = text.trim();
        // Strip other tags usually? w3-code can contain spans if pre-processed, but usually clean in raw.
        // But wait, if we use textContent, we lose < and > entities if they were rendered.
        // innerHTML usually has &lt; for <.
        // We want to keep &lt; but remove <br>.
        
        // Create new node
        const pre = doc.createElement('pre');
        // pre.className = 'w3-code'; // Keep class for container styling if needed, or move to pre
        // actually app css targets .w3-code, so let's keep it? 
        // Or better, wrapping plain code.
        
        const code = doc.createElement('code');
        code.className = `language-${lang}`;
        
        // We need to decode HTML entities for textContent, OR set innerHTML.
        // If we set innerHTML = text (where <br> became \n), we are good.
        code.innerHTML = text;
        
        pre.appendChild(code);
        el.replaceWith(pre);
        pre.classList.add('w3-code'); 
    });

    // Wrap tables for responsive scrolling
    main.querySelectorAll('table').forEach(table => {
        // Create wrapper
        const wrapper = doc.createElement('div');
        wrapper.className = 'table-responsive-wrapper';
        
        // Insert wrapper before table
        table.parentNode.insertBefore(wrapper, table);
        
        // Move table into wrapper
        wrapper.appendChild(table);
    });

    // Remove "Try it Yourself" buttons and links in tables
    main.querySelectorAll('a').forEach(a => {
        const text = a.textContent.toLowerCase();
        if (text.includes('try it yourself') || text.includes('try it')) {
            a.remove();
        } else {
             // For now, let's keep them as is. The app can handle routing on <a href>.
             a.removeAttribute('target');
        }
    });

    // Final text cleanup
    let html = main.innerHTML;
    html = html.replace(/Try it Yourself/gi, '');
    html = html.replace(/Try-it-Yourself/gi, '');
    // Clean up any remaining "Try it" text that might be outside links or in headers
    html = html.replace(/Try it/gi, ''); 
    
    // Also remove empty "TRY" headers in tables if possible, but regex is tricky for structure.
    // Let's assume removing the link is sufficient for now as per request "remove Tty It>>".

    // Transform w3-code blocks for PrismJS
    // We do this on the string because manipulating the DOM for this properly with JSDOM
    // and preserving newlines/entities can be tricky. 
    // However, doing it in JSDOM is safer for structure. Let's try JSDOM first in the block above.
    
    return html;
}

// Iterate through menu items
let count = 0;
menuData.forEach(section => {
    section.items.forEach(item => {
        // item.file is like "js_intro.html"
        // Sometimes it might have query params or hashes, cleaner needed
        let cleanName = item.file.split('#')[0].split('?')[0];
        const dest = path.join(contentDir, cleanName);
        const html = processFile(cleanName);

        if (html) {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.writeFileSync(dest, html);
            count++;
            if (count % 20 === 0) {
                console.log(`Processed ${count} files...`);
                // Optional: trigger GC if exposed, otherwise just hope the loop allows some cleanup
            }
        }
    });
});

console.log(`Processed ${count} files.`);
