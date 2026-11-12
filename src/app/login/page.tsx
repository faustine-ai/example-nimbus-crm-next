import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-background to-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-lg">
            N
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nimbus CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <LoginForm />

            <div className="mt-5 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Demo login</span> · admin@crm.test / admin123
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
