import { CheckSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/spinner";
import { NewTaskButton, TaskRow } from "@/components/tasks/task-actions";
import type { TaskRecordOptions } from "@/components/tasks/task-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsLink, TabsList } from "@/components/ui/tabs";
import { listCompanyOptions } from "@/lib/dal/companies";
import { listContactOptions } from "@/lib/dal/contacts";
import { listDealOptions } from "@/lib/dal/deals";
import { listTasks, type TaskFilter } from "@/lib/dal/tasks";
import { isPastDate, todayISO } from "@/lib/format";
import { oneOf } from "@/lib/search-params";

export const metadata: Metadata = { title: "Tasks" };

const FILTERS = [
  { value: "open", label: "Open", href: "/tasks" },
  { value: "completed", label: "Completed", href: "/tasks?status=completed" },
  { value: "all", label: "All", href: "/tasks?status=all" },
] as const;

type SearchParams = PageProps<"/tasks">["searchParams"];

/** The selected tab: `?status=completed|all`, open by default. */
async function readFilter(searchParams: SearchParams): Promise<TaskFilter> {
  return oneOf((await searchParams).status, ["open", "completed", "all"]) || "open";
}

async function loadOptions(): Promise<TaskRecordOptions> {
  const [contacts, companies, deals] = await Promise.all([
    listContactOptions(),
    listCompanyOptions(),
    listDealOptions(),
  ]);
  return { contacts, companies, deals };
}

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Stay on top of your follow-ups.">
        <Suspense
          fallback={
            <Button disabled>
              <Plus className="h-4 w-4" /> New task
            </Button>
          }
        >
          <NewTask />
        </Suspense>
      </PageHeader>

      <div>
        <Suspense fallback={<FilterTabs filter="open" />}>
          <CurrentFilterTabs searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<PageLoader />}>
        <TaskList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function FilterTabs({ filter }: { filter: TaskFilter }) {
  return (
    <TabsList>
      {FILTERS.map((f) => (
        <TabsLink key={f.value} href={f.href} active={f.value === filter} scroll={false}>
          {f.label}
        </TabsLink>
      ))}
    </TabsList>
  );
}

async function CurrentFilterTabs({ searchParams }: { searchParams: SearchParams }) {
  return <FilterTabs filter={await readFilter(searchParams)} />;
}

async function NewTask() {
  return <NewTaskButton options={await loadOptions()} />;
}

async function TaskList({ searchParams }: { searchParams: SearchParams }) {
  const filter = await readFilter(searchParams);
  const [tasks, options] = await Promise.all([listTasks(filter), loadOptions()]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks here"
        description={
          filter === "completed" ? "Completed tasks will show up here." : "Create a task to track your next steps."
        }
        action={<NewTaskButton options={options} />}
      />
    );
  }

  const today = todayISO();

  return (
    <Card className="divide-y">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          overdue={!task.completed && isPastDate(task.due_date, today)}
          options={options}
        />
      ))}
    </Card>
  );
}
