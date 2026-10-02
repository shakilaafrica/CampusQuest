## 🚀 Installation and Setup

Campus Quest is a React + TypeScript application built with Vite and Supabase.

### Prerequisites

Before running Campus Quest, ensure the following are installed:

- Node.js
- npm
- Git (only required when cloning the repository)
- Access to the configured Supabase project

---

## 1. Download or Clone the Project

### Option A — Downloaded ZIP

Extract the Campus Quest ZIP file and open a terminal inside the extracted project folder.

The terminal should be in the folder containing:

```text
package.json
src/
public/
vite.config.ts
vitest.config.ts
```

### Option B — Git Repository

```bash
git clone <repository-url>
cd campusquest
```

---

## 2. Install Dependencies

The submitted project does not require `node_modules` to be included.

Install all dependencies using:

```bash
npm install
```

This installs both the game dependencies and the packages required to run the unit tests.

---

## 3. Configure Environment Variables

Create a file named:

```text
.env
```

in the root directory of the project.

Add:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These values are obtained from the Supabase project settings.

> Do not place service-role keys, passwords, or other private credentials in the frontend `.env` file.

---

## 4. Configure the Supabase Database

Campus Quest uses Supabase for:

- Student authentication
- Staff authentication
- Player profiles
- Avatar selection
- Mission progress
- Game sessions
- Save/Load Game functionality
- Staff statistics

The database schema is provided with the project:

```text
supabase/
└── schema.sql
```

To configure a new Supabase project:

1. Open the Supabase Dashboard.
2. Open the SQL Editor.
3. Copy the contents of `supabase/schema.sql`.
4. Run the SQL script.

This creates the required database tables, functions, triggers, security policies, and supporting database functionality.

---

## 5. Configure Supabase Authentication

In the Supabase Dashboard, navigate to:

**Authentication → Providers → Email**

Ensure that:

- Email authentication is enabled.
- New user sign-ups are enabled.
- Email confirmation is disabled for the project demonstration.

Students interact with the system using their student number and password. Supabase authentication is handled internally by the application.

---

## 6. Staff Accounts

Staff accounts must first be authorised in the project's staff registration allow-list.

Add the lecturer/tutor email address to the appropriate staff allow-list table in Supabase.

An authorised staff member can then register/login through the staff interface and access the game's statistics functionality.

---

# ▶️ Running the Game

From the project root, run:

```bash
npm run dev
```

Vite will display a local development address, normally:

```text
http://localhost:5173/
```

Open the address in a web browser.

---

# 🧪 Unit Testing

Campus Quest includes automated unit tests implemented using **Vitest** and **React Testing Library**.

Run all unit tests using:

```bash
npm test
```

The tests cover important game functionality including:

- Student-number validation
- Mission definitions and progression
- Jammie Rush behaviour
- Student Wellness doctor waiting-room logic
- Student Wellness card-swipe behaviour
- Society Fair Math/Sudoku logic
- Operation Student Card Photo Booth behaviour
- Closing Scene card-swipe behaviour

To generate the test coverage report, run:

```bash
npm run test:coverage
```

To run Vitest in watch mode during development:

```bash
npm run test:watch
```

---

# 🏗️ Production Build

To verify that the TypeScript project compiles and that Vite can successfully create a production build, run:

```bash
npm run build
```

A successful build creates the production files in:

```text
dist/
```

---

# ✅ Recommended Verification

After downloading/extracting the project, the following commands can be used to verify the submission:

```bash
npm install
npm test
npm run build
npm run dev
```

Expected result:

1. Dependencies install successfully.
2. Unit tests pass.
3. The project builds without TypeScript/Vite errors.
4. Campus Quest launches in the browser.
5. Student authentication and game saving connect to Supabase when the required `.env` configuration is present.

---

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Connects Campus Quest to the Supabase project |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon key used by the frontend |

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The `.env` file should not be committed to the Git repository.

---

## 📦 Submission Notes

The submitted ZIP does **not** need to contain the `node_modules` directory.

After extracting the ZIP, dependencies can be restored with:

```bash
npm install
```

The project should be run from the directory containing `package.json`.

The PowerShell `setup-tests.ps1` script is **not required** to run or test the submitted project. All testing dependencies are already declared in `package.json` and are installed through `npm install`.