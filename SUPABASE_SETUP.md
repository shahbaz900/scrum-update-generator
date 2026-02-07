# Supabase Setup Guide

To enable saving scrum updates, follow these steps:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Copy your **Project URL** and **API Key (anon)**

## 2. Create the Database Table

In Supabase Console, go to **SQL Editor** and run this query:

```sql
CREATE TABLE scrum_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  jira_issues_input TEXT,
  claude_output TEXT NOT NULL,
  timezone VARCHAR,
  public_holidays JSONB,
  created_at_local TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_scrum_updates_user_email ON scrum_updates(user_email);
CREATE INDEX idx_scrum_updates_created_at ON scrum_updates(created_at DESC);
```

## 3. Update Your Environment Variables

In your `.env.local` file, replace the placeholders:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Enable Row Level Security (Optional but Recommended)

```sql
-- Enable RLS
ALTER TABLE scrum_updates ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own records
CREATE POLICY "Users can view their own records"
  ON scrum_updates
  FOR SELECT
  USING (user_email = current_setting('app.current_user_email'));

-- Create policy: Users can insert their own records
CREATE POLICY "Users can insert their own records"
  ON scrum_updates
  FOR INSERT
  WITH CHECK (user_email = current_setting('app.current_user_email'));
```

## 5. Test the Setup

1. Restart your development server: `npm run dev`
2. Generate a scrum update
3. Click the **💾 Save** button
4. You should see a success message

## Viewing Saved Scrum Updates

You can view your saved scrum updates in the Supabase Console:
1. Go to your project → **Table Editor**
2. Select the `scrum_updates` table
3. Browse all your saved updates

## API Integration

The app will automatically save to Supabase when you click the **Save** button. The data stored includes:
- User email
- Generated timestamp
- Input (Jira issues context)
- Output (Claude's response)
- Timezone
- Public holidays used

