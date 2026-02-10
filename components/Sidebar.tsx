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
    UserCircle,
    History,
    FileDown,
    FileText,
    Table as TableIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTheme } from '@/components/ThemeProvider';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', next: '' });
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

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

    const handleExport = async (format: 'excel' | 'pdf') => {
        setExportLoading(true);
        try {
            const res = await fetch('/api/reports/full-ledger');
            const data = await res.json();

            if (format === 'excel') {
                exportToExcel(data);
            } else {
                exportToPDF(data);
            }
            setIsExporting(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const exportToExcel = (data: any[]) => {
        const workbook = XLSX.utils.book_new();

        // 1. Customer Summary Sheet (Overview)
        const customerSummary = data.map(item => ({
            'Customer Identity': item.user.name,
            'Contact String': item.user.phone,
            'Base Location': item.user.address,
            'Active Count': item.activeLoans.length,
            'Archive Count': item.completedLoans.length,
            'Total Collateral (g)': item.goldItems.reduce((acc: number, g: any) => acc + g.weight, 0),
            'Outstanding Dues': item.activeLoans.reduce((acc: number, l: any) => acc + l.totalAmount, 0),
            'Registry ID': item.user._id?.toString()
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(customerSummary), 'Vault Overview');

        // 2. Master Resource Ledger (Detailed with Filters)
        const masterLedger = data.flatMap(item => {
            const { user, activeLoans, completedLoans } = item;
            const allLoans = [...activeLoans, ...completedLoans];

            return allLoans.map((loan: any) => {
                const startDate = new Date(loan.startDate);
                const isCompleted = loan.status === 'completed' || !loan.totalAmount;

                return {
                    'Identity': user.name,
                    'Gold ID': loan.goldId?.goldId || 'N/A',
                    'Operational Status': isCompleted ? 'SETTLED' : 'ACTIVE',
                    'Asset Category': loan.goldId?.category || 'N/A',
                    'Gold Purity': loan.goldId?.goldType || 'N/A',
                    'Mass (g)': loan.goldId?.weight || 0,
                    'Principal Magnitude': loan.principalAmount,
                    'Current Valuation (Interest Included)': isCompleted ? loan.totalPaid : loan.totalAmount,
                    'Assigned Year': startDate.getFullYear(),
                    'Assigned Month': startDate.toLocaleString('default', { month: 'long' }),
                    'Assigned Date': startDate.toLocaleDateString(),
                    'Settlement Date': isCompleted && loan.completedDate ? new Date(loan.completedDate).toLocaleDateString() : 'N/A',
                    'Duration (Months)': loan.durationMonths || 'N/A',
                    'Internal Reference': loan._id?.toString()
                };
            });
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(masterLedger), 'Master Ledger');

        // 3. Granular Activity Stream
        const activityStream = data.flatMap(item => {
            const { payments, user } = item;
            return payments.map((p: any) => {
                const pDate = new Date(p.paymentDate);
                return {
                    'Identity': user.name,
                    'Gold ID': (p.loanId as any)?.goldId?.goldId || 'N/A',
                    'Activity Date': pDate.toLocaleDateString(),
                    'Activity Time': pDate.toLocaleTimeString(),
                    'Magnitude (Rs.)': p.amount,
                    'Residual Balance': p.remainingAmount,
                    'Yearly Stamp': pDate.getFullYear(),
                    'Monthly Stamp': pDate.toLocaleString('default', { month: 'long' }),
                    'Activity Code': 'PAYMENT_RECEIVED'
                };
            });
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(activityStream), 'Lifecycle History');

        XLSX.writeFile(workbook, `GoldVault_Master_Archive_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = (data: any[]) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        const drawSectionHeader = (text: string, x: number, y: number) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(text.toUpperCase(), x, y);
            doc.setDrawColor(212, 175, 55); // Removed invalid alpha argument
            doc.line(x, y + 2, x + 30, y + 2);
        };

        const drawAssetMiniHeader = (goldId: string, category: string, y: number) => {
            doc.setFillColor(30, 30, 35);
            doc.roundedRect(15, y, 180, 8, 1, 1, 'F');
            doc.setTextColor(212, 175, 55);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text(`ASSET ID: ${goldId}`, 20, y + 5.5);
            doc.setTextColor(255, 255, 255);
            doc.text(category.toUpperCase(), 190, y + 5.5, { align: 'right' });
        };

        const safeDate = (dateStr: any) => {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
        };

        const safeTime = (dateStr: any) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        // Cover Page
        doc.setFillColor(15, 15, 20);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        for (let i = 0; i < 70; i++) {
            doc.setFillColor(212, 175, 55);
            doc.circle(pageWidth, 0, 180 - i * 2.5, 'F');
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(40);
        doc.setFont("helvetica", "bold");
        doc.text("GOLDVAULT", 20, 80);

        doc.setFontSize(14);
        doc.setTextColor(212, 175, 55);
        doc.text("PREMIUM ARCHIVE LEDGER", 20, 92);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`ARCHIVE DATE: ${new Date().toLocaleDateString()}`, 20, 115);
        doc.text(`PROTECTED IDENTITIES: ${data.length}`, 20, 121);

        doc.setDrawColor(212, 175, 55);
        doc.line(20, 140, 80, 140);

        data.forEach((item, index) => {
            doc.addPage();
            const { user, activeLoans, completedLoans, payments } = item;

            // Layout Canvas
            doc.setFillColor(252, 252, 254);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Branding Bar (Compacted)
            doc.setFillColor(28, 28, 35);
            doc.rect(0, 0, pageWidth, 45, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(user.name.toUpperCase(), 15, 25);

            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(`CORE REGISTRY: ${user._id?.toString().toUpperCase()}`, 15, 33);

            doc.setTextColor(212, 175, 55);
            doc.text("COMMUNICATION STREAM", 140, 20);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text(user.phone, 140, 25);
            doc.text(user.address, 140, 38);

            let currentY = 55;

            // Compact Metrics
            const totalLiability = activeLoans.reduce((acc: number, l: any) => acc + (l.totalAmount || 0), 0);
            const totalMass = item.goldItems.reduce((acc: number, g: any) => acc + (g.weight || 0), 0);

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(230, 230, 235);
            doc.roundedRect(15, currentY, 85, 18, 2, 2, 'FD');
            doc.roundedRect(110, currentY, 85, 18, 2, 2, 'FD');

            doc.setTextColor(150); doc.setFontSize(6);
            doc.text("OUTSTANDING LIABILITY", 20, currentY + 7);
            doc.text("ASSET MASS", 115, currentY + 7);

            doc.setTextColor(220, 38, 38); doc.setFontSize(11);
            doc.text(`Rs. ${totalLiability.toLocaleString()}`, 20, currentY + 14);

            doc.setTextColor(28, 28, 35);
            doc.text(`${totalMass}g (Au)`, 115, currentY + 14);

            currentY += 28;

            // Portfolio Sect
            drawSectionHeader("Current Asset Portfolio", 15, currentY);
            currentY += 8;

            if (activeLoans.length > 0) {
                autoTable(doc, {
                    startY: currentY,
                    head: [['Asset', 'Category', 'Mass', 'Purity', 'Outstanding']],
                    body: activeLoans.map((l: any) => [
                        l.goldId?.goldId || 'N/A',
                        l.goldId?.category || 'N/A',
                        `${l.goldId?.weight}g`,
                        l.goldId?.goldType || 'N/A',
                        `Rs. ${(l.totalAmount || 0).toLocaleString()}`
                    ]),
                    styles: { fontSize: 7, font: 'helvetica', cellPadding: 2 },
                    headStyles: { fillColor: [28, 28, 35], textColor: [255, 255, 255], minCellHeight: 8 },
                    margin: { left: 15, right: 15 },
                    theme: 'grid'
                });
                currentY = (doc as any).lastAutoTable.finalY + 10;
            }

            // Grouped Lifecycle History
            drawSectionHeader("Asset Transaction History", 15, currentY);
            currentY += 8;

            const allRelevantLoans = [...activeLoans, ...completedLoans];

            if (allRelevantLoans.length === 0) {
                doc.setFontSize(7); doc.setTextColor(200);
                doc.text("No historical activity detected.", 15, currentY + 5);
            } else {
                // 1. Group by Gold ID
                const groupedAssets: Record<string, { category: string, loans: any[], matchingPayments: any[] }> = {};

                allRelevantLoans.forEach(loan => {
                    const goldId = loan.goldId?.goldId;
                    if (!goldId) return;

                    if (!groupedAssets[goldId]) {
                        groupedAssets[goldId] = {
                            category: loan.goldId?.category || 'N/A',
                            loans: [],
                            matchingPayments: []
                        };
                    }
                    groupedAssets[goldId].loans.push(loan);
                });

                // 2. Populate Payments for each group
                Object.keys(groupedAssets).forEach(goldId => {
                    const loanIds = groupedAssets[goldId].loans.map(l => l._id.toString());
                    groupedAssets[goldId].matchingPayments = payments.filter((p: any) =>
                        loanIds.includes((p.loanId as any)?._id?.toString())
                    );
                });

                // 3. Render Each Group
                Object.entries(groupedAssets).forEach(([goldId, group]) => {
                    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }

                    drawAssetMiniHeader(goldId, group.category, currentY);
                    currentY += 9;

                    const unifiedLog = [
                        ...group.loans.map((loan: any) => ({
                            dateStr: loan.startDate,
                            event: 'INITIATION',
                            magnitude: `+Rs. ${(loan.principalAmount || 0).toLocaleString()}`,
                            balance: `Rs. ${(loan.principalAmount || 0).toLocaleString()}`,
                            status: 'ACTIVE'
                        })),
                        ...group.matchingPayments.map((p: any) => ({
                            dateStr: p.paymentDate,
                            event: 'PAYMENT',
                            magnitude: `-Rs. ${(p.amount || 0).toLocaleString()}`,
                            balance: `Rs. ${(p.remainingAmount || 0).toLocaleString()}`,
                            status: 'RECORDED'
                        })),
                        ...group.loans.filter((l: any) => l.status === 'completed').map((loan: any) => ({
                            dateStr: loan.completedDate,
                            event: 'SETTLED',
                            magnitude: 'CLOSED',
                            balance: 'Rs. 0',
                            status: 'CLOSED'
                        }))
                    ].sort((a, b) => {
                        const tA = new Date(a.dateStr || 0).getTime();
                        const tB = new Date(b.dateStr || 0).getTime();
                        return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
                    });

                    autoTable(doc, {
                        startY: currentY,
                        head: [['TIME', 'EVENT', 'MAGNITUDE', 'BALANCE', 'STATUS']],
                        body: unifiedLog.map(e => [
                            `${safeDate(e.dateStr)} ${safeTime(e.dateStr)}`,
                            e.event,
                            e.magnitude,
                            e.balance,
                            e.status
                        ]),
                        styles: { fontSize: 6.5, font: 'helvetica', cellPadding: 1.5 },
                        headStyles: { fillColor: [248, 248, 250], textColor: [80, 80, 80], fontStyle: 'bold', minCellHeight: 6 },
                        margin: { left: 15, right: 15 },
                        columnStyles: {
                            2: { fontStyle: 'bold' },
                            3: { fontStyle: 'bold', textColor: [40, 40, 40] }
                        }
                    });

                    currentY = (doc as any).lastAutoTable.finalY + 6;
                });
            }
        });

        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(6);
            doc.setTextColor(180);
            doc.text(`GOLDVAULT SECURITY ARCHIVE | PAGE ${i}/${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }

        doc.save(`GoldVault_Security_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const links = [
        { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={22} /> },
        { name: 'Customers', href: '/users', icon: <Users size={22} /> },
        { name: 'Transactions', href: '/transactions', icon: <History size={22} /> },
    ];

    const ProfileMenu = ({ isMobile = false }) => (
        <div className={`absolute ${isMobile ? 'bottom-20 right-0' : 'bottom-20 left-0'} w-52 glass-card rounded-2xl overflow-hidden z-[60] animate-in slide-in-from-bottom-2 duration-200 border-border`}>
            <div className="p-3 border-b border-border/50 bg-muted/20">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-2">Account Settings</p>
            </div>
            {/* Theme Toggle moved here for mobile/desktop profile menu */}
            <button
                onClick={() => { toggleTheme(); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
            >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button
                onClick={() => { setIsChangingPassword(true); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
            >
                <Key size={16} />
                Change Password
            </button>
            <button
                onClick={() => { setIsExporting(true); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
            >
                <FileDown size={16} />
                Export Ledger
            </button>
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-t border-border/50"
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

                <Link
                    href="/transactions"
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${pathname === '/transactions' ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
                >
                    <History size={24} strokeWidth={pathname === '/transactions' ? 2.5 : 2} />
                </Link>

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

            {/* Export Ledger Modal */}
            {isExporting && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
                    <div className="glass-card rounded-[2.5rem] w-full max-w-lg overflow-hidden border-border shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">Data Extraction</h2>
                            <p className="text-[10px] font-black text-muted mb-10 uppercase tracking-[0.2em]">Select Output Methodology</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button
                                    onClick={() => handleExport('excel')}
                                    disabled={exportLoading}
                                    className="group bg-muted/20 border-2 border-border p-8 rounded-[2rem] hover:border-emerald-500/50 transition-all text-left space-y-4 hover:bg-emerald-500/5 disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <TableIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground uppercase tracking-tight">Excel Spreadsheet</h3>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Industrial Grade Ledger</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleExport('pdf')}
                                    disabled={exportLoading}
                                    className="group bg-muted/20 border-2 border-border p-8 rounded-[2rem] hover:border-red-500/50 transition-all text-left space-y-4 hover:bg-red-500/5 disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground uppercase tracking-tight">PDF Document</h3>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Premium Archive Report</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setIsExporting(false)}
                                className="w-full bg-muted/50 text-foreground py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-all mt-10"
                            >
                                Abort Extraction
                            </button>
                        </div>

                        {exportLoading && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[120]">
                                <div className="text-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Synthesizing Data...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
