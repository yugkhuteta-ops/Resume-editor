import { useState } from 'react';
import type { ResumeVersion } from '../types';
import { Clock, RotateCcw, X, Save } from 'lucide-react';

interface VersionHistoryProps {
  versions: ResumeVersion[];
  onRestore: (versionId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function VersionHistory({ versions, onRestore, onSave, onClose }: VersionHistoryProps) {
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const handleRestore = (versionId: string) => {
    if (confirmRestore === versionId) {
      onRestore(versionId);
      setConfirmRestore(null);
    } else {
      setConfirmRestore(versionId);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const groupByDate = () => {
    const groups: { label: string; versions: ResumeVersion[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    let todayGroup: ResumeVersion[] = [];
    let yesterdayGroup: ResumeVersion[] = [];
    let thisWeekGroup: ResumeVersion[] = [];
    let olderGroup: ResumeVersion[] = [];

    versions.forEach(v => {
      const d = new Date(v.timestamp);
      if (d.toDateString() === today.toDateString()) {
        todayGroup.push(v);
      } else if (d.toDateString() === yesterday.toDateString()) {
        yesterdayGroup.push(v);
      } else if (d >= thisWeek) {
        thisWeekGroup.push(v);
      } else {
        olderGroup.push(v);
      }
    });

    if (todayGroup.length) groups.push({ label: 'Today', versions: todayGroup });
    if (yesterdayGroup.length) groups.push({ label: 'Yesterday', versions: yesterdayGroup });
    if (thisWeekGroup.length) groups.push({ label: 'This Week', versions: thisWeekGroup });
    if (olderGroup.length) groups.push({ label: 'Older', versions: olderGroup });

    return groups;
  };

  const groups = groupByDate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500" />
          <h2 className="font-semibold text-sm text-gray-800">Version History</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Save current version"
          >
            <Save size={13} />
            Save Now
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No versions saved yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Versions are saved before PDF export, or you can click "Save Now".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.label}
                </h3>
                <div className="space-y-1.5">
                  {group.versions.map(version => (
                    <div
                      key={version.id}
                      className="group relative border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {version.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(version.timestamp)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(version.id)}
                          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            confirmRestore === version.id
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <RotateCcw size={12} />
                          {confirmRestore === version.id ? 'Confirm?' : 'Restore'}
                        </button>
                      </div>
                      {confirmRestore === version.id && (
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-xs text-amber-700">This will replace your current resume.</p>
                          <button
                            onClick={() => setConfirmRestore(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
