import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Search,
  Settings,
  HelpCircle,
  Crown,
  BookOpen,
  Briefcase,
  FileText,
  LogOut,
  Loader2
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    badge: undefined,
  },
  {
    name: 'New Project',
    href: '/app/new-project',
    icon: PlusCircle,
    badge: undefined,
  },
];

const resources = [
  {
    name: 'Templates',
    href: '/app/templates',
    icon: FileText,
    badge: 'New',
  },
  {
    name: 'Hire a Pro',
    href: '/app/hire-pro',
    icon: Briefcase,
    badge: 'New',
  },
  {
    name: 'Guides',
    href: '/app/resources',
    icon: BookOpen,
    badge: 'New',
  },
  {
    name: 'Pro Features',
    href: '/app/pro',
    icon: Crown,
    badge: 'New',
  },
  {
    name: 'Logo Generator',
    href: '/app/logo-generator',
    icon: Sparkles,
    badge: 'Soon',
  },
  {
    name: 'Competitor Research',
    href: '/app/competitor-research',
    icon: Search,
    badge: 'Soon',
  },
];

const support = [
  {
    name: 'Support',
    href: '/app/support',
    icon: HelpCircle,
    badge: undefined,
  },
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    badge: undefined,
  },
];

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: string;
  collapsed?: boolean;
}

function NavItem({ children, href, icon: Icon, badge, collapsed }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname === href;
  const isComingSoon = badge === 'Soon';

  const commonClasses = cn(
    'group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium relative text-gray-300',
    isComingSoon
      ? 'opacity-50 cursor-not-allowed'
      : isActive
        ? 'bg-blue-900/30 text-white'
        : 'hover:bg-blue-900/20 hover:text-white'
  );

  if (isComingSoon) {
    return (
      <div className={commonClasses}>
        <Icon
          className={cn(
            'h-5 w-5 shrink-0',
            'text-gray-400'
          )}
        />
        <span className={cn(
          "flex-1 transition-all duration-200",
          collapsed ? 'opacity-0 w-0' : 'opacity-100'
        )}>{children}</span>
        {badge && (
          <span className={cn(
            "absolute right-2 top-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-all duration-200",
            'bg-gray-600/30 text-gray-200 ring-1 ring-inset ring-gray-400/50',
            collapsed ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
          )}>
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={commonClasses}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          isActive
            ? 'text-white'
            : 'text-gray-200 group-hover:text-white'
        )}
      />
      <span className={cn(
        "flex-1 transition-all duration-200",
        collapsed ? 'opacity-0 w-0' : 'opacity-100'
      )}>{children}</span>
      {badge && (
        <span className={cn(
          "absolute right-2 top-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-all duration-200",
          'bg-blue-900/30 text-blue-200 ring-1 ring-inset ring-blue-500/30',
          collapsed ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      // On mobile, always collapse
      // On desktop, match user's preference or default to expanded
      setCollapsed(isMobile);
    };
    
    // Check on initial load
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to sign out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className={cn(
      "flex h-full flex-col border-r border-blue-900/50 bg-[#0A1A2C] relative transition-all duration-300",
      collapsed ? 'w-20' : 'w-72'
    )}>
      <div className="flex h-16 shrink-0 items-center gap-x-3 border-b border-blue-900/50 px-4 relative">
        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-blue-400" />
        </div>
        <span className={cn(
          "text-lg font-semibold text-white transition-all duration-200",
          collapsed ? 'opacity-0 w-0' : 'opacity-100'
        )}>MarketingGuide AI</span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-blue-900/20 text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-6 pb-24">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              badge={item.badge}
              collapsed={collapsed}
            >
              {item.name}
            </NavItem>
          ))}
        </div>
        <div className="mt-10">
          <p className={cn(
            "px-3 text-xs font-semibold uppercase tracking-wider text-gray-100 transition-all duration-200",
            collapsed ? 'opacity-0' : 'opacity-100'
          )}>
            Guides & Resources
          </p>
          <div className="mt-2 space-y-1">
            {resources.map((item) => (
              <NavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                badge={item.badge}
                collapsed={collapsed}
              >
                {item.name}
              </NavItem>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <p className={cn(
            "px-3 text-xs font-semibold uppercase tracking-wider text-gray-100 transition-all duration-200",
            collapsed ? 'opacity-0' : 'opacity-100'
          )}>
            Support
          </p>
          <div className="mt-2 space-y-1">
            {support.map((item) => (
              <NavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                badge={item.badge}
                collapsed={collapsed}
              >
                {item.name}
              </NavItem>
            ))}
          </div>
        </div>
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0A1A2C] border-t border-blue-900/50">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            'w-full group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
            'text-gray-100 hover:bg-blue-900/20 hover:text-white'
          )}
        >
          {isSigningOut ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gray-200" />
          ) : (
            <LogOut className="h-5 w-5 shrink-0 text-gray-200 group-hover:text-white" />
          )}
          <span className={cn(
            "transition-all duration-200",
            collapsed ? 'opacity-0 w-0' : 'opacity-100'
          )}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}