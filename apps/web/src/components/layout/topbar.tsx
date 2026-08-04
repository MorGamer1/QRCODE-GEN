'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import type { AuthUser } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from './theme-toggle';
import { UserNav } from './user-nav';
import { Logo } from './logo';
import { SidebarNav } from './sidebar-nav';

export function Topbar({ user }: { user: AuthUser }) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center border-b px-6">
            <Logo />
          </div>
          <div className="px-3 py-4">
            <SidebarNav role={user.role} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <ThemeToggle />
      <UserNav user={user} />
    </header>
  );
}
