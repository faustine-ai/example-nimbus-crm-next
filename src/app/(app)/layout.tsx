import { Suspense } from "react";

import { FlashToast } from "@/components/layout/flash-toast";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar, SidebarView, TopbarTitle } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { LiveIndicator } from "@/components/live/live-indicator";
import { LiveProvider } from "@/components/live/live-provider";
import { getCurrentUser } from "@/lib/dal/auth";

/**
 * The signed-in app shell: sidebar, top bar and the page area.
 *
 * The shell itself is static. The only part that needs the session, the
 * account menu, streams in behind its own Suspense boundary.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <LiveProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block print:hidden">
          <Suspense fallback={<SidebarView pathname={null} />}>
            <Sidebar />
          </Suspense>
        </aside>

        <div className="flex min-h-screen flex-col lg:pl-64 print:pl-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6 print:hidden">
            <div className="flex items-center gap-3">
              <Suspense>
                <MobileNav />
              </Suspense>
              <Suspense fallback={<h2 className="text-base font-semibold">&nbsp;</h2>}>
                <TopbarTitle />
              </Suspense>
            </div>

            <div className="flex items-center gap-4">
              <LiveIndicator />
              <Suspense fallback={<div className="h-9 w-9 rounded-full bg-accent" />}>
                <AccountMenu />
              </Suspense>
            </div>
          </header>

          {/* Pages that need the full width (the deals board) mark themselves with data-full-width. */}
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 p-4 has-[[data-full-width]]:max-w-none sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <FlashToast />
    </LiveProvider>
  );
}

async function AccountMenu() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
}
