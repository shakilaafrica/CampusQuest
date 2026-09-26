# Campus Quest — Single Vite / React / TypeScript application

This project converts the four former standalone mini-games into modules rendered by one React application.

## Run
```bash
npm install
npm run dev
```

## Architecture
- `src/App.tsx`: shared login, campus map, mission briefing, progression and level router.
- `src/levels/jammie-rush`: Level 1 module.
- `src/levels/student-wellness`: Level 2 module.
- `src/levels/society-fair`: Level 3 module, preserving all Society Fair V4 activities.
- `src/levels/student-card`: Level 4 module.
- `public/assets`: shared map/NPC assets.
- `public/society`: Society Fair art assets referenced by the Level 3 module.

There are no nested `package.json`, `index.html`, Vite apps, or iframes for the levels.
