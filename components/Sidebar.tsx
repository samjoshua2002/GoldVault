'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    Plus,
    Sun,
    Moon,
    User as UserIcon,
    Key,
    UserCircle
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', next: '' });
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.next
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Password changed successfully');
                setIsChangingPassword(false);
                setPasswords({ current: '', next: '' });
            } else {
                alert(data.error || 'Failed to change password');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const links = [
        { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={22} /> },
        { name: 'Customers', href: '/users', icon: <Users size={22} /> },
    ];

    const ProfileMenu = ({ isMobile = false }) => (
        <div className={`absolute ${isMobile ? 'bottom-20 right-0' : 'bottom-20 left-0'} w-52 glass-card rounded-2xl overflow-hidden z-[60] animate-in slide-in-from-bottom-2 duration-200 border-border`}>
            <div className="p-3 border-b border-border/50 bg-muted/20">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-2">Account Settings</p>
            </div>
            <button
                onClick={() => { setIsChangingPassword(true); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
            >
                <Key size={16} />
                Change Password
            </button>
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
            >
                <LogOut size={16} />
                Sign Out
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-sidebar-bg border-r border-border flex-col shadow-[10px_0_50px_rgba(0,0,0,0.02)] z-50">
                <div className="p-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20 rotate-1">
                        <UserCircle className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gold<span className="text-primary">Vault</span></h1>
                        <p className="text-[11px] text-muted font-semibold tracking-wide">Secure Management</p>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-2 mt-6">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group font-bold text-sm ${isActive
                                    ? 'gold-gradient text-white shadow-lg shadow-primary/20'
                                    : 'text-muted hover:bg-muted/50 hover:text-foreground border-2 border-transparent'
                                    }`}
                            >
                                <span className={`${isActive ? 'text-white' : 'text-muted group-hover:text-primary transition-colors'}`}>
                                    {link.icon}
                                </span>
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 space-y-6">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="w-full h-14 bg-muted/20 rounded-2xl flex items-center justify-center gap-4 hover:border-primary transition-all text-xs font-bold text-foreground border-2 border-border shadow-sm"
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon size={18} className="text-muted" />
                                <span>Dark Mode</span>
                            </>
                        ) : (
                            <>
                                <Sun size={18} className="text-primary" />
                                <span>Light Mode</span>
                            </>
                        )}
                    </button>

                    <div className="relative">
                        {showProfileMenu && <ProfileMenu />}
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className={`w-full bg-muted/10 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-muted/20 transition-all border-2 ${showProfileMenu ? 'border-primary' : 'border-border'}`}
                        >
                            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white font-bold text-sm shadow-md">
                                RB
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-bold text-foreground truncate">Ravibankers</p>
                                <p className="text-[11px] text-muted font-medium truncate">Administrator</p>
                            </div>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 glass rounded-[2.5rem] flex justify-between items-center px-4 z-50 shadow-2xl border border-white/20">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${pathname === '/' ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
                >
                    <LayoutDashboard size={24} strokeWidth={pathname === '/' ? 2.5 : 2} />
                </Link>

                <Link
                    href="/users"
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${pathname.startsWith('/users') ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
                >
                    <Users size={24} strokeWidth={pathname.startsWith('/users') ? 2.5 : 2} />
                </Link>

                {/* Plus Button - Now Inline */}
                <button
                    onClick={() => router.push('/?action=new')}
                    className="w-14 h-14 gold-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transform active:scale-90 transition-all"
                >
                    <Plus size={28} strokeWidth={2.5} className="text-white" />
                </button>

                <button
                    onClick={toggleTheme}
                    className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-muted hover:text-foreground"
                >
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} className="text-primary" />}
                </button>

                <div className="relative">
                    {showProfileMenu && <ProfileMenu isMobile />}
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className={`w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-white font-bold shadow-lg border-2 ${showProfileMenu ? 'border-primary' : 'border-white/50'}`}
                    >
                        RB
                    </button>
                </div>
            </nav>

            {/* Change Password Modal */}
            {isChangingPassword && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
                    <div className="glass-card rounded-[2.5rem] w-full max-w-md overflow-hidden border-border shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">Security Protocol</h2>
                            <p className="text-[10px] font-black text-muted mb-10 uppercase tracking-[0.2em]">Update Authentication Credentials</p>

                            <form onSubmit={handleChangePassword} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-2">Current Credential</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-muted/20 border-2 border-border rounded-2xl p-5 text-foreground font-bold focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-muted/30"
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-2">New Security Hash</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-muted/20 border-2 border-border rounded-2xl p-5 text-foreground font-bold focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-muted/30"
                                        value={passwords.next}
                                        onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingPassword(false)}
                                        className="flex-1 bg-muted/50 text-foreground py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] gold-gradient text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Authorizing...' : 'Commit Change'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
