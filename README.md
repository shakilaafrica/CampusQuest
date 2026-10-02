# Campus Quest

Campus Quest is an interactive university orientation game developed as part of the CSC3003S Capstone Project.

Players explore a virtual campus and complete four orientation-themed missions. Player authentication, game progress, avatar selection, save/load functionality, and staff statistics are managed using Supabase.

---

# 🚀 Quick Start — Lecturer Demo

The submitted version of Campus Quest is already configured to connect to the team's Supabase demonstration database.

**No Supabase setup is required to run the submitted demonstration.**

## Prerequisites

Before running the project, ensure that the following are installed:

- Node.js
- npm

---

## 1. Extract the Project

Extract the submitted Campus Quest ZIP file.

Open a terminal inside the extracted project folder.

The correct folder is the one containing:

```text
package.json
src/
public/
vite.config.ts
vitest.config.ts
.env
```

---

## 2. Install Dependencies

Run:

```bash
npm install
```

This installs all dependencies required by the game and its automated unit tests.

---

## 3. Run the Unit Tests

Run:

```bash
npm test
```

The project uses **Vitest** and **React Testing Library** for automated unit testing.

---

## 4. Verify the Production Build

Run:

```bash
npm run build
```

This verifies that the TypeScript application compiles successfully and that Vite can create the production build.

---

## 5. Start Campus Quest

Run:

```bash
npm run dev
```

Vite will display a local development address, usually:

```text
http://localhost:5173/
```

Open the displayed address in a web browser to play Campus Quest.

---

# 🎮 Game Overview

Campus Quest is structured around a central campus map and four missions.

### Mission 1 — Jammie Rush

The player must successfully complete the Jammie Rush challenge as part of their journey around campus.

### Mission 2 — Student Wellness Services

The player navigates the Student Wellness environment, locates Kirah, completes the student-card access challenge, and completes the waiting-room challenge.

### Mission 3 — Society Fair

The player explores the Society Fair and interacts with different societies through a collection of mini-games.

### Mission 4 — Operation Student Card

The player completes the Student Card mission, including the Photo Booth challenge.

### Closing Scene — Becoming a SciKnight

After completing all four missions, the player enters the final closing sequence and completes their Campus Quest journey.

---

# 💾 Saving and Loading

Campus Quest uses Supabase to persist player information and game progress.

The system stores information including:

- Player profiles
- Selected avatars
- Mission progress
- Game sessions
- Save/Load Game data
- Staff statistics

A returning player can use the **Load Game** functionality to restore saved progress.

---

# 🔐 Supabase

The submitted demonstration is connected to the team's existing Supabase project.

The required frontend configuration is provided in the `.env` file included with the submitted demonstration ZIP.

The `.env` file is located in the project root:

```text
campus-quest/
├── .env
├── package.json
├── package-lock.json
├── src/
├── public/
└── ...
```

It contains:

```env
VITE_SUPABASE_URL=<configured-project-url>
VITE_SUPABASE_ANON_KEY=<configured-anon-key>
```

These are the frontend configuration values used by the application.

No Supabase service-role key, database administrator password, or other privileged backend credentials are included in the application.

The demonstration database has already been configured, so the lecturer does **not** need to create or configure a Supabase project.

---

# 👤 Student Authentication

Students interact with the authentication system using their student number and password.

The application supports:

- Creating a new player
- Logging into an existing player
- Starting a new game
- Loading an existing game
- Saving mission progress
- Persisting the selected avatar

Authentication is handled internally using Supabase.

---

# 👩‍🏫 Staff Access

Campus Quest also contains staff functionality for authorised lecturers/tutors.

Staff authentication is separate from student gameplay.

Authorised staff users can access game statistics after authentication.

Staff registration is restricted using the project's Supabase staff allow-list.

---

# 🧪 Unit Testing

Campus Quest includes automated unit tests covering important game functionality.

The tests currently cover areas including:

- Student-number validation
- Mission definitions and progression
- Jammie Rush behaviour
- Student Wellness waiting-room behaviour
- Student Wellness card-swipe behaviour
- Society Fair Math/Sudoku behaviour
- Operation Student Card Photo Booth behaviour
- Closing Scene card-swipe behaviour

Run all unit tests with:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To generate the unit-test coverage report:

```bash
npm run test:coverage
```

---

# 🏗️ Build

To create and verify a production build:

```bash
npm run build
```

The generated production files are placed in:

```text
dist/
```

The `dist` directory does not need to be included in the submitted source-code ZIP because it can be regenerated using the build command.

---

# 📦 Submission Structure

The submitted ZIP should contain the project source code and configuration files.

Example:

```text
campus-quest/
│
├── .env
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
│
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── levels/
│   └── ...
│
├── public/
│   └── ...
│
└── supabase/
    └── schema.sql
```

The following generated/local directories do not need to be included:

```text
node_modules/
dist/
.git/
```

Dependencies are restored using:

```bash
npm install
```

---

# 🛠️ Developer Supabase Setup

This section is only required if the project needs to be deployed using a **new Supabase project**.

It is **not required for the submitted lecturer demonstration**.

The project contains the database schema:

```text
supabase/
└── schema.sql
```

To configure a new Supabase instance:

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run the contents of `supabase/schema.sql`.
4. Enable Email authentication.
5. Enable new-user sign-ups.
6. Configure email confirmation as required.
7. Add authorised staff users to the staff registration allow-list.
8. Create a `.env` file containing the new project's URL and anon key.

---

# ✅ Verification Commands

For the submitted demonstration, the complete verification process is:

```bash
npm install
npm test
npm run build
npm run dev
```

Expected result:

- Dependencies install successfully.
- Automated unit tests pass.
- The production build completes successfully.
- Campus Quest starts locally in the browser.
- The application connects to the configured Supabase demonstration database.

---

# 💻 Technologies

Campus Quest was developed using:

- React
- TypeScript
- Vite
- Supabase
- Vitest
- React Testing Library
- HTML
- CSS

---

# 📌 Important Demo Note

The submitted `.env` file is intentionally included in the lecturer demonstration ZIP so that the application can connect directly to the configured Supabase demonstration project.

The `.env` file should remain excluded from the public Git repository.

No `setup-tests.ps1` script is required. Testing dependencies are declared in `package.json` and installed automatically through `npm install`.