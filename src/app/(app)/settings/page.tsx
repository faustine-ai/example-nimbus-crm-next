import type { Metadata } from "next";
import { Suspense } from "react";

import { LiveStatus } from "@/components/live/live-indicator";
import { PageHeader } from "@/components/page-header";
import { ColorPicker } from "@/components/settings/color-picker";
import { LogoutButton } from "@/components/settings/logout-button";
import { Spinner } from "@/components/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/dal/auth";
import { nameInitials } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and workspace." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense
              fallback={
                <div className="flex h-56 items-center justify-center">
                  <Spinner />
                </div>
              }
            >
              <Profile />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Status of your Nimbus CRM workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Real-time connection</span>
              <LiveStatus />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database</span>
              <span className="font-medium">SQLite</span>
            </div>
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              This is a demo workspace. A second user (rep@crm.test / sales123) is also available for testing real-time
              updates across sessions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose the primary color used across the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorPicker />
            <p className="text-xs text-muted-foreground">
              Your selection is saved to this browser and applied instantly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function Profile() {
  const user = await getCurrentUser();

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 text-base">
          <AvatarFallback>{nameInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-sm capitalize text-muted-foreground">{user.role}</div>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" value={user.name} readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={user.email} readOnly />
      </div>
      <LogoutButton />
    </>
  );
}
