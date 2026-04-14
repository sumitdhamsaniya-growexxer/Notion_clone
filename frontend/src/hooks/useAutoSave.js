// frontend/src/hooks/useAutoSave.js
import { useRef, useCallback, useState, useEffect } from 'react';
import { blockAPI } from '../services/api';
import { renormalizeBlocks, needsRenormalization } from '../utils/blockUtils';

const SAVE_DELAY = 1000; // 1 second debounce

const useAutoSave = (documentId, initialVersion) => {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const saveTimer = useRef(null);
  const abortControllerRef = useRef(null);
  const pendingVersionRef = useRef(0);     // Client-side version counter
  const serverVersionRef = useRef(initialVersion);

  useEffect(() => {
    if (initialVersion !== undefined && serverVersionRef.current === undefined) {
      serverVersionRef.current = initialVersion;
    }
  }, [initialVersion]);

  const save = useCallback(
    async (blocks) => {
      if (!documentId) return;

      // Clear any pending save timer
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      // Abort any in-flight save request (prevents stale overwrites)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setSaveStatus((prev) => (prev === 'saving' ? prev : 'saving'));

      saveTimer.current = setTimeout(async () => {
        // Increment pending version before save
        pendingVersionRef.current += 1;
        const thisVersion = pendingVersionRef.current;

        // Renormalize if needed before saving
        let blocksToSave = [...blocks];
        if (needsRenormalization(blocksToSave)) {
          blocksToSave = renormalizeBlocks(blocksToSave);
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const { data } = await blockAPI.batchSave(
            documentId,
            blocksToSave,
            serverVersionRef.current
          );

          // Only update if this save is still the latest
          if (thisVersion === pendingVersionRef.current) {
            serverVersionRef.current = data.version;
            setSaveStatus('saved');
          }
        } catch (err) {
          if (err.name === 'CanceledError' || err.name === 'AbortError') {
            // Request was intentionally aborted — a newer save will follow
            return;
          }
          if (err.response?.status === 409) {
            // Stale write detected — server rejected it
            console.warn('[AutoSave] Stale write rejected:', err.response.data.message);
            serverVersionRef.current = err.response.data.currentVersion;
            setSaveStatus('error');
          } else {
            console.error('[AutoSave] Save failed:', err.message);
            setSaveStatus('error');
          }
        }
      }, SAVE_DELAY);
    },
    [documentId]
  );

  const forceSave = useCallback(
    async (blocks) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (!documentId) return;
      setSaveStatus('saving');

      let blocksToSave = [...blocks];
      if (needsRenormalization(blocksToSave)) {
        blocksToSave = renormalizeBlocks(blocksToSave);
      }

      try {
        const { data } = await blockAPI.batchSave(documentId, blocksToSave, serverVersionRef.current);
        serverVersionRef.current = data.version;
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        throw err;
      }
    },
    [documentId]
  );

  return { saveStatus, save, forceSave };
};

export default useAutoSave;
