"use client";

import { Trash2 } from "lucide-react";
import { startTransition, useOptimistic, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { addNote, deleteNote } from "@/lib/actions/notes";
import { formatRelative } from "@/lib/format";
import type { Note, NoteEntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

type NoteView = Pick<Note, "id" | "body" | "created_at"> & { pending?: boolean };
type Change = { type: "add"; note: NoteView } | { type: "remove"; id: number };

/**
 * Add and list notes for a record.
 *
 * `notes` comes from the server. Adding or removing a note updates the list
 * optimistically while the Server Action runs; when it finishes the page is
 * re-rendered with the stored notes. Notes written by other users arrive the
 * same way through the live feed.
 */
export function NotesPanel({
  entityType,
  entityId,
  notes,
}: {
  entityType: NoteEntityType;
  entityId: number;
  notes: Note[];
}) {
  const [body, setBody] = useState("");
  const tempId = useRef(0);
  const [optimisticNotes, applyChange] = useOptimistic<NoteView[], Change>(notes, (current, change) =>
    change.type === "add" ? [change.note, ...current] : current.filter((n) => n.id !== change.id),
  );

  async function addAction(formData: FormData) {
    const text = String(formData.get("body") ?? "").trim();
    if (!text) return;

    // Show the note right away; the stored one replaces it when the action is done.
    tempId.current -= 1;
    applyChange({
      type: "add",
      note: { id: tempId.current, body: text, created_at: new Date().toISOString(), pending: true },
    });

    const result = await addNote(entityType, entityId, text);
    if (result.ok) {
      setBody("");
      toast.success("Note added");
    } else {
      toast.error(result.error);
    }
  }

  function remove(id: number) {
    startTransition(async () => {
      applyChange({ type: "remove", id });
      const result = await deleteNote(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <form action={addAction} className="space-y-2">
        <Textarea
          name="body"
          aria-label="New note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a note…"
        />
        <div className="flex justify-end">
          <AddNoteButton disabled={!body.trim()} />
        </div>
      </form>

      <div className="space-y-3">
        {optimisticNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {optimisticNotes.map((note) => (
          <div key={note.id} className={cn("group rounded-lg border bg-muted/30 p-3", note.pending && "opacity-60")}>
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
              {!note.pending && (
                <button
                  type="button"
                  onClick={() => remove(note.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Relative to "now": the server and the browser may disagree by a few seconds. */}
            <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
              {formatRelative(note.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddNoteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || disabled}>
      {pending ? "Adding…" : "Add note"}
    </Button>
  );
}
