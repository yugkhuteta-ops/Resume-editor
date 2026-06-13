import { Cloud, LogOut, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { GoogleDriveState } from '../hooks/useGoogleDrive';

interface GoogleDriveButtonProps {
  state: GoogleDriveState;
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncNow: () => void;
}

export function GoogleDriveButton({ state, onSignIn, onSignOut, onSyncNow }: GoogleDriveButtonProps) {
  if (state.isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-400 rounded-lg cursor-not-allowed"
        aria-label="Checking Google Drive..."
      >
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        <span className="hidden sm:inline">Drive</span>
      </button>
    );
  }

  if (state.isSignedIn) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={onSyncNow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title={state.lastSync ? `Last synced: ${new Date(state.lastSync).toLocaleTimeString()}` : 'Sync to Google Drive'}
          aria-label="Sync to Google Drive"
        >
          {state.lastSync ? (
            <CheckCircle2 size={15} aria-hidden="true" />
          ) : (
            <Cloud size={15} aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Drive</span>
        </button>
        <button
          onClick={onSignOut}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Disconnect Google Drive"
          aria-label="Disconnect Google Drive"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onSignIn}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Sign in with Google to save to Drive"
        aria-label="Sign in with Google"
      >
        <Cloud size={15} aria-hidden="true" />
        <span className="hidden sm:inline">Drive</span>
      </button>
      {state.error && (
        <div className="group relative">
          <AlertCircle size={14} className="text-amber-500" aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs text-gray-600 hidden group-hover:block z-50">
            {state.error}
          </div>
        </div>
      )}
    </div>
  );
}
