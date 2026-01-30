const fs = require('fs');
const path = require('path');

const baseSrcDir = 'D:\\A21\\web scrapper\\w3schools\\www.w3schools.com';
const pythonSrcDir = path.join(baseSrcDir, 'python');

const destDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\content';
const dataDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\data';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const sections = [
    {
        title: "Python Tutorial",
        srcDir: pythonSrcDir,
        files: [
            "default.html", "python_intro.html", "python_getstarted.html", "python_syntax.html",
            "python_comments.html", "python_variables.html", "python_datatypes.html", "python_numbers.html",
            "python_casting.html", "python_strings.html", "python_booleans.html", "python_operators.html",
            "python_lists.html", "python_tuples.html", "python_sets.html", "python_dictionaries.html",
            "python_conditions.html", "python_while_loops.html", "python_for_loops.html", "python_functions.html",
            "python_lambda.html", "python_arrays.html", "python_classes.html", "python_inheritance.html",
            "python_iterators.html", "python_polymorphism.html", "python_scope.html", "python_modules.html",
            "python_datetime.html", "python_math.html", "python_json.html", "python_regex.html",
            "python_pip.html", "python_try_except.html", "python_user_input.html", "python_string_formatting.html"
        ]
    },
    {
        title: "File Handling",
        srcDir: pythonSrcDir,
        files: [
            "python_file_handling.html", "python_file_open.html", "python_file_write.html", "python_file_remove.html"
        ]
    },
    {
        title: "Python DSA",
        srcDir: pythonSrcDir,
        files: [
            "python_dsa.html", "python_dsa_binarysearch.html", "python_dsa_bubblesort.html",
            "python_dsa_linkedlists.html", "python_dsa_stacks.html", "python_dsa_queues.html"
        ]
    },
    {
        title: "Python ML",
        srcDir: pythonSrcDir,
        files: [
            "python_ml_getting_started.html", "python_ml_mean_median_mode.html",
            "python_ml_linear_regression.html", "python_ml_decision_tree.html"
        ]
    },
    {
        title: "Python MySQL",
        srcDir: pythonSrcDir,
        files: [
            "python_mysql_getstarted.html", "python_mysql_create_db.html", "python_mysql_create_table.html",
            "python_mysql_insert.html", "python_mysql_select.html"
        ]
    },
    {
        title: "Python MongoDB",
        srcDir: pythonSrcDir,
        files: [
            "python_mongodb_getstarted.html", "python_mongodb_create_db.html", "python_mongodb_create_collection.html",
            "python_mongodb_insert.html", "python_mongodb_find.html"
        ]
    },
    {
        title: "Python References",
        srcDir: pythonSrcDir,
        files: [
            "python_reference.html", "python_ref_glossary.html", "python_ref_keywords.html",
            "python_ref_functions.html", "python_ref_string.html", "python_ref_list.html",
            "python_ref_dictionary.html", "python_ref_tuple.html"
        ]
    }
];

const menuData = [];

sections.forEach(section => {
    const sectionItems = [];
    section.files.forEach(file => {
        const destFile = `python_${file}`;
        const fullPath = path.join(section.srcDir, file);
        
        if (fs.existsSync(fullPath)) {
            console.log(`Processing ${file}...`);
            let content = fs.readFileSync(fullPath, 'utf8');

            // 1. Find the main content area
            let mainMatch = content.match(/<div[^>]*id=['"]main['"][^>]*>/i);
            let startIndex = mainMatch ? content.indexOf(mainMatch[0]) + mainMatch[0].length : 0;
            let extracted = content.substring(startIndex);

            // 2. Identify and cut off unwanted bottom sections
            const endMarkers = [
                /<div[^>]*id=['"]user-profile-bottom-wrapper['"]/i,
                /<footer/i,
                /<div[^>]*id=['"]right['"]/i
            ];

            let earliestEnd = extracted.length;
            for (const marker of endMarkers) {
                const match = extracted.match(marker);
                if (match && match.index < earliestEnd) {
                    earliestEnd = match.index;
                }
            }
            
            const nextPrevMatches = [...extracted.matchAll(/<div[^>]*class=['"](w3-clear\s+)?nextprev['"]/gi)];
            if (nextPrevMatches.length > 0) {
                let bottomNextPrev = nextPrevMatches.find(m => m.index > 500);
                if (bottomNextPrev && bottomNextPrev.index < earliestEnd) {
                    earliestEnd = bottomNextPrev.index;
                }
            }

            extracted = extracted.substring(0, earliestEnd);

            // 3. Clean up the extracted content
            extracted = extracted.replace(/<div[^>]*id=['"]midcontentadcontainer['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<div[^>]*id=['"]mainLeaderboard['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<div[^>]*class=['"](w3-clear\s+)?nextprev['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<a[^>]*>Try it Yourself[\s\S]*?<\/a>/gi, "");
            extracted = extracted.replace(/<a[^>]*class=['"]w3-btn[^>]*>[\s\S]*?Try it Yourself[\s\S]*?<\/a>/gi, "");
            extracted = extracted.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

            // Generic recursive element remover
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

            extracted = removeElement(extracted, 'div', 'class', 'ws-learnhtml');
            extracted = removeElement(extracted, 'div', 'class', 'ws-hide-on-logged-in');
            extracted = removeElement(extracted, 'div', 'class', 'ws-hide-on-logged-in'); // Second pass
            extracted = removeElement(extracted, 'div', 'id', 'getdiploma');
            extracted = removeElement(extracted, 'div', 'class', 'containerlog');

            extracted = extracted.replace(/<div[^>]*id=['"]exercisecontainer['"][\s\S]*?<\/div>/gi, "");
            extracted = extracted.replace(/<h2>Track Your Progress<\/h2>/gi, "");
            extracted = extracted.replace(/<div[^>]*style=['"][^'"]*background-color:\s*#282b35[^'"]*['"][\s\S]*/gi, "");
            extracted = extracted.replace(/<!--[\s\S]*?-->/g, "");

            // 4. Handle Images
            const replaceImgPaths = (tagAttr, match, p1) => {
                if (!p1.startsWith('http') && !p1.startsWith('data:')) {
                    const imgName = path.basename(p1);
                    const possiblePaths = [
                        path.join(section.srcDir, p1),
                        path.join(section.srcDir, 'images', imgName),
                        path.join(section.srcDir, imgName),
                        path.join(pythonSrcDir, 'images', imgName)
                    ];
                    for (const imgPath of possiblePaths) {
                        if (fs.existsSync(imgPath) && !fs.lstatSync(imgPath).isDirectory()) {
                            const imgDir = path.join(destDir, 'images');
                            if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
                            fs.copyFileSync(imgPath, path.join(imgDir, imgName));
                            return `${tagAttr}="assets/content/images/${imgName}"`;
                        }
                    }
                }
                return match;
            };

            extracted = extracted.replace(/src="([^"]*)"/g, (match, p1) => replaceImgPaths('src', match, p1));

            // 5. Save the file
            fs.writeFileSync(path.join(destDir, destFile), extracted.trim());

            // 6. Extract/Set Title for Menu
            let title = file.replace('python_', '').replace('.html', '').replace(/_|-/g, ' ');
            title = title.charAt(0).toUpperCase() + title.slice(1);
            
            const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
            if (titleMatch) {
                title = titleMatch[1].replace(/<span[^>]*>|<\/span>/g, '').trim();
            }
            
            sectionItems.push({ title, file: destFile });
        }
    });
    if (sectionItems.length > 0) {
        menuData.push({ title: section.title, items: sectionItems });
    }
});

fs.writeFileSync(path.join(dataDir, 'python.json'), JSON.stringify(menuData, null, 2));
console.log('Successfully mapped Python chapters and references.');
