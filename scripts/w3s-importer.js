
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Args: SourceDir, CourseId, CourseTitle
const sourcePath = process.argv[2];
const courseId = process.argv[3];
const courseTitle = process.argv[4];

if (!sourcePath || !courseId || !courseTitle) {
    console.error('Usage: node w3s-importer.js <SourcePath> <CourseId> "<CourseTitle>"');
    process.exit(1);
}

const projectRoot = path.join(__dirname, '..');
const assetsDir = path.join(projectRoot, 'src', 'assets');
const outputContentDir = path.join(assetsDir, 'content', courseId);
const outputDataDir = path.join(assetsDir, 'data');
const imagesDir = path.join(outputContentDir, 'images');

// Ensure directories exist
if (!fs.existsSync(outputContentDir)) fs.mkdirSync(outputContentDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(outputDataDir)) fs.mkdirSync(outputDataDir, { recursive: true });

// Helper to copy images
function processImages(document, currentFile) {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (!src) return;

        // Resolve absolute or relative path
        // W3S images are usually relative e.g. "img_girl.jpg" or "../images/x.png"
        let imagePath = '';
        if (src.startsWith('../')) {
           // Parent dir
           imagePath = path.join(sourcePath, '..', src.replace('../', '')); 
        } else {
           imagePath = path.join(sourcePath, src);
        }

        // Clean filename
        const filename = path.basename(src).split('?')[0]; // remove query params
        
        // Copy if exists
        try {
            if (fs.existsSync(imagePath)) {
                fs.copyFileSync(imagePath, path.join(imagesDir, filename));
                // Update Src to point to assets
                // In our app, content is loaded relative to something... 
                // Actually, our content loader loads HTML. 
                // If we serve images from assets/content/courseId/images, the src should be 'assets/content/courseId/images/filename'
                // OR simple relative 'images/filename' if the Base HREF matches?
                // Our app likely renders this HTML inside a container. Relative paths might be tricky depending on Router URL.
                // Safest is absolute path from root: "assets/content/{courseId}/images/{filename}"
                img.setAttribute('src', `assets/content/${courseId}/images/${filename}`);
            }
        } catch(e) {
            console.warn(`Failed to copy image: ${imagePath}`, e.message);
        }
    });
}

function processFile(filename) {
    const filePath = path.join(sourcePath, filename);
    if (!fs.existsSync(filePath)) return null;

    console.log(`Processing ${filename}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;

    // 1. Extract Main Content
    // W3Schools content is typically in div#main
    const main = doc.querySelector('#main');
    if (!main) {
        console.warn(`No #main found in ${filename}`);
        return null;
    }

    // 2. Get Title
    const h1 = main.querySelector('h1');
    const title = h1 ? h1.textContent.trim() : filename.replace('.html', '');

    // 3. Clean Content
    // Remove Next/Prev buttons (usually div.w3-nextprev or similar)
    const nextPrev = main.querySelectorAll('.nextprev, .w3-clear.nextprev');
    nextPrev.forEach(el => el.remove());
    
    const ads = main.querySelectorAll('[id*="google"], [class*="ad"]');
    ads.forEach(el => el.remove());

    // 4. Process Images
    processImages(doc, filename);

    // 5. Fix Links
    // <a href="rust_syntax.html"> -> <a href="javascript:void(0)" onclick="router..."? 
    // Ideally we rewrite them to be ignored or internal.
    // For now, let's leave them relative, but our Angular app handles route parameters. 
    // If we click it, it might reload page.
    // Better: transform to [routerLink] format if possible, but this is raw HTML.
    // Angular [innerHTML] doesn't compile directives.
    // We will strip hrefs to avoid broken navigation for now, or replace with #
    const links = main.querySelectorAll('a');
    links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('http')) {
             // It's local. 
             // Ideally we want: /tutorial/rust_syntax.html
             a.setAttribute('href', `#/tutorial/${href}`); // Hash style routing
        }
    });

    // 6. Find 'Next' Link for Chain
    // W3Schools usually has <div class="w3-clear nextprev"><a class="w3-right w3-btn" href="NEXT">Next</a></div>
    // We already removed it from DOM, but we can search original doc or use the one we removed?
    // Let's search in original 'doc' before we removed? No we modified live.
    // Wait, nextPrev is a NodeList of removed elements.
    let nextFile = null;
    // We need to re-query safely or check the removed nodes.
    // Actually, usually the last link with text "Next >"
    const allLinks = Array.from(dom.window.document.querySelectorAll('a')); 
    // This query runs on current DOM. If we removed nextPrev, we might miss it.
    // Let's find Next BEFORE removing.
    
    // RE-READ for Logic
    const rawDom = new JSDOM(content);
    const rawDoc = rawDom.window.document;
    const nextBtn = Array.from(rawDoc.querySelectorAll('a')).find(a => a.textContent.includes('Next') && a.getAttribute('href'));
    if (nextBtn) {
        nextFile = nextBtn.getAttribute('href');
    }

    // 7. Save output
    const outputFilePath = path.join(outputContentDir, filename);
    const parentDir = path.dirname(outputFilePath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(outputFilePath, main.innerHTML);
    
    return {
        title,
        file: filename,
        next: nextFile
    };
}

// MAIN LOOP
let currentFile = 'index.html'; // Entry point
// Start file might be default.html in some sections
if (!fs.existsSync(path.join(sourcePath, currentFile))) {
    if (fs.existsSync(path.join(sourcePath, 'default.html'))) {
        currentFile = 'default.html';
    } else {
        console.error('Cannot find index.html or default.html entry point.');
        process.exit(1);
    }
}

const curriculum = []; // Array of items
const visited = new Set();
let limit = 200; // Safety break

while (currentFile && !visited.has(currentFile) && limit > 0) {
    visited.add(currentFile);
    limit--;

    const result = processFile(currentFile);
    if (result) {
        curriculum.push({
            title: result.title,
            file: result.file
        });
        currentFile = result.next;
    } else {
        break;
    }
}

// Structure for curriculum JSON
// We'll make one big section for now
const jsonStructure = [
    {
        title: "Tutorial",
        items: curriculum
    }
];

fs.writeFileSync(path.join(outputDataDir, `${courseId}.json`), JSON.stringify(jsonStructure, null, 2));
console.log(`Generated ${courseId}.json with ${curriculum.length} lessons.`);

// Update courses.json
const coursesPath = path.join(assetsDir, 'courses.json');
let courses = [];
if (fs.existsSync(coursesPath)) {
    courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
}

// Check if exists
const existingIdx = courses.findIndex(c => c.id === courseId);
const newCourse = {
    id: courseId,
    title: courseTitle,
    icon: 'code-slash-outline', // Default
    color: '#555555',
    file: `assets/data/${courseId}.json`,
    description: `Learn ${courseTitle} from W3Schools.`,
    level: "Beginner",
    duration: "10h",
    lessonCount: curriculum.length,
    route: `/tutorial/${curriculum[0].file}`
};

if (existingIdx >= 0) {
    courses[existingIdx] = { ...courses[existingIdx], ...newCourse };
} else {
    courses.push(newCourse);
}

fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
console.log(`Updated courses.json`);
