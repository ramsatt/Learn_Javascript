const fs = require('fs');
const path = require('path');

const baseSrcDir = 'D:\\A21\\web scrapper\\w3schools\\www.w3schools.com';
const destDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\content';
const dataDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\data';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Map folder names to course display names and IDs
const folderToCourse = {
    'c': { id: 'c', title: 'C' },
    'cpp': { id: 'cpp', title: 'C++' },
    'cs': { id: 'csharp', title: 'C#' },
    'sql': { id: 'sql', title: 'SQL' },
    'php': { id: 'php', title: 'PHP' },
    'nodejs': { id: 'nodejs', title: 'Node.js' },
    'react': { id: 'react', title: 'React' },
    'typescript': { id: 'typescript', title: 'TypeScript' },
    'kotlin': { id: 'kotlin', title: 'Kotlin' },
    'go': { id: 'go', title: 'Go' },
    'django': { id: 'django', title: 'Django' },
    'bootstrap5': { id: 'bootstrap5', title: 'Bootstrap 5' },
    'jquery': { id: 'jquery', title: 'jQuery' },
    'mongodb': { id: 'mongodb', title: 'MongoDB' },
    'mysql': { id: 'mysql', title: 'MySQL' },
    'postgresql': { id: 'postgresql', title: 'PostgreSQL' },
    'git': { id: 'git', title: 'Git' }
};

// Simplified element remover for mass processing
const removeElement = (html, tagName, attrName, attrValue) => {
    const regex = new RegExp(`<${tagName}[^>]*${attrName}=['"]${attrValue}['"][\\s\\S]*`, 'i');
    const match = html.match(regex);
    if (match) {
        let s = match.index;
        let depth = 0;
        let pos = s;
        while (pos < html.length) {
            if (html.substring(pos, pos + tagName.length + 1).toLowerCase() === `<${tagName}`) {
                depth++;
                pos += tagName.length + 1;
            } else if (html.substring(pos, pos + tagName.length + 3).toLowerCase() === `</${tagName}>`) {
                depth--;
                pos += tagName.length + 3;
                if (depth === 0) {
                    return html.substring(0, s) + html.substring(pos);
                }
            } else {
                pos++;
            }
        }
    }
    return html;
};

// Process each course
Object.keys(folderToCourse).forEach(folder => {
    const course = folderToCourse[folder];
    const srcDir = path.join(baseSrcDir, folder);
    
    if (!fs.existsSync(srcDir)) return;

    console.log(`--- Processing Course: ${course.title} ---`);
    
    const menuData = [{
        title: `${course.title} Tutorial`,
        items: []
    }];

    // List files in the directory
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.html') && !f.includes('exercise') && !f.includes('quiz'));

    // Prioritize 'default.html' or 'index.html'
    const sortedFiles = files.sort((a,b) => {
        if (a === 'default.html') return -1;
        if (b === 'default.html') return 1;
        return a.localeCompare(b);
    });

    // Limit to first 30 files per course to avoid massive bloat initially, but covers main tutorial
    const filesToProcess = sortedFiles.slice(0, 30);

    filesToProcess.forEach(file => {
        const fullPath = path.join(srcDir, file);
        const destFile = `${course.id}_${file}`;
        
        try {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Find main content
            let mainMatch = content.match(/<div[^>]*id=['"]main['"][^>]*>/i);
            let startIndex = mainMatch ? content.indexOf(mainMatch[0]) + mainMatch[0].length : 0;
            let extracted = content.substring(startIndex);

            // Cut off at end markers
            const endMarkers = [
                /<div[^>]*id=['"]user-profile-bottom-wrapper['"]/i,
                /<footer/i,
                /<div[^>]*id=['"]right['"]/i,
                /<div[^>]*class=['"]w3-clear\s+nextprev['"]/i
            ];

            let earliestEnd = extracted.length;
            for (const marker of endMarkers) {
                const match = extracted.match(marker);
                if (match && match.index < earliestEnd) earliestEnd = match.index;
            }
            extracted = extracted.substring(0, earliestEnd);

            // Clean
            extracted = extracted.replace(/<div[^>]*id=['"]midcontentadcontainer['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<div[^>]*id=['"]mainLeaderboard['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
            extracted = removeElement(extracted, 'div', 'class', 'ws-learnhtml');
            extracted = removeElement(extracted, 'div', 'class', 'ws-hide-on-logged-in');
            extracted = removeElement(extracted, 'div', 'id', 'getdiploma');
            extracted = removeElement(extracted, 'div', 'class', 'containerlog');
            extracted = extracted.replace(/<div[^>]*id=['"]exercisecontainer['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<div[^>]*style=['"][^'"]*background-color:\s*#282b35[^'"]*['"][\s\S]*/gi, "");
            extracted = extracted.replace(/<!--[\s\S]*?-->/g, "");

            // Handle Images
            extracted = extracted.replace(/src="([^"]*)"/g, (match, p1) => {
                if (!p1.startsWith('http') && !p1.startsWith('data:')) {
                    const imgName = path.basename(p1);
                    const possiblePaths = [path.join(srcDir, p1), path.join(srcDir, 'images', imgName), path.join(srcDir, imgName)];
                    for (const imgPath of possiblePaths) {
                        if (fs.existsSync(imgPath) && !fs.lstatSync(imgPath).isDirectory()) {
                            const imgDir = path.join(destDir, 'images');
                            if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
                            fs.copyFileSync(imgPath, path.join(imgDir, imgName));
                            return `src="assets/content/images/${imgName}"`;
                        }
                    }
                }
                return match;
            });

            fs.writeFileSync(path.join(destDir, destFile), extracted.trim());

            // Get Title
            let title = file.replace(`${course.id}_`, '').replace('.html', '').replace(/_|-/g, ' ');
            title = title.charAt(0).toUpperCase() + title.slice(1);
            const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
            if (titleMatch) {
                title = titleMatch[1].replace(/<span[^>]*>|<\/span>/g, '').trim();
            }
            
            menuData[0].items.push({ title, file: destFile });

        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    });

    if (menuData[0].items.length > 0) {
        fs.writeFileSync(path.join(dataDir, `${course.id}.json`), JSON.stringify(menuData, null, 2));
    }
});

console.log('Massive tutorial scraping completed.');
