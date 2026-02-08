'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <main className="min-h-screen bg-background">{children}</main>;
    }

    return (
        <div className="flex bg-[#fcfcfc] dark:bg-background min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-72 p-4 md:p-10 pb-32 md:pb-10 transition-all duration-300 ease-in-out">
                {children}
            </main>
        </div>
    );
}
