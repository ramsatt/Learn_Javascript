const fs = require('fs');
const path = require('path');

const baseSrcDir = 'D:\\A21\\web scrapper\\w3schools\\www.w3schools.com';
const cssSrcDir = path.join(baseSrcDir, 'css');
const cssRefSrcDir = path.join(baseSrcDir, 'cssref');

const destDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\content';
const dataDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\data';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const sections = [
    {
        title: "CSS Tutorial",
        srcDir: cssSrcDir,
        files: [
            "default.html", "css_intro.html", "css_syntax.html", "css_selectors.html",
            "css_howto.html", "css_comments.html", "css_colors.html", "css_background.html",
            "css_border.html", "css_margin.html", "css_padding.html", "css_dimension.html",
            "css_boxmodel.html", "css_outline.html", "css_text.html", "css_font.html",
            "css_icons.html", "css_link.html", "css_list.html", "css_table.html"
        ]
    },
    {
        title: "CSS Layout",
        srcDir: cssSrcDir,
        files: [
            "css_display_visibility.html", "css_max-width.html", "css_positioning.html",
            "css_z-index.html", "css_overflow.html", "css_float.html", "css_inline-block.html",
            "css_align.html", "css_combinators.html", "css_pseudo_classes.html",
            "css_pseudo_elements.html", "css_opacity.html", "css_navbar.html",
            "css_dropdowns.html", "css_image_gallery.html", "css_image_sprites.html",
            "css_attribute_selectors.html", "css_form.html", "css_counters.html",
            "css_website_layout.html", "css_units.html", "css_specificity.html", "css_important.html"
        ]
    },
    {
        title: "CSS Advanced",
        srcDir: cssSrcDir,
        files: [
            "css3_borders.html", "css3_backgrounds.html", "css3_colors.html",
            "css3_gradients.html", "css3_gradients_conic.html", "css3_shadows.html",
            "css3_text_effects.html", "css3_fonts.html", "css3_2dtransforms.html",
            "css3_3dtransforms.html", "css3_transitions.html", "css3_animations.html",
            "css_tooltip.html", "css_image_hover_effects.html", "css_box-sizing.html",
            "css_mediaqueries.html", "css_mediaqueries_ex.html", "css3_flexbox.html", "css_grid.html"
        ]
    },
    {
        title: "CSS Responsive",
        srcDir: cssSrcDir,
        files: [
            "css_rwd_intro.html", "css_rwd_viewport.html", "css_rwd_grid.html",
            "css_rwd_mediaqueries.html", "css_rwd_images.html", "css_rwd_videos.html",
            "css_rwd_frameworks.html", "css_rwd_templates.html"
        ]
    },
    {
        title: "CSS Grid",
        srcDir: cssSrcDir,
        files: [
            "css_grid.html", "css_grid_container.html", "css_grid_item.html"
        ]
    },
    {
        title: "CSS References",
        srcDir: cssRefSrcDir,
        files: [
            "default.html", "css_selectors.html", "css_functions.html", "css_units.html",
            "css_websafe_fonts.html", "css_animatable.html", "css_default_values.html",
            "css_colors.html", "css_colors_hex.html", "css_browsersupport.html"
        ]
    }
];

const menuData = [];

sections.forEach(section => {
    const sectionItems = [];
    section.files.forEach(file => {
        const destFile = section.title === "CSS References" ? `cssref_${file}` : `css_${file}`;
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
            extracted = extracted.replace(/<a[^>]*class=['"]w3-btn[^>]*>Try it Yourself[\s\S]*?<\/a>/gi, "");
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
                        path.join(cssSrcDir, 'images', imgName),
                        path.join(cssRefSrcDir, 'images', imgName)
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
            let title = file.replace('css_', '').replace('css3_', '').replace('.html', '').replace(/_|-/g, ' ');
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

fs.writeFileSync(path.join(dataDir, 'css.json'), JSON.stringify(menuData, null, 2));
console.log('Successfully mapped CSS chapters and references.');
