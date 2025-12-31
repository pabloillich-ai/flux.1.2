# CobranzasPro - Modern Debt Management Platform

A modern, high-performance web application for debt collection management, built with **React**, **Vite**, **TailwindCSS**, and **Supabase**.

## 🚀 Features
- **Landing Page**: High-conversion design with Hero, Features, and Pricing.
- **Dashboard**: Real-time KPIs and interactive Charts (Aging, Status).
- **Kanban Board**: Drag-and-drop workflow management for clients.
- **Supabase Integration**: Ready for database connection (Clients, Invoices).
- **Modern UI**: Full dark mode/light mode capability (currently professional dark theme) with glassmorphism effects.

## 🛠️ Setup & Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment**
    - Copy `.env.example` to `.env`.
    - Fill in your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=https://tgrsofkzwjpwlprlnwpl.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```

3.  **Run Locally**
    ```bash
    npm run dev
    ```

4.  **Database Setup**
    - Go to your [Supabase Dashboard](https://supabase.com).
    - Open the **SQL Editor**.
    - Run the contents of the `schema.sql` file included in the artifacts folder.

## 📦 Deployment (Netlify)

This project is configured for seamless deployment on Netlify.

1.  Push this repository to GitHub/GitLab.
2.  Log in to [Netlify](https://netlify.com).
3.  "Import from Git".
4.  Netlify will detect the settings automatically (from `netlify.toml`).
5.  **Important**: Add your `VITE_SUPABASE_...` environment variables in the Netlify Dashboard under "Site Settings > Environment Variables".

## 📁 Project Structure
- `src/components`: Reusable UI components (Sidebar, KPICard, etc.).
- `src/pages`: Application views (Dashboard, Kanban, Landing).
- `src/lib`: Utilities (Supabase client, Chart setup).
