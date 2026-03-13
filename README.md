# Shannon Cosmetics Website

A Node.js/Express-based website for Shannon Cosmetics with consultation form submission and email verification.

## Prerequisites

- Node.js 16+ 
- npm

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Port (optional)
PORT=8080
```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your URL and anon key
3. Create a table called `consultations` with these columns:

| Column | Type | Constraints |
|--------|------|-------------|
| name | text | required |
| email | text | required |
| date | text | nullable |
| additional_info | text | nullable |
| verification_code | text | required |
| verified | boolean | default: false |
| created_at | timestamp | default: now |

4. Enable Row Level Security (RLS) and add a policy allowing public inserts:
   ```sql
   CREATE POLICY "Allow public inserts" ON consultations
   FOR INSERT WITH CHECK (true);
   ```

### Email Setup

For Gmail, you'll need an App Password:
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account > Security > App passwords
3. Generate a new app password and use it as `EMAIL_PASS`

## Running the Server

```bash
npm start
```

The server will start on http://localhost:8080

## Development

```bash
npm run dev
```

## Features

- Static file serving
- Consultation form submission to Supabase
- Email verification with 6-digit code
- Automatic verification link handling
