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

## 📦 Deployment (Vercel)

This project is optimized for deployment on Vercel.

1.  Connect your GitHub account to [Vercel](https://vercel.com).
2.  Import the repository `Conect_Pulse2.1`.
3.  Vercel will automatically detect the Vite configuration.
4.  **Environment Variables**: In the Vercel project settings, add:
    - `VITE_API_URL`: `https://backend-g6uy.onrender.com`
    - `VITE_SUPABASE_URL`: (Your Supabase URL)
    - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Key)

## 📁 Project Structure
- `src/services`: API handlers and business logic.
- `src/pages`: Main application views.
- `src/components`: UI components.
- `vercel.json`: Routing configuration for SPA.

