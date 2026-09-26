# FollowUp

A lightweight follow-up CRM for freelancers and small businesses.

> Never lose a customer because you forgot to follow up.

FollowUp helps you track leads, schedule follow-ups, manage your sales pipeline, and open WhatsApp conversations with prefilled messages without the complexity of a full CRM.

## Live Demo

https://followup-rki70w.v2.appdeploy.ai/

The live demo is provided for product evaluation. The portable source code in this repository is designed to run independently on buyer-owned infrastructure.

## Features

* Email/password authentication with Supabase
* Private lead workspaces
* Lead creation and editing
* Lead deletion
* Follow-up scheduling
* Today's and overdue follow-ups
* Sales pipeline
* Lead status management
* Potential deal value tracking
* WhatsApp follow-up links with editable prefilled messages
* Mobile-friendly interface
* Supabase Row Level Security
* React + Vite architecture

## Tech Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Supabase Auth
* Supabase Postgres
* Supabase Row Level Security

## Project Structure

```text
src/
  App.tsx
  App.css
  index.css
  lib/
    supabase.ts

supabase/
  schema.sql

BUYER_SETUP.md
.env.example
```

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Kvng04/followup-portable.git
cd followup-portable
```

### 2. Install

```bash
npm install
```

### 3. Configure Supabase

Create your own Supabase project.

Open:

```text
supabase/schema.sql
```

Run the complete file in the Supabase SQL Editor.

This creates the leads table, indexes, constraints, and Row Level Security policies.

### 4. Configure Environment Variables

Create:

```text
.env.local
```

Add:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Never commit `.env.local`.

The repository includes `.env.example` as a safe template.

### 5. Run Locally

```bash
npm run dev
```

Open the local URL shown by Vite.

### 6. Build

```bash
npm run build
```

A successful build creates:

```text
dist/
```

## Deployment

FollowUp is a standard Vite application.

It can be deployed to:

* Vercel
* Netlify
* Cloudflare Pages
* Other static hosting platforms that support Vite

The deployment requires:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

See `BUYER_SETUP.md` for the complete setup and deployment guide.

## Security

Supabase Row Level Security protects the `leads` table.

Each lead belongs to its authenticated user.

Users can only:

* View their own leads
* Create their own leads
* Update their own leads
* Delete their own leads

Do not disable Row Level Security.

No seller-owned API keys, database credentials, or deployment secrets are required.

## WhatsApp

FollowUp uses WhatsApp links to open a conversation with a prefilled message.

It does not use the WhatsApp Business API.

It does not automatically send messages.

The user reviews and sends each message through WhatsApp.

## Product Positioning

FollowUp is intentionally smaller than a traditional CRM.

The core workflow is:

```text
Lead → Opportunity → Follow-up → WhatsApp → Outcome
```

The main question FollowUp answers is:

> Who needs a follow-up today?

## Extension Opportunities

The codebase can be extended with:

* Stripe or Paystack subscriptions
* AI-generated follow-up messages
* Email reminders
* SMS reminders
* WhatsApp API workflows
* Customer profiles
* Team accounts
* Analytics
* Calendar integrations
* Custom domains
* Mobile applications
* Industry-specific versions

## Buyer Handover

The portable version is designed for buyer-owned infrastructure.

The buyer can use their own:

* GitHub account
* Supabase project
* Deployment account
* Domain
* Payment provider
* API keys
* Third-party services

The seller's personal accounts and credentials are not required.

## License

This repository is distributed as part of a software asset sale.

Commercial usage and ownership terms should be defined in the final buyer agreement.

## Documentation

See `BUYER_SETUP.md` for the complete installation, configuration, testing, and deployment guide.
