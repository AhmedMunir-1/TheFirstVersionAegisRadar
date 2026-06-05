import { Outlet, Link, useLocation } from "react-router-dom";
import { Shield, Home, Bell, Activity, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: Activity,
  },
  {
    title: "Alerts",
    url: "/dashboard/alerts",
    icon: Bell,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
];

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="border-b border-border p-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-foreground">
              Aegis<span className="text-primary">Radar</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-4">
            <div className="flex items-center gap-2 mb-4 px-2 overflow-hidden">
                <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {user?.companyName?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{user?.companyName || 'Loading...'}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email || ''}</span>
                </div>
            </div>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                    <LogOut />
                    <span>Sign out</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-border">
            <SidebarTrigger className="-ml-1" />
            <div className="w-full flex justify-between items-center px-4">
                <h1 className="text-lg font-semibold capitalize">
                    {location.pathname.split('/').pop() === 'dashboard' ? 'Overview' : location.pathname.split('/').pop()}
                </h1>
            </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
