'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { CommandPalette } from '@/components/shell/command-palette';
import { ShortcutHelpDialog } from '@/components/shell/shortcut-help-dialog';
import { QuickCreateDialog } from '@/components/shell/quick-create-dialog';
import { NotificationCenter } from '@/components/shell/notification-center';
import { DEMO_USERS, type UserSession } from '@/lib/auth/session';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  // State for modals
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Active session context (dynamically retrieved from authenticated cookie)
  const [currentSession, setCurrentSession] = useState<UserSession>(() => DEMO_USERS.admin);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.user) {
          setCurrentSession(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [orgSlug]);

  return (
    <div className="flex h-screen w-full min-w-full overflow-hidden bg-white text-black antialiased">
      {/* Collapsible Left Sidebar */}
      <Sidebar orgSlug={orgSlug} role={currentSession.role} orgName={currentSession.organizationName} />

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white w-full min-w-0">
        {/* Top Header Bar */}
        <Topbar
          session={currentSession}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
        />

        {/* Scrollable Viewport - Full Width Fluid Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Interactive Global Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        orgSlug={orgSlug}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <ShortcutHelpDialog
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <QuickCreateDialog
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        orgSlug={orgSlug}
      />

      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
