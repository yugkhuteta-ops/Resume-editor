import { useState, useEffect, useCallback, useRef } from 'react';
import { getStoredToken, storeToken, clearToken, findFile, readFile, createFile, updateFile } from '../lib/googleDrive';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const AUTOSAVE_DEBOUNCE = 2000;

export interface GoogleDriveState {
  isSignedIn: boolean;
  isLoading: boolean;
  lastSync: number | null;
  error: string | null;
  fileId: string | null;
}

interface UseGoogleDriveReturn {
  state: GoogleDriveState;
  signIn: () => void;
  signOut: () => void;
  saveToDrive: (data: unknown) => void;
  loadFromDrive: () => Promise<unknown>;
}

let tokenClient: TokenClient | null = null;
let tokenCallback: ((token: string) => void) | null = null;

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [state, setState] = useState<GoogleDriveState>({
    isSignedIn: false,
    isLoading: true,
    lastSync: null,
    error: null,
    fileId: null,
  });

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<unknown | null>(null);
  const syncingRef = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const initFromToken = useCallback(async (token: string) => {
    try {
      storeToken(token);
      const id = await findFile();
      setState({
        isSignedIn: true,
        isLoading: false,
        lastSync: null,
        error: null,
        fileId: id,
      });
    } catch {
      clearToken();
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const existing = getStoredToken();
    if (existing) {
      initFromToken(existing);
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [initFromToken]);

  const signIn = useCallback(() => {
    if (!CLIENT_ID) {
      setState(s => ({ ...s, error: 'Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env' }));
      return;
    }

    if (!tokenClient) {
      const g = window.google;
      if (!g) {
        setState(s => ({ ...s, error: 'Google API not loaded' }));
        return;
      }
      tokenClient = g.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: TokenResponse) => {
          if (resp.access_token) {
            storeToken(resp.access_token);
            if (tokenCallback) tokenCallback(resp.access_token);
          } else if (resp.error) {
            setState(s => ({ ...s, error: resp.error_description || 'Auth failed' }));
          }
        },
      });
    }

    tokenCallback = (token: string) => {
      initFromToken(token);
    };

    setState(s => ({ ...s, isLoading: true, error: null }));
    tokenClient!.requestAccessToken();
  }, [initFromToken]);

  const signOut = useCallback(() => {
    clearToken();
    tokenClient = null;
    tokenCallback = null;
    setState({
      isSignedIn: false,
      isLoading: false,
      lastSync: null,
      error: null,
      fileId: null,
    });
  }, []);

  const saveToDrive = useCallback(async (data: unknown) => {
    const token = getStoredToken();
    if (!token) return;

    if (syncingRef.current) {
      pendingDataRef.current = data;
      return;
    }

    syncingRef.current = true;
    try {
      let id = stateRef.current.fileId;
      if (!id) {
        id = await findFile();
        if (!id) {
          id = await createFile(data);
        }
      }

      if (id) {
        await updateFile(id, data);
        setState(s => ({
          ...s,
          isSignedIn: true,
          fileId: id,
          lastSync: Date.now(),
          error: null,
        }));
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('Token expired') || msg.includes('401')) {
        clearToken();
        setState(s => ({ ...s, isSignedIn: false, error: 'Session expired. Sign in again.' }));
      } else {
        setState(s => ({ ...s, error: msg }));
      }
    } finally {
      syncingRef.current = false;
      if (pendingDataRef.current) {
        const d = pendingDataRef.current;
        pendingDataRef.current = null;
        saveToDrive(d);
      }
    }
  }, []);

  const debouncedSave = useCallback((data: unknown) => {
    const token = getStoredToken();
    if (!token) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    pendingDataRef.current = data;
    syncTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        saveToDrive(pendingDataRef.current);
      }
    }, AUTOSAVE_DEBOUNCE);
  }, [saveToDrive]);

  const loadFromDrive = useCallback(async (): Promise<unknown> => {
    const token = getStoredToken();
    if (!token) return null;

    let id = state.fileId;
    if (!id) {
      id = await findFile();
    }

    if (id) {
      const data = await readFile(id);
      setState(s => ({ ...s, fileId: id }));
      return data;
    }
    return null;
  }, [state.fileId]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  return { state, signIn, signOut, saveToDrive: debouncedSave, loadFromDrive };
}
