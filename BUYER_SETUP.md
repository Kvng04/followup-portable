# FollowUp Buyer Setup Guide

FollowUp is a lightweight follow-up CRM built with React, Vite, TypeScript, and Supabase.

This guide explains how to install, configure, run, and deploy the application.

## 1. Requirements

Install:

* Node.js 20 or newer
* npm
* Git

Check your versions:

```bash
node -v
npm -v
git --version
```

## 2. Get the Source Code

Clone the repository:

```bash
git clone https://github.com/Kvng04/followup-portable.git
cd followup-portable
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Create a Supabase Project

Create a new project in Supabase using the buyer's own account.

Open the Supabase SQL Editor and run the complete contents of:

```text
supabase/schema.sql
```

This creates the leads table, indexes, and Row Level Security policies.

## 5. Configure Environment Variables

Create:

```text
.env.local
```

Add:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Get these values from the buyer's Supabase project settings.

Do not commit `.env.local` to Git.

The repository includes `.env.example` as a safe template.

## 6. Configure Authentication

FollowUp uses Supabase Authentication with email and password.

In Supabase:

1. Open Authentication.
2. Open Providers.
3. Make sure Email authentication is enabled.
4. Configure the project's Site URL and redirect URLs for the deployment domain.

For local development:

```text
http://localhost:5173
```

For production, add the buyer's actual deployment URL.

## 7. Run Locally

```bash
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

Test:

* Sign up
* Sign in
* Add a lead
* Edit a lead
* Delete a lead
* Change lead status
* Schedule a follow-up
* Open WhatsApp follow-up
* Sign out
* Sign back in

## 8. Build for Production

```bash
npm run build
```

The production files will be created in:

```text
dist/
```

## 9. Deploy

FollowUp is a standard Vite application.

It can be deployed to:

* Vercel
* Netlify
* Cloudflare Pages
* Other static hosting providers that support Vite

Configure these environment variables on the deployment platform:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Then deploy the application.

## 10. Supabase Security

FollowUp uses Supabase Row Level Security.

Each lead belongs to the authenticated user who created it.

Users can only:

* View their own leads
* Create their own leads
* Update their own leads
* Delete their own leads

Do not disable Row Level Security on the `leads` table.

## 11. WhatsApp

The WhatsApp follow-up feature opens a WhatsApp conversation with a prefilled message.

It does not use the WhatsApp Business API.

It does not automatically send messages.

The user must review and send the message through WhatsApp.

## 12. Production Checklist

Before launching:

* [ ] Supabase project created
* [ ] `supabase/schema.sql` executed
* [ ] Email authentication enabled
* [ ] Environment variables configured
* [ ] Application builds successfully
* [ ] Registration tested
* [ ] Login tested
* [ ] Lead creation tested
* [ ] Lead editing tested
* [ ] Lead deletion tested
* [ ] Pipeline tested
* [ ] Follow-up dates tested
* [ ] WhatsApp link tested
* [ ] Production URL added to Supabase authentication settings

## 13. Important Files

```text
src/
  App.tsx
  lib/
    supabase.ts

supabase/
  schema.sql

.env.example
```

## 14. Customization

Potential extensions include:

* Stripe or Paystack subscriptions
* AI-generated follow-up messages
* Email reminders
* SMS reminders
* WhatsApp API integrations
* Customer profiles
* Team accounts
* Analytics
* Calendar integrations
* Custom domains
* Mobile applications
* Industry-specific versions

## 15. Ownership and Credentials

The buyer should create and control their own:

* GitHub account/repository
* Supabase project
* Deployment account
* Payment provider account
* API keys
* Domain
* Other third-party services

The seller's personal credentials and accounts are not required to operate the portable version.
