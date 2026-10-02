## 🚀 Installation and Setup

### Prerequisites

Before running Campus Quest, make sure you have:

- Node.js installed
- npm installed
- A Supabase account/project
- Git installed

---

### 1. Clone the Repository

```bash
git clone <repository-url>
cd campusquest
```

---

### 2. Install Dependencies

Install all required project dependencies:

```bash
npm install
```

---

### 3. Create the Environment File

Create a `.env` file in the root directory of the project.

Add your Supabase project details:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These values can be obtained from your Supabase project settings.

> Do not commit the `.env` file or private credentials to Git.

---

### 4. Configure the Supabase Database

Campus Quest uses Supabase for:

- Student authentication
- Staff authentication
- Player profiles
- Selected avatars
- Mission progress
- Game sessions
- Save/Load Game functionality
- Staff statistics

Open the **Supabase SQL Editor** and run the SQL schema provided with the project.

For example, if the project contains:

```text
supabase/
└── schema.sql
```

copy the contents of `schema.sql` into the Supabase SQL Editor and run it.

This creates the tables, functions, triggers, security policies, and other database functionality required by Campus Quest.

---

### 5. Configure Supabase Authentication

In your Supabase dashboard, go to:

**Authentication → Providers → Email**

Ensure that:

- Email authentication is enabled
- New user sign-ups are enabled
- Email confirmation is disabled for the project demonstration

Campus Quest uses the student's student number in the game interface while authentication is handled internally through Supabase.

---

### 6. Staff Accounts

Lecturer and tutor accounts must be authorised in the project's staff allow-list before they can register as staff users.

Add the required authorised staff email addresses to the appropriate Supabase staff allow-list table before testing staff registration.

Staff accounts can then access the staff statistics functionality after authentication.

---

### 7. Start Campus Quest

Run the development server:

```bash
npm run dev
```

Vite will display a local address, usually:

```text
http://localhost:5173/
```

Open this address in your browser.

---

## 🧪 Testing

Run the project's automated tests with:

```bash
npm test
```

If required, create a production build using:

```bash
npm run build
```

This can also be used to check for TypeScript or build errors before submission.

---

## 🔐 Environment Variables

The project requires the following environment variables:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Connects the application to the Supabase project |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key used by the frontend |

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never place service-role keys, passwords, or other private credentials inside the frontend `.env` file.