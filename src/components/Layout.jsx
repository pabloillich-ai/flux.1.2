import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-text-main overflow-hidden">
            <div
                onMouseEnter={() => setIsSidebarOpen(true)}
                onMouseLeave={() => setIsSidebarOpen(false)}
                className="h-full shrink-0"
            >
                <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-card hover:scrollbar-thumb-bg-hover">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
