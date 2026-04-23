"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultSiteContent } from "../../../lib/site-content";
import { fetchAdminContent, fetchAdminSettings, saveAdminContent, saveAdminSettings, saveAdminSharedContent } from "../../../lib/admin/content-settings-admin";
import type { AboutStatContentItem, GalleryContentItem, PackageContentItem, ReviewContentItem, ServiceContentItem, SiteContent } from "../../../types/site-content";
import type { SiteSettings } from "../../../types/site-settings";
import { defaultSettings } from "../dashboard/utils";

interface AdminContentWorkspaceOptions {
  loadSettings?: boolean;
  loadContent?: boolean;
}

export function useAdminContentWorkspace(
  onMutation?: () => Promise<void> | void,
  options: AdminContentWorkspaceOptions = {}
) {
  const { loadSettings = true, loadContent = true } = options;
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharedContentMessage, setSharedContentMessage] = useState<string | null>(null);
  const [packageMessage, setPackageMessage] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [siteMessage, setSiteMessage] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [sharedContentError, setSharedContentError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [settingsPayload, contentPayload] = await Promise.all([
        loadSettings ? fetchAdminSettings() : Promise.resolve(null),
        loadContent ? fetchAdminContent() : Promise.resolve(null)
      ]);

      if (settingsPayload) {
        setSettings(settingsPayload.settings);
      }

      if (contentPayload) {
        setContent(contentPayload.content);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load admin content workspace");
    } finally {
      setLoading(false);
    }
  }, [loadContent, loadSettings]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const saveSettingsByMode = useCallback(async (patch: Partial<SiteSettings>, mode: "contact" | "packages" | "booking" | "site") => {
    setContactMessage(null);
    setContactError(null);
    setPackageMessage(null);
    setPackageError(null);
    setBookingMessage(null);
    setBookingError(null);
    setSiteMessage(null);
    setSiteError(null);

    try {
      const payload = await saveAdminSettings(patch);
      setSettings(payload.settings);
      await onMutation?.();
      if (mode === "contact") setContactMessage(payload.message);
      if (mode === "packages") setPackageMessage(payload.message);
      if (mode === "booking") setBookingMessage(payload.message);
      if (mode === "site") setSiteMessage(payload.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save";
      if (mode === "contact") setContactError(message);
      if (mode === "packages") setPackageError(message);
      if (mode === "booking") setBookingError(message);
      if (mode === "site") setSiteError(message);
    }
  }, [onMutation]);

  const saveContentSection = useCallback(async <K extends keyof SiteContent>(section: K, value: SiteContent[K], successMessage: string) => {
    setContentMessage(null);
    setContentError(null);
    try {
      const payload = await saveAdminContent(section, value);
      setContent(payload.content);
      setContentMessage(successMessage || payload.message);
      await onMutation?.();
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Unable to save content section");
    }
  }, [onMutation]);

  const saveSharedContent = useCallback(async () => {
    setSharedContentMessage(null);
    setSharedContentError(null);
    try {
      const payload = await saveAdminSharedContent({
        homepageHero: {
          title: content.homepageHero.title,
          description: content.homepageHero.description,
          primaryCtaLabel: content.homepageHero.primaryCtaLabel,
          secondaryCtaLabel: content.homepageHero.secondaryCtaLabel
        },
        contact: {
          phone: settings.contact.phone,
          email: settings.contact.email,
          serviceArea: settings.contact.serviceArea
        },
        site: {
          primaryCtaLabel: settings.site.primaryCtaLabel,
          serviceAreaLine: settings.site.serviceAreaLine
        }
      });
      setSettings(payload.settings);
      setContent(payload.content);
      setSharedContentMessage(payload.message);
      await onMutation?.();
    } catch (error) {
      setSharedContentError(error instanceof Error ? error.message : "Unable to save shared content");
    }
  }, [content, onMutation, settings.contact.email, settings.contact.phone, settings.contact.serviceArea, settings.site.primaryCtaLabel, settings.site.serviceAreaLine]);

  const setOrderedServices = useCallback((next: ServiceContentItem[]) => {
    setContent((prev) => ({
      ...prev,
      services: next.map((item, index) => ({ ...item, order: index }))
    }));
  }, []);

  const setOrderedPackages = useCallback((next: PackageContentItem[]) => {
    setContent((prev) => ({
      ...prev,
      packages: next.map((item, index) => ({ ...item, order: index }))
    }));
  }, []);

  const setOrderedGallery = useCallback((next: GalleryContentItem[]) => {
    setContent((prev) => ({
      ...prev,
      gallery: next.map((item, index) => ({ ...item, order: index }))
    }));
  }, []);

  const setReviews = useCallback((next: ReviewContentItem[]) => {
    setContent((prev) => ({ ...prev, reviews: next }));
  }, []);

  const setAboutStats = useCallback((next: AboutStatContentItem[]) => {
    setContent((prev) => ({ ...prev, aboutStats: next }));
  }, []);

  return {
    settings,
    setSettings,
    content,
    setContent,
    loading,
    loadError,
    reload: loadWorkspace,
    saveSettingsByMode,
    saveContentSection,
    saveSharedContent,
    setOrderedServices,
    setOrderedPackages,
    setOrderedGallery,
    setReviews,
    setAboutStats,
    sharedContentMessage,
    sharedContentError,
    packageMessage,
    packageError,
    bookingMessage,
    bookingError,
    siteMessage,
    siteError,
    contactMessage,
    contactError,
    contentMessage,
    contentError
  };
}
