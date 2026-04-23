"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlockedDateEntry } from "../dashboard/types";
import { blockAdminDate, fetchAdminBlockedDates, unblockAdminDate } from "../../../lib/admin/blocked-dates-admin";
import { toIsoDateLocal } from "../dashboard/utils";

export function useAdminBlockedDatesWorkspace(onMutation?: () => Promise<void> | void) {
  const router = useRouter();
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedNote, setNewBlockedNote] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const loadBlockedDates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const payload = await fetchAdminBlockedDates();
      setBlockedDates(payload.blockedDates ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load blocked dates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlockedDates();
  }, [loadBlockedDates]);

  const finishMutation = useCallback(async (message: string) => {
    setBlockedMessage(message);
    await loadBlockedDates();
    router.refresh();
    await onMutation?.();
  }, [loadBlockedDates, onMutation, router]);

  const addBlockedDate = useCallback(async () => {
    if (!newBlockedDate) {
      setBlockedError("Choose a date first.");
      return;
    }

    setSaving(true);
    setBlockedError(null);
    setBlockedMessage(null);
    try {
      const payload = await blockAdminDate(newBlockedDate, newBlockedNote);
      setNewBlockedDate("");
      setNewBlockedNote("");
      await finishMutation(`${payload.message}. Public availability has been refreshed.`);
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to block date");
    } finally {
      setSaving(false);
    }
  }, [finishMutation, newBlockedDate, newBlockedNote]);

  const removeBlockedDate = useCallback(async (date: string) => {
    setSaving(true);
    setBlockedError(null);
    setBlockedMessage(null);
    try {
      const payload = await unblockAdminDate(date);
      await finishMutation(`${payload.message}. Public availability has been refreshed.`);
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to remove date");
    } finally {
      setSaving(false);
    }
  }, [finishMutation]);

  const toggleCalendarDate = useCallback(async (iso: string, blocked: boolean) => {
    if (blocked) {
      await removeBlockedDate(iso);
      return;
    }

    setSaving(true);
    setBlockedError(null);
    setBlockedMessage(null);
    try {
      const payload = await blockAdminDate(iso, newBlockedNote);
      setNewBlockedDate("");
      setNewBlockedNote("");
      await finishMutation(`${payload.message}. Public availability has been refreshed.`);
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to block date");
    } finally {
      setSaving(false);
    }
  }, [finishMutation, newBlockedNote, removeBlockedDate]);

  const blockedDateSet = useMemo(() => new Set(blockedDates.map((entry) => entry.eventDate)), [blockedDates]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day?: number; iso?: string; blocked?: boolean }> = [];

    for (let index = 0; index < offset; index += 1) {
      cells.push({});
    }

    for (let day = 1; day <= count; day += 1) {
      const iso = toIsoDateLocal(new Date(year, month, day));
      cells.push({ day, iso, blocked: blockedDateSet.has(iso) });
    }

    return cells;
  }, [blockedDateSet, calendarMonth]);

  return {
    blockedDates,
    loading,
    saving,
    loadError,
    blockedMessage,
    blockedError,
    calendarMonth,
    setCalendarMonth,
    calendarCells,
    newBlockedDate,
    setNewBlockedDate,
    newBlockedNote,
    setNewBlockedNote,
    addBlockedDate,
    removeBlockedDate,
    toggleCalendarDate,
    reload: loadBlockedDates
  };
}
