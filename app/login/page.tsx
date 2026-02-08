'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left Side - Video Background */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
                <div className="absolute inset-0 bg-slate-950/40 z-10 backdrop-blur-[2px]" />
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                >
                    <source src="/video/side.mp4" type="video/mp4" />
                </video>
                <div className="relative z-20 flex flex-col justify-between p-16 h-full text-white">
                    <div>
                        <div className="w-12 h-1 bg-primary mb-8 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                        <h1 className="text-5xl font-bold tracking-tight mb-4">
                            Ravibankers <br />
                            <span className="text-primary text-6xl">Gold Vault</span>
                        </h1>
                        <p className="text-white/70 text-lg font-medium max-w-md leading-relaxed">
                            Professional gold loan management for modern lending operations.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold tracking-wider text-white/40">
                        <span>Reliability</span>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span>Security</span>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span>Excellence</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-background relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
                    <div className="text-center lg:text-left">
                        <div className="w-20 h-20 gold-gradient rounded-3xl flex items-center justify-center text-white mb-8 mx-auto lg:mx-0 shadow-2xl shadow-primary/30 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                            <Lock size={36} />
                        </div>
                        <h2 className="text-4xl font-bold text-foreground tracking-tight">Admin Access</h2>
                        <p className="mt-3 text-muted-foreground font-medium">Please sign in to manage your vault.</p>
                    </div>

                    <form className="space-y-8 mt-10" onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted-foreground ml-1 tracking-wide uppercase">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-border rounded-[1.5rem] leading-5 bg-muted/10 placeholder:text-muted/40 text-foreground focus:outline-none focus:bg-muted/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 text-sm font-bold"
                                        placeholder="Admin identifier"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted-foreground ml-1 tracking-wide uppercase">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-border rounded-[1.5rem] leading-5 bg-muted/10 placeholder:text-muted/40 text-foreground focus:outline-none focus:bg-muted/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 text-sm font-bold"
                                        placeholder="Secret sequence"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-red-500/10 p-5 border border-red-500/20 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-300">
                                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
                                <p className="text-xs text-red-500 font-bold uppercase tracking-wider leading-relaxed">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-5 px-6 border-transparent rounded-2xl shadow-xl shadow-primary/20 text-sm font-bold text-white gold-gradient hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-8 focus:ring-primary/10 disabled:opacity-50 transition-all duration-300"
                        >
                            {loading ? (
                                <span className="flex items-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Validating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    Access Dashboard <ArrowRight size={20} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[10px] uppercase tracking-[0.3em] font-black text-muted opacity-40 mt-12">
                        &copy; {new Date().getFullYear()} RAVIBANKERS GOLD. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </div>
        </div>
    );
}
