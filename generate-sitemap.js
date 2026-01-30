const fs = require('fs');
const path = require('path');

// Base URL
const baseUrl = 'https://codingtamilan.in';
const today = new Date().toISOString().split('T')[0];

// Read courses
const coursesPath = path.join(__dirname, 'src', 'assets', 'courses.json');
const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

// Start XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Home/Dashboard -->
  <url>
    <loc>${baseUrl}/home</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

`;

let totalTutorials = 0;

// Process each course
courses.forEach(course => {
  console.log(`Processing ${course.title}...`);
  
  // Add course overview page
  xml += `  <!-- ${course.title} Course -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/course/${course.id}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n\n`;

  // Read course data file to get all tutorials
  const dataFilePath = path.join(__dirname, 'src', 'assets', 'data', `${course.id}.json`);
  
  try {
    if (fs.existsSync(dataFilePath)) {
      const courseData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      let courseTutorialCount = 0;
      
      // Add all tutorial pages
      courseData.forEach(section => {
        if (section.items && Array.isArray(section.items)) {
          section.items.forEach(item => {
            if (item.file) {
              const fileName = item.file.replace('.html', '');
              xml += `  <url>\n`;
              xml += `    <loc>${baseUrl}/tutorial/${fileName}</loc>\n`;
              xml += `    <lastmod>${today}</lastmod>\n`;
              xml += `    <changefreq>monthly</changefreq>\n`;
              xml += `    <priority>0.7</priority>\n`;
              xml += `  </url>\n`;
              courseTutorialCount++;
              totalTutorials++;
            }
          });
        }
      });
      
      console.log(`  ✓ Added ${courseTutorialCount} tutorials`);
      xml += `\n`;
    } else {
      console.log(`  ⚠ Data file not found: ${dataFilePath}`);
    }
  } catch (error) {
    console.log(`  ✗ Error processing ${course.id}: ${error.message}`);
  }
});

// Close XML
xml += `</urlset>\n`;

// Write sitemap
const sitemapPath = path.join(__dirname, 'src', 'sitemap.xml');
fs.writeFileSync(sitemapPath, xml, 'utf8');

const totalUrls = (xml.match(/<url>/g) || []).length;

console.log(`\n✅ Sitemap generated successfully!`);
console.log(`📄 Location: ${sitemapPath}`);
console.log(`📚 Courses: ${courses.length}`);
console.log(`📖 Tutorial pages: ${totalTutorials}`);
console.log(`🔗 Total URLs: ${totalUrls}`);
