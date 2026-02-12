import React from 'react';
import {
  HelpCircle,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  PenLine,
  Pencil,
  Plus,
  Settings,
  User,
} from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { DashboardSection } from './types';

interface AppSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onAddCollege: () => void;
  onLogout?: () => void;
  onEditStoryIdentity?: () => void;
  onTakeTour: () => void;
}

interface SidebarIconButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  dataTour?: string;
}

const SidebarIconButton: React.FC<SidebarIconButtonProps> = ({
  label,
  active,
  disabled,
  onClick,
  children,
  dataTour,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-tour={dataTour}
          disabled={disabled}
          onClick={onClick}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

const AppSidebar: React.FC<AppSidebarProps> = ({
  activeSection,
  onSectionChange,
  onAddCollege,
  onLogout,
  onEditStoryIdentity,
  onTakeTour,
}) => {
  return (
    <TooltipProvider>
      <aside className="flex h-screen w-14 flex-col items-center justify-between border-r border-border bg-card py-3" data-tour="sidebar-nav">
        <div className="flex flex-col items-center gap-2">
          <SidebarIconButton
            label="Dashboard"
            active={activeSection === 'dashboard'}
            onClick={() => onSectionChange('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
          </SidebarIconButton>

          <SidebarIconButton
            label="Essays"
            active={activeSection === 'essays'}
            onClick={() => onSectionChange('essays')}
            dataTour="essays-section"
          >
            <PenLine className="h-4 w-4" />
          </SidebarIconButton>

          <SidebarIconButton
            label="Notes"
            active={activeSection === 'notes'}
            onClick={() => onSectionChange('notes')}
          >
            <NotebookPen className="h-4 w-4" />
          </SidebarIconButton>

          <SidebarIconButton label="Add college" onClick={onAddCollege}>
            <Plus className="h-4 w-4" />
          </SidebarIconButton>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56">
              <DropdownMenuItem className="cursor-pointer" onClick={onEditStoryIdentity}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Story Identity
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={onTakeTour}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Take tour
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-muted-foreground" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56">
              <DropdownMenuItem>Editor preferences</DropdownMenuItem>
              <DropdownMenuItem onClick={onTakeTour}>Take tour</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default AppSidebar;
