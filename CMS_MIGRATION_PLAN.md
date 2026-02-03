# CMS Migration Plan (Firebase)

## 1. Overview

Transform the current file-based architecture into a dynamic Content Management System (CMS) using Firebase Firestore. This allows you to add, edit, and manage tutorials directly from the app without redeploying code.

## 2. Database Schema (Firestore)

We will move data from `assets/` to Firestore collections.

### Collection: `courses`

_Replaces `assets/courses.json`_

```json
{
  "id": "javascript",
  "title": "Javascript",
  "icon": "assets/images/js.png",
  "description": "Master JS...",
  "sortOrder": 1,
  "isActive": true
}
```

### Collection: `curriculum` (Linked to Course)

_Replaces `assets/data/javascript.json`_
_We can store the entire menu tree as a single document per course for easier ordering, OR use a subcollection if it gets too large._
**Document ID: `javascript`**

```json
{
  "sections": [
    {
      "title": "Introduction",
      "items": [
        { "title": "JS Intro", "slug": "js-intro", "isFree": true },
        { "title": "Variables", "slug": "js-variables", "isFree": true }
      ]
    }
  ]
}
```

### Collection: `content`

_Replaces `assets/content/_.md`*
**Document ID: `js-intro` (Slug)\*\*

```json
{
  "courseId": "javascript",
  "title": "JS Intro",
  "body": "# Introduction\n\nJavascript is...",
  "lastUpdated": "Timestamp",
  "authorId": "uid"
}
```

## 3. Migration Strategy

### Phase 1: Data Seeding (The "One-Time" Script)

We create a temporary script in the app to:

1. Read `courses.json` -> Write to `courses` collection.
2. Read `javascript.json` -> Write to `curriculum` collection.
3. Read every `.md` file in `assets/content/` -> Write to `content` collection.

### Phase 2: Service Layer Update

Modify `TutorialService`:

- `getCourses()` -> `firestore.collection('courses').get()`
- `getMenu()` -> `firestore.doc('curriculum/' + courseId).get()`
- `getContent()` -> `firestore.doc('content/' + slug).get()`

### Phase 3: Admin Interface (The CMS)

Create a new route `/admin` (guarded for your email only):

- **Course Manager**: Add/Edit courses.
- **Curriculum Editor**: Drag & Drop ordering of chapters.
- **Content Editor**: A rich text/markdown editor (using your Playground or a library like `ngx-markdown-editor`) to write tutorials.

## 4. Immediate Benefits

- **Instant Updates**: Fix a typo on your phone, save, and it's live for everyone.
- **Dynamic Locking**: Lock/Unlock specific chapters easily.
- **User Analytics**: Track exactly which _database_ article users are reading.
