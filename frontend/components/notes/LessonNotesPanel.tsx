"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Clock } from "lucide-react";
import { formatTimestamp } from "@/lib/formatTimestamp";

const AUTO_SAVE_INTERVAL_MS = 10_000;

interface LessonNotesPanelProps {
  videoId: number;
  /** Optional: get current video time in seconds for timestamp notes */
  getCurrentTime?: () => number | null;
  className?: string;
}

export function LessonNotesPanel({
  videoId,
  getCurrentTime,
  className = "",
}: LessonNotesPanelProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error" | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSavedContentRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(
    async (value: string) => {
      setSaving(true);
      setSaveStatus(null);
      try {
        await api.put(`/notes/videos/${videoId}`, { content: value });
        lastSavedContentRef.current = value;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch {
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    },
    [videoId]
  );

  const handleSaveClick = useCallback(() => {
    save(content);
  }, [content, save]);

  const isDirty = content !== lastSavedContentRef.current;

  // Load note when videoId changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContent("");
    lastSavedContentRef.current = "";

    api
      .get<{ content: string }>(`/notes/videos/${videoId}`)
      .then((res) => {
        if (cancelled) return;
        const value = res.data?.content ?? "";
        setContent(value);
        lastSavedContentRef.current = value;
      })
      .catch(() => {
        if (!cancelled) setContent("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Auto-save every 10 seconds when dirty
  useEffect(() => {
    if (!isDirty || saving) return;
    const id = setInterval(() => {
      if (content !== lastSavedContentRef.current) {
        save(content);
      }
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [content, isDirty, saving, save]);

  const handleAddTimestamp = useCallback(() => {
    const rawSeconds = getCurrentTime?.() ?? 0;
    const seconds = Math.floor(Number(rawSeconds)) || 0;
    const stamp = formatTimestamp(seconds);
    const line = `${stamp} (${seconds})\n""`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const newContent = before + line + after;
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        const newCursor = start + stamp.length + 2 + String(seconds).length + 2 + 1;
        textarea.setSelectionRange(newCursor, newCursor);
      }, 0);
    } else {
      setContent((prev) => prev + line);
    }
  }, [content, getCurrentTime]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-slate-500 ${className}`}>
        <p className="text-sm">Loading notes…</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Lesson notes
        </span>
        <div className="flex items-center gap-2">
          {getCurrentTime && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-slate-600 dark:text-slate-400"
              onClick={handleAddTimestamp}
              title="Insert current video timestamp"
            >
              <Clock className="h-4 w-4 mr-1" />
              Timestamp
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-8"
            onClick={handleSaveClick}
            disabled={saving || !isDirty}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : isDirty ? "Save" : "Saved"}
          </Button>
        </div>
      </div>
      {saveStatus === "saved" && (
        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Note saved.</p>
      )}
      {saveStatus === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-1">Failed to save. Try again.</p>
      )}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Take notes while watching. Use the Timestamp button to mark the current moment in the video."
        className="flex-1 min-h-[200px] resize-none"
      />
    </div>
  );
}
