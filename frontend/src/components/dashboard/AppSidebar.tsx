import React from 'react';
import {
  HelpCircle,
  LogOut,
  Pencil,
  User,
} from 'lucide-react';

import ColleeLogo from '@/components/ColleeLogo';
import ThemeToggle from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppSidebarProps {
  onLogout?: () => void;
  onEditStoryIdentity?: () => void;
  onTakeTour: () => void;
  onLogoClick?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  onLogout,
  onEditStoryIdentity,
  onTakeTour,
  onLogoClick,
}) => {
  return (
    <header className="border-b border-border bg-card/70 px-4 py-3 backdrop-blur-sm sm:px-6" data-tour="sidebar-nav">
      <div className="flex items-center justify-between">
        <div data-tour="logo-button">
          <ColleeLogo size="sm" showText={false} onClick={onLogoClick} />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-56">
              <DropdownMenuItem className="cursor-pointer" onClick={onEditStoryIdentity}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Story Identity
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={onTakeTour}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Take tour
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-muted-foreground" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppSidebar;
