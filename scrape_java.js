const fs = require('fs');
const path = require('path');

const baseSrcDir = 'D:\\A21\\web scrapper\\w3schools\\www.w3schools.com';
const javaSrcDir = path.join(baseSrcDir, 'java');

const destDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\content';
const dataDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\data';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const sections = [
    {
        title: "Java Tutorial",
        srcDir: javaSrcDir,
        files: [
            "default.html", "java_intro.html", "java_getstarted.html", "java_syntax.html",
            "java_output.html", "java_comments.html", "java_variables.html", "java_data_types.html",
            "java_type_casting.html", "java_operators.html", "java_strings.html", "java_math.html",
            "java_booleans.html", "java_conditions.html", "java_switch.html", "java_while_loop.html",
            "java_for_loop.html", "java_break.html", "java_arrays.html"
        ]
    },
    {
        title: "Java Methods",
        srcDir: javaSrcDir,
        files: [
            "java_methods.html", "java_methods_param.html", "java_methods_overloading.html",
            "java_scope.html", "java_recursion.html"
        ]
    },
    {
        title: "Java Classes",
        srcDir: javaSrcDir,
        files: [
            "java_oop.html", "java_classes.html", "java_class_attributes.html", "java_class_methods.html",
            "java_constructors.html", "java_modifiers.html", "java_encapsulation.html", "java_packages.html",
            "java_inheritance.html", "java_polymorphism.html", "java_inner_classes.html", "java_abstract.html",
            "java_interface.html", "java_enums.html", "java_user_input.html", "java_date.html",
            "java_arraylist.html", "java_linkedlist.html", "java_hashmap.html", "java_hashset.html",
            "java_iterator.html", "java_wrapper_classes.html", "java_try_catch.html", "java_regex.html",
            "java_threads.html", "java_lambda.html"
        ]
    },
    {
        title: "Java File Handling",
        srcDir: javaSrcDir,
        files: [
            "java_files.html", "java_files_create.html", "java_files_read.html", "java_files_write.html", "java_files_delete.html"
        ]
    },
    {
        title: "Java How To",
        srcDir: javaSrcDir,
        files: [
            "java_howtos.html", "java_howto_add_two_numbers.html", "java_howto_count_words.html",
            "java_howto_reverse_string.html", "java_howto_sum_of_array_elements.html",
            "java_howto_area_of_rectangle.html", "java_howto_even_or_odd.html"
        ]
    },
    {
        title: "Java References",
        srcDir: javaSrcDir,
        files: [
            "java_ref_keywords.html", "java_ref_string.html", "java_ref_math.html",
            "java_ref_arraylist.html", "java_ref_hashmap.html"
        ]
    }
];

const menuData = [];

sections.forEach(section => {
    const sectionItems = [];
    section.files.forEach(file => {
        const destFile = `java_${file}`;
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
                        path.join(javaSrcDir, 'images', imgName)
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
            let title = file.replace('java_', '').replace('.html', '').replace(/_|-/g, ' ');
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

fs.writeFileSync(path.join(dataDir, 'java.json'), JSON.stringify(menuData, null, 2));
console.log('Successfully mapped Java chapters and references.');
