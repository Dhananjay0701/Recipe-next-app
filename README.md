# Recipe App with Supabase

A recipe management application built with Next.js and Supabase for data storage.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Recipe_vercel
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com) if you don't have one
2. Create a new Supabase project
3. In the Supabase dashboard, go to SQL Editor and run the following SQL to create the recipes table:

```sql
CREATE TABLE IF NOT EXISTS recipes (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  image_path TEXT,
  date TEXT,
  rating REAL,
  recipe_text TEXT,
  ingredients JSONB DEFAULT '[]',
  links JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]'
);
```

4. Go to Project Settings → API and copy your project URL and anon key

### 4. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

2. Open `.env.local` and update it with your Supabase project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Migrate Existing Recipes to Supabase

If you have existing recipes in the `data/recipes.json` file, run the migration script:

```bash
npm install dotenv
node data/migrate_to_supabase.js
```

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Building for Production

```bash
npm run build
npm run start
```

## Features

- View all recipes
- Add new recipes with images
- View recipe details
- Edit existing recipes
- Delete recipes
- Store recipe ingredients, links, and photos

## Technology Stack

- Next.js - Frontend and API routes
- Supabase - Database and storage
- React - UI components 