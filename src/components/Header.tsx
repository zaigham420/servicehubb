import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, User as UserIcon, LogOut, LayoutDashboard, Briefcase, Shield } from "lucide-react";

export function Header() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const initials =
    (user?.user_metadata?.full_name as string | undefined)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Service<span className="text-primary">Hub</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link to="/become-provider" className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Become a provider
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary-hover">
                <Link to="/signup">Join</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{user.user_metadata?.full_name || "Account"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {roles.includes("customer") && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/customer"><LayoutDashboard className="h-4 w-4 mr-2" />My bookings</Link>
                  </DropdownMenuItem>
                )}
                {roles.includes("provider") && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/provider"><Briefcase className="h-4 w-4 mr-2" />Provider dashboard</Link>
                  </DropdownMenuItem>
                )}
                {roles.includes("admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/admin"><Shield className="h-4 w-4 mr-2" />Admin panel</Link>
                  </DropdownMenuItem>
                )}
                {roles.length === 0 && (
                  <DropdownMenuItem asChild>
                    <Link to="/onboarding"><UserIcon className="h-4 w-4 mr-2" />Complete setup</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
