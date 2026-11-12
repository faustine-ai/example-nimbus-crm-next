import {
  Activity,
  Briefcase,
  Building2,
  CheckSquare,
  FileText,
  Receipt,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, cache } from "react";

import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { PageHeader } from "@/components/page-header";
import { PageLoader, Spinner } from "@/components/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stageTypeMeta } from "@/lib/constants";
import { listActivities } from "@/lib/dal/activities";
import { getDashboardStats } from "@/lib/dal/dashboard";
import { formatCurrency, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

// The stat cards and the chart read the same numbers: compute them once per request.
const loadStats = cache(getDashboardStats);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="A quick overview of your sales activity." />

      <Suspense fallback={<PageLoader />}>
        <StatCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Each card streams in on its own as soon as its data is ready. */}
        <Suspense fallback={<CardFallback title="Pipeline by stage" className="lg:col-span-3" />}>
          <PipelineCard />
        </Suspense>
        <Suspense fallback={<CardFallback title="Recent activity" className="lg:col-span-2" />}>
          <ActivityFeed />
        </Suspense>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent: string;
}) {
  const body = (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

async function StatCards() {
  const stats = await loadStats();
  const closed = stats.wonDeals + stats.lostDeals;
  const winRate = closed > 0 ? Math.round((stats.wonDeals / closed) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Contacts" value={stats.totalContacts} href="/contacts" accent="bg-blue-100 text-blue-600" />
        <StatCard icon={Building2} label="Companies" value={stats.totalCompanies} href="/companies" accent="bg-violet-100 text-violet-600" />
        <StatCard icon={Briefcase} label="Total deals" value={stats.totalDeals} href="/deals" accent="bg-indigo-100 text-indigo-600" />
        <StatCard icon={CheckSquare} label="Open tasks" value={stats.openTasks} href="/tasks" accent="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Open deals" value={stats.openDeals} sub={formatCurrency(stats.openValue)} accent="bg-sky-100 text-sky-600" />
        <StatCard icon={Trophy} label="Won deals" value={stats.wonDeals} sub={formatCurrency(stats.wonValue)} accent="bg-emerald-100 text-emerald-600" />
        <StatCard icon={XCircle} label="Lost deals" value={stats.lostDeals} accent="bg-rose-100 text-rose-600" />
        <StatCard icon={Activity} label="Win rate" value={`${winRate}%`} accent="bg-teal-100 text-teal-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Receipt} label="Outstanding" value={formatCurrency(stats.invoiceOutstanding)} href="/invoices" accent="bg-amber-100 text-amber-600" />
        <StatCard icon={Wallet} label="Paid invoices" value={formatCurrency(stats.invoicePaid)} href="/invoices" accent="bg-emerald-100 text-emerald-600" />
        <StatCard icon={FileText} label="Invoices" value={stats.invoiceCount} href="/invoices" accent="bg-violet-100 text-violet-600" />
      </div>
    </>
  );
}

async function PipelineCard() {
  const stats = await loadStats();
  const data = stats.stages.map((s) => ({
    name: s.name,
    value: s.count || 0,
    fill: stageTypeMeta(s.type).dot,
  }));

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>{stats.pipelineName ? `${stats.pipelineName} — by stage` : "Pipeline by stage"}</CardTitle>
      </CardHeader>
      <CardContent>
        <PipelineChart data={data} />
      </CardContent>
    </Card>
  );
}

/**
 * The live activity feed. It is plain server-rendered markup: when something
 * changes, the live connection (see LiveProvider) asks the router to re-render
 * it with the latest rows.
 */
async function ActivityFeed() {
  const activities = await listActivities(12);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-4" aria-label="Recent activity">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm text-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(a.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CardFallback({ title, className }: { title: string; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[280px] items-center justify-center">
        <Spinner />
      </CardContent>
    </Card>
  );
}
