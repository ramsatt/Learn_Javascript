
const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const filePath = String.raw`D:\A21\web scrapper\w3schools\www.w3schools.com\js\js_intro.html`;
const outputDir = String.raw`d:\a20\javascript\js-learning-app\src\assets`;

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    
    // Find sidebar
    const sidebar = doc.querySelector("#sidenav") || doc.querySelector("#leftmenuinner") || doc.querySelector(".w3-sidebar");
    
    if (!sidebar) {
        throw new Error("Sidebar container not found");
    }
    
    console.log("Found sidebar with ID:", sidebar.id, "Class:", sidebar.className);

    const menuData = [];
    let currentSection = { title: "General", items: [] };
    
    // Process all elements in the sidebar
    // We'll flatten the structure to just traverse down
    const allElements = sidebar.getElementsByTagName("*");
    
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        
        // Check for Section Headers
        if (el.tagName === 'H2') {
            if (currentSection.items.length > 0) {
                menuData.push(currentSection);
            }
            currentSection = { title: el.textContent.trim(), items: [] };
        } 
        
        // Check for Links
        if (el.tagName === 'A') {
            const href = el.getAttribute('href');
            // Check if it's a valid link to a JS file or HTML file, not javascript:void(0)
            if (href && !href.startsWith('javascript:') && !href.includes('#')) {
                // Ensure it's not a duplicate if nested elements are counted
                const title = el.textContent.trim();
                const alreadyExists = currentSection.items.some(item => item.file === href && item.title === title);
                if (!alreadyExists && title) {
                     currentSection.items.push({
                        title: title,
                        file: href
                    });
                }
            }
        }
    }
    
    if (currentSection.items.length > 0) {
        menuData.push(currentSection);
    }

    fs.writeFileSync(path.join(outputDir, 'menu_data.json'), JSON.stringify(menuData, null, 2));
    console.log('Menu data saved. Sections found:', menuData.length);
    if (menuData.length > 0) {
        console.log('First section items:', menuData[0].items.length);
    }

} catch (err) {
    console.error('Error parsing menu:', err);
}
