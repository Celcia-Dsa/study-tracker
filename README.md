# My Study Space — componentized Next.js code

This folder contains the source files to copy into your existing Next.js + JavaScript + Tailwind project.

## Copy these files

Copy the `src/components/` folder, `src/lib/study.js`, and replace `src/app/page.js` with the version in this folder. Do not replace your existing `package.json`, `layout.js`, or `globals.css`.

Your project should look like this:

```text
src/
  app/
    page.js
    layout.js
    globals.css
  components/
    EmptyState.jsx
    ProgressSection.jsx
    Sidebar.jsx
    StatCard.jsx
    TopicCard.jsx
    TopicFormModal.jsx
  lib/
    study.js
```

## Run it

From your project folder:

```bash
npm run dev
```

The app keeps using the existing LocalStorage key `my-study-space-topics`, so your current topics should remain available.

## Included

- Add and edit topics repeatedly
- Learning notes and “what to revisit” notes
- Delete topics
- Category filtering and search
- Due reviews and spaced-repetition schedule
- Progress dashboard
- LocalStorage persistence

No streaks or daily goals are included.
