import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, LayoutDashboard, History as HistoryIcon, PlusSquare, Sparkles, Trophy, Settings, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/Theme/theme-toggle';
import { Footer } from '@/components/Footer/Footer';
// NOTE: Home is not used in the primary items anymore; kept import if needed elsewhere

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRIMARY_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Assessment', path: '/ai-assessment', icon: Sparkles },
  { label: 'History', path: '/history', icon: HistoryIcon },
  { label: 'Create Quiz', path: '/admin/create', icon: PlusSquare },
];

const SECONDARY_ITEMS: NavItem[] = [
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AISidebar({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => {
    const p = location.pathname;
    if (path === '/ai-assessment') return p.startsWith('/ai-assessment') || p.startsWith('/assessment');
    if (path === '/admin/create') return p.startsWith('/admin/create') || p.startsWith('/create');
    if (path === '/leaderboard') return p.startsWith('/leaderboard');
    return p === path || p.startsWith(path + '/');
  };

  const baseItemCls = 'h-12 px-3 flex items-center gap-3 rounded-md transition-all duration-200 cursor-pointer';

  // Mobile sidebar overlay
  const MobileSidebarOverlay = () => (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[240px] z-50 border-r 
         bg-gradient-to-b from-violet-100 via-indigo-100 to-indigo-200 
         dark:from-violet-950 dark:via-violet-900 dark:to-indigo-950 
         text-slate-700 dark:text-slate-200 border-border transform transition-transform duration-300 md:hidden ${
           isMobileOpen ? 'translate-x-0' : '-translate-x-full'
         }`}
        style={{ paddingTop: 12 }}
      >
        {/* Brand at top */}
        <div className="flex items-center justify-between px-3 py-1">
          <div className="flex items-center">
            <div className="w-8 h-8 ai-button-gradient ai-rounded-lg flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="ml-2 ai-text-gradient p-1 font-bold text-xl">Nebula AI Quiz</div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
          >
            <span className="text-red-500 text-lg">×</span>
          </button>
        </div>
        <div className="mx-3 my-2 border-t border-white/40 dark:border-white/10" />

        <nav className="px-2 space-y-1 py-4">
          {PRIMARY_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileOpen(false);
                }}
                 className={`${baseItemCls} ${active ? 'active' : 'inactive'} ${
                    active
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-400 text-white font-semibold border-l-4 border-fuchsia-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}
                style={{ marginBottom: 4 }}
              >
                 <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}

          <div style={{ height: 32 }} />

           {SECONDARY_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                 onClick={() => {
                   navigate(item.path);
                   setIsMobileOpen(false);
                 }}
                 className={`nav-item ${baseItemCls} ${active ? 'active' : 'inactive'} ${
                   active
                     ? 'bg-gradient-to-r from-violet-500 to-indigo-400 text-white font-semibold border-l-4 border-fuchsia-500'
                     : 'text-slate-600 dark:text-slate-300 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 hover:text-slate-800 dark:hover:text-slate-100'
                 }`}
                style={{ marginBottom: 4 }}
              >
                 <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </nav>

         <div className="absolute bottom-4 left-3 right-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-[#94A3B8]">
              <div className="font-medium text-foreground truncate max-w-[160px]">{(sessionStorage.getItem('quiz_user') && JSON.parse(sessionStorage.getItem('quiz_user') as string).username) || 'Guest'}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{(sessionStorage.getItem('quiz_user') && JSON.parse(sessionStorage.getItem('quiz_user') as string).email) || 'Not signed in'}</div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => {
                sessionStorage.removeItem('quiz_user');
                navigate('/home');
                setIsMobileOpen(false);
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={
          `hidden md:block fixed left-0 top-0 h-screen ${collapsed ? 'w-[72px]' : 'w-[240px]'} z-40 border-r 
           bg-gradient-to-b from-violet-100 via-indigo-100 to-indigo-200 
           dark:from-violet-950 dark:via-violet-900 dark:to-indigo-950 
           text-slate-700 dark:text-slate-200 border-border`}
        style={{ paddingTop: 12 }}
      >
        {/* Brand at top */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} px-3 py-1`}>
          <div className="w-8 h-8 ai-button-gradient ai-rounded-lg flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <div className="ml-2 ai-text-gradient p-1 font-bold text-xl">Nebula AI Quiz</div>}
        </div>
        <div className="mx-3 my-2 border-t border-white/40 dark:border-white/10" />

         <nav className="px-2 space-y-1 py-4">
          {PRIMARY_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                 className={`${baseItemCls} ${active ? 'active' : 'inactive'} ${
                   active
                     ? 'bg-gradient-to-r from-violet-500 to-indigo-400 text-white font-semibold border-l-4 border-fuchsia-500'
                     : 'text-slate-600 dark:text-slate-300 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 hover:text-slate-800 dark:hover:text-slate-100'
                 }`}
                style={{ marginBottom: 4 }}
              >
                 <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
            );
          })}

          <div style={{ height: 32 }} />

           {SECONDARY_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                 onClick={() => navigate(item.path)}
                 className={`nav-item ${baseItemCls} ${active ? 'active' : 'inactive'} ${
                   active
                     ? 'bg-gradient-to-r from-violet-500 to-indigo-400 text-white font-semibold border-l-4 border-fuchsia-500'
                     : 'text-slate-600 dark:text-slate-300 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 hover:text-slate-800 dark:hover:text-slate-100'
                 }`}
                style={{ marginBottom: 4 }}
              >
                 <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
            );
          })}
        </nav>

         <div className={`absolute bottom-4 ${collapsed ? 'left-1/2 -translate-x-1/2' : 'left-3 right-3'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            {!collapsed && (
              <div className="text-xs text-[#94A3B8]">
                <div className="font-medium text-foreground truncate max-w-[160px]">{(sessionStorage.getItem('quiz_user') && JSON.parse(sessionStorage.getItem('quiz_user') as string).username) || 'Guest'}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{(sessionStorage.getItem('quiz_user') && JSON.parse(sessionStorage.getItem('quiz_user') as string).email) || 'Not signed in'}</div>
              </div>
            )}
            <Button
              variant="destructive"
              size={collapsed ? 'icon' : 'sm'}
              className="gap-2"
              onClick={() => {
                sessionStorage.removeItem('quiz_user');
                navigate('/home');
              }}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <MobileSidebarOverlay />

      {/* Mobile menu button */}
      {/* Mobile menu button - only show when sidebar is closed */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-3 left-5 z-50 md:hidden w-10 h-10 bg-transparent text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

export function AIPageShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const v = localStorage.getItem('ai_sidebar_collapsed');
    // Default to collapsed on mobile
    return window.innerWidth < 768 ? true : v === '1';
  });

  useEffect(() => {
    localStorage.setItem('ai_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // Responsive margin based on screen size - no margin on mobile since sidebar is overlay
  const ml = window.innerWidth < 768 ? 0 : (collapsed ? 72 : 240);

  return (
    <div className="min-h-screen ai-gradient-bg text-foreground flex flex-col">
      <div className="flex-1 flex">
        <AISidebar collapsed={collapsed} />
        <div className="flex-1 w-full md:w-auto" style={{ marginLeft: ml }}>
          <header className="sticky top-0 z-30">
            <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between bg-card/40 backdrop-blur border-b ai-card-glow">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" size="icon" onClick={()=>setCollapsed(!collapsed)} className="bg-transparent border-primary/20 hover:bg-primary/10 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex">
                  {collapsed ? <ChevronsRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />}
                </Button>
                 {/* Brand removed from header */}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="p-3 sm:p-4 md:p-6 transition-all duration-200">
            <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
              <span>Nebula AI Quiz</span>
              <span>/</span>
              <span className="text-foreground font-medium">{title}</span>
            </div>
            {children}
          </main>
        </div>
      </div>
      {/* Footer positioned after sidebar ends */}
      <div style={{ marginLeft: ml }}>
        <Footer />
      </div>
    </div>
  );
}


