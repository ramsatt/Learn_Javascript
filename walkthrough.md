# Multiple Tutorials Implementation

I have successfully refactored the application to support multiple programming tutorials in one place, as requested.

## Key Changes

### 1. Architecture Refactoring
- **Course Hub**: The App now starts with a "Course Hub" view, displaying all available programming languages.
- **Data Structure**: Moved specific Javascript content to `assets/data/javascript.json` and created a central `assets/courses.json` registry.
- **Service Layer**: Updated `TutorialService` to manage the "Current Course" state and load data dynamically based on selection.

### 2. New Features
- **Course Selection**: Users can tap on any language (HTML, CSS, Python, Java, etc.) to switch the learning context.
- **Course-Specific Progress**: Gamification and Module Locking now respect the currently selected course (locks are unique to each course).

### 3. Content Integration
- **Supported Languages**: Added entries for HTML, CSS, Java, Python, jQuery, JSON, SQL, PHP, C, C++, React, Angular, MySQL, XML, Node.js, TypeScript, Git, MongoDB, ASP.NET, PostgreSQL, Go, and Kotlin.
- **Placeholder Data**: Created JSON files for all requested languages. Javascript has full content; HTML, CSS, and Python have sample content; others are initialized with empty templates ready for population.

## How to Test
1. **Open the App**: You will see the new "Explore Courses" grid.
2. **Select a Course**: Tap "Javascript" to see the existing content. Tap "HTML" or "Python" to see the new structure.
3. **Switch Context**: Use the "Back" arrow in the header to return to the Course Grid and choose another language.
4. **Locking**: Verify that unlocking modules in one course (e.g., JS) does not weirdly unlock modules in another (e.g., Python).

## Files Modified
- `src/app/services/tutorial.service.ts`: Logic for Course Management and Locking.
- `src/app/home/home.page.ts`: Logic for View Switching.
- `src/app/home/home.page.html`: UI for Course Grid and Back Navigation.
- `src/assets/courses.json`: The registry of all languages.
