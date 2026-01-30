const fs = require('fs');
const path = require('path');

const baseSrcDir = 'D:\\A21\\web scrapper\\w3schools\\www.w3schools.com';
const htmlSrcDir = path.join(baseSrcDir, 'html');
const tagsSrcDir = path.join(baseSrcDir, 'tags');

const destDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\content';
const dataDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\data';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// List of sections and files to process
const sections = [
    {
        title: "HTML Tutorial",
        srcDir: htmlSrcDir,
        files: [
            "default.html", "html_intro.html", "html_editors.html", "html_basic.html",
            "html_elements.html", "html_attributes.html", "html_headings.html",
            "html_paragraphs.html", "html_styles.html", "html_formatting.html",
            "html_quotation_elements.html", "html_comments.html", "html_colors.html",
            "html_colors_rgb.html", "html_colors_hex.html", "html_colors_hsl.html",
            "html_css.html", "html_links.html", "html_links_colors.html",
            "html_links_bookmarks.html", "html_images.html", "html_images_imagemap.html",
            "html_images_background.html", "html_images_picture.html", "html_favicon.html",
            "html_page_title.html", "html_tables.html", "html_table_borders.html",
            "html_table_sizes.html", "html_table_headers.html", "html_table_padding_spacing.html",
            "html_table_colspan_rowspan.html", "html_table_styling.html", "html_table_colgroup.html",
            "html_lists.html", "html_lists_unordered.html", "html_lists_ordered.html",
            "html_lists_other.html", "html_blocks.html", "html_div.html", "html_classes.html",
            "html_id.html", "html_iframe.html", "html_scripts.html", "html_filepaths.html",
            "html_head.html", "html_layout.html", "html_computercode_elements.html",
            "html_entities.html", "html_symbols.html", "html_emojis.html",
            "html_charset.html", "html_urlencode.html", "html_xhtml.html"
        ]
    },
    {
        title: "HTML Forms",
        srcDir: htmlSrcDir,
        files: [
            "html_forms.html", "html_form_elements.html", "html_form_input_types.html",
            "html_form_attributes.html", "html_form_attributes_form.html"
        ]
    },
    {
        title: "HTML Graphics",
        srcDir: htmlSrcDir,
        files: [ "html5_canvas.html", "html5_svg.html" ]
    },
    {
        title: "HTML Media",
        srcDir: htmlSrcDir,
        files: [ "html_media.html", "html5_video.html", "html5_audio.html", "html_youtube.html" ]
    },
    {
        title: "HTML APIs",
        srcDir: htmlSrcDir,
        files: [
            "html5_api_whatis.html", "html5_geolocation.html", "html5_draganddrop.html",
            "html5_webstorage.html", "html5_webworkers.html", "html5_serversentevents.html"
        ]
    },
    {
        title: "HTML References",
        srcDir: tagsSrcDir,
        files: [
            "default.html", "ref_html_browsersupport.html", "ref_attributes.html",
            "ref_standardattributes.html", "ref_eventattributes.html", "ref_colornames.html",
            "ref_canvas.html", "ref_av_dom.html", "ref_charactersets.html",
            "ref_urlencode.html", "ref_language_codes.html", "ref_country_codes.html",
            "ref_httpmessages.html", "ref_pxtoemconversion.html", "ref_keyboardshortcuts.html"
        ]
    }
];

const menuData = [];

sections.forEach(section => {
    const sectionItems = [];
    section.files.forEach(file => {
        // Fix prefix logic: only prefix if it doesn't already start with ref_
        // and only for the References section to avoid collision with tutorial files.
        let destFile = file;
        if (section.title === "HTML References") {
            destFile = file.startsWith('ref_') ? file : `ref_${file}`;
        }
        
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
                        path.join(htmlSrcDir, 'images', imgName),
                        path.join(tagsSrcDir, 'images', imgName)
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
            extracted = extracted.replace(/srcset="([^"]*)"/g, (match, p1) => {
                const parts = p1.split(',').map(part => {
                    const bits = part.trim().split(/\s+/);
                    const url = bits[0];
                    const descriptor = bits[1] || "";
                    const replaced = replaceImgPaths('', '="' + url + '"', url);
                    const newUrlMatch = replaced.match(/"([^"]*)"/);
                    const newUrl = newUrlMatch ? newUrlMatch[1] : url;
                    return descriptor ? `${newUrl} ${descriptor}` : newUrl;
                });
                return `srcset="${parts.join(', ')}"`;
            });

            // 5. Save the file
            fs.writeFileSync(path.join(destDir, destFile), extracted.trim());

            // 6. Extract/Set Title for Menu
            let title = file.replace('html_', '').replace('ref_', '').replace('.html', '').replace(/_|-/g, ' ');
            title = title.charAt(0).toUpperCase() + title.slice(1);
            
            // Custom mapping for references based on image
            const refTitles = {
                "default.html": "HTML Elements",
                "ref_html_browsersupport.html": "Browser Support",
                "ref_attributes.html": "Attributes",
                "ref_standardattributes.html": "Global Attributes",
                "ref_eventattributes.html": "Event Attributes",
                "ref_colornames.html": "Color Names",
                "ref_canvas.html": "Canvas",
                "ref_av_dom.html": "Audio/Video DOM",
                "ref_charactersets.html": "Character Sets",
                "ref_urlencode.html": "URL Encoding",
                "ref_language_codes.html": "Language Codes",
                "ref_country_codes.html": "Country Codes",
                "ref_httpmessages.html": "HTTP Messages",
                "ref_pxtoemconversion.html": "Px to Em Converter",
                "ref_keyboardshortcuts.html": "Keyboard Shortcuts"
            };

            if (section.title === "HTML References" && refTitles[file]) {
                title = refTitles[file];
            } else {
                const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
                if (titleMatch) {
                    title = titleMatch[1].replace(/<span[^>]*>|<\/span>/g, '').trim();
                }
            }
            
            sectionItems.push({ title, file: destFile });
        }
    });
    if (sectionItems.length > 0) {
        menuData.push({ title: section.title, items: sectionItems });
    }
});

fs.writeFileSync(path.join(dataDir, 'html.json'), JSON.stringify(menuData, null, 2));
console.log('Successfully mapped chapters and references.');
