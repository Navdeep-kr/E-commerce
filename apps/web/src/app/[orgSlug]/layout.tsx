'use client';

import React, { useState } from 'react';
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

  // Active session context (defaults to admin demo user)
  const currentSession: UserSession = DEMO_USERS.admin;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-black antialiased">
      {/* Collapsible Left Sidebar */}
      <Sidebar orgSlug={orgSlug} role={currentSession.role} orgName={currentSession.organizationName} />

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Top Header Bar */}
        <Topbar
          session={currentSession}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
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
