import { useEffect, useState, useCallback, useRef } from 'react';
import type { ResumeData, ResumeVersion, SectionConfig, AppSettings } from '../types';
import { initialResumeData, sampleResumeData, DEFAULT_SECTIONS } from '../types';
import { openDB } from 'idb';

const DB_NAME = 'resume-editor-db';
const DB_VERSION = 2;
const STORE_RESUME = 'resume';
const STORE_VERSIONS = 'versions';
const STORE_SETTINGS = 'settings';
const MAX_VERSIONS = 50;
const AUTOSAVE_DELAY = 1500;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(STORE_RESUME);
        const store = db.createObjectStore(STORE_VERSIONS, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
        db.createObjectStore(STORE_SETTINGS);
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
      }
    },
  });
}

const defaultSettings: AppSettings = {
  viewMode: 'edit',
  sectionOrder: DEFAULT_SECTIONS,
  sidebarOpen: false,
  template: 'ats-classic',
  exportType: 'ats',
};

export interface StorageHook {
  resume: ResumeData;
  versions: ResumeVersion[];
  settings: AppSettings;
  isLoaded: boolean;
  updateResume: (data: ResumeData) => void;
  updateResumePartial: (partial: Partial<ResumeData>) => void;
  saveVersion: (label?: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
  importResume: (data: ResumeData) => void;
  exportResume: () => string;
  toggleViewMode: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateSectionOrder: (order: SectionConfig[]) => void;
  resetToSample: () => void;
  resetToEmpty: () => void;
  loadSampleData: () => void;
}

export function useStorage(): StorageHook {
  const [resume, setResume] = useState<ResumeData>(initialResumeData);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeRef = useRef(resume);

  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      persistResume(resumeRef.current);
    }, AUTOSAVE_DELAY);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [resume, isLoaded]);

  const loadAll = async () => {
    try {
      const db = await getDB();

      const savedResume = await db.get(STORE_RESUME, 'current');
      if (savedResume) {
        setResume(savedResume);
      } else {
        setResume(sampleResumeData);
        await db.put(STORE_RESUME, sampleResumeData, 'current');
      }

      const savedSettings = await db.get(STORE_SETTINGS, 'settings');
      if (savedSettings) {
        const merged: AppSettings = {
          ...defaultSettings,
          ...savedSettings,
          sectionOrder: savedSettings.sectionOrder
            ? savedSettings.sectionOrder.map((s: SectionConfig) => {
                const defaultSection = DEFAULT_SECTIONS.find(d => d.id === s.id);
                return { ...defaultSection, ...s };
              })
            : DEFAULT_SECTIONS,
        };
        setSettings(merged);
      }

      const allVersions = await db.getAllFromIndex(STORE_VERSIONS, 'timestamp');
      setVersions(allVersions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error('Failed to load data:', e);
      setResume(sampleResumeData);
    } finally {
      setIsLoaded(true);
    }
  };

  const persistResume = useCallback(async (data: ResumeData) => {
    try {
      const db = await getDB();
      await db.put(STORE_RESUME, data, 'current');
    } catch (e) {
      console.error('Failed to save resume:', e);
    }
  }, []);

  const updateResume = useCallback((data: ResumeData) => {
    setResume(data);
  }, []);

  const updateResumePartial = useCallback((partial: Partial<ResumeData>) => {
    setResume(prev => ({ ...prev, ...partial }));
  }, []);

  const saveVersion = useCallback(async (label?: string) => {
    try {
      const db = await getDB();
      const version: ResumeVersion = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(resumeRef.current)),
        label: label || `Version saved ${new Date().toLocaleString()}`,
      };
      await db.put(STORE_VERSIONS, version);

      const allVersions = await db.getAll(STORE_VERSIONS);
      if (allVersions.length > MAX_VERSIONS) {
        const sorted = allVersions.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = sorted.slice(0, allVersions.length - MAX_VERSIONS);
        for (const v of toDelete) {
          await db.delete(STORE_VERSIONS, v.id);
        }
      }

      const updated = await db.getAllFromIndex(STORE_VERSIONS, 'timestamp');
      setVersions(updated.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error('Failed to save version:', e);
    }
  }, []);

  const restoreVersion = useCallback(async (versionId: string) => {
    try {
      const db = await getDB();
      const version = await db.get(STORE_VERSIONS, versionId);
      if (version) {
        setResume(version.data);
        await db.put(STORE_RESUME, version.data, 'current');
      }
    } catch (e) {
      console.error('Failed to restore version:', e);
    }
  }, []);

  const importResume = useCallback((data: ResumeData) => {
    setResume(data);
    persistResume(data);
  }, [persistResume]);

  const exportResume = useCallback(() => {
    return JSON.stringify(resumeRef.current, null, 2);
  }, []);

  const toggleViewMode = useCallback(() => {
    setSettings(prev => {
      const next: AppSettings = {
        ...prev,
        viewMode: prev.viewMode === 'view' ? 'edit' : 'view',
      };
      persistSettings(next);
      return next;
    });
  }, []);

  const persistSettings = async (s: AppSettings) => {
    try {
      const db = await getDB();
      await db.put(STORE_SETTINGS, s, 'settings');
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  }, []);

  const updateSectionOrder = useCallback((order: SectionConfig[]) => {
    setSettings(prev => {
      const next = { ...prev, sectionOrder: order };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetToSample = useCallback(() => {
    setResume(sampleResumeData);
    persistResume(sampleResumeData);
  }, [persistResume]);

  const resetToEmpty = useCallback(() => {
    setResume(initialResumeData);
    persistResume(initialResumeData);
  }, [persistResume]);

  const loadSampleData = useCallback(() => {
    setResume(sampleResumeData);
    persistResume(sampleResumeData);
  }, [persistResume]);

  return {
    resume,
    versions,
    settings,
    isLoaded,
    updateResume,
    updateResumePartial,
    saveVersion,
    restoreVersion,
    importResume,
    exportResume,
    toggleViewMode,
    updateSettings,
    updateSectionOrder,
    resetToSample,
    resetToEmpty,
    loadSampleData,
  };
}
