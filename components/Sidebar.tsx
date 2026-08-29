'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, BookOpen, Plus, Bolt, MailIcon, LucideSparkle , TableConfigIcon} from 'lucide-react';

const navItems = [
  // { name: 'Dashboard', href: '/', icon: Home },
  // { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: "Artworks", href: "/artworks", icon: Bolt },
  { name: 'Blogs', href: '/blogs', icon: BookOpen },
  // { name: 'New Blog', href: '/blogs/new', icon: Plus },
  { name: 'Subscribers', href: '/subscribers', icon: MailIcon },
  { name: 'Welcome Email', href: ' /email-templates/welcome', icon: TableConfigIcon },
  { name: 'Campaigns', href: '/campaigns', icon: MailIcon },
  { name: 'Support Inquiries', href: '/support', icon: LucideSparkle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-zinc-950 border-r border-zinc-800 h-screen flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 text-sm font-medium transition-all ${isActive
                  ? 'bg-white text-black'
                  : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}