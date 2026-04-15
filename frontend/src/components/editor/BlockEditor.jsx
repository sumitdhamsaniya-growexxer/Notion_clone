// frontend/src/components/editor/BlockEditor.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import Block from './Block';
import SlashMenu from './SlashMenu';
import InlineFormatToolbar from './InlineFormatToolbar';
import TrashView from './TrashView';
import {
  createBlock,
  getMidpointIndex,
  getCursorOffset,
  setCursorOffset,
  setCursorToEnd,
  setCursorToStart,
  isCursorAtStart,
} from '../../utils/blockUtils';
import useAutoSave from '../../hooks/useAutoSave';
import { documentAPI } from '../../services/api';
import SaveIndicator from '../ui/SaveIndicator';

const NON_EDITABLE_TYPES = ['divider', 'image', 'file', 'table'];

const BlockEditor = ({ documentId, initialBlocks = [], documentVersion, documentTitle, onTitleChange, onTitleBlur }) => {
  const [blocks, setBlocks] = useState(
    initialBlocks.length > 0
      ? [...initialBlocks].sort((a, b) => a.order_index - b.order_index)
      : [createBlock('paragraph', { text: '' }, 1000.0)]
  );
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [focusCursorPosition, setFocusCursorPosition] = useState('end');
  const [slashMenu, setSlashMenu] = useState(null);
  // slashMenu: { blockId, filter, position: {top, left} }
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [formatToolbar, setFormatToolbar] = useState(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const titleRef = useRef(null);

  const { saveStatus, save } = useAutoSave(documentId, documentVersion);

  // Auto-save whenever blocks change
  useEffect(() => {
    if (blocks.length > 0) {
      save(blocks);
    }
  }, [blocks, save]);

  // Keep title DOM in sync with server/parent updates without breaking caret while typing.
  useEffect(() => {
    if (!titleRef.current || isEditingTitle) return;
    const nextTitle = documentTitle || '';
    if (titleRef.current.innerText !== nextTitle) {
      titleRef.current.innerText = nextTitle;
    }
  }, [documentTitle, isEditingTitle]);

  // =============================================
  // HELPER: Get DOM element for a block
  // =============================================
  const getBlockElement = useCallback((blockId) => {
    return document.querySelector(`[data-block-id="${blockId}"] [contenteditable]`);
  }, []);

  // =============================================
  // SLASH MENU LOGIC
  // =============================================
  const openSlashMenu = useCallback((blockId, element) => {
    const rect = element.getBoundingClientRect();
    setSlashMenu({
      blockId,
      filter: '',
      position: {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      },
    });
  }, []);

  const closeSlashMenu = useCallback(() => {
    setSlashMenu(null);
  }, []);

  const syncBlockFromDom = useCallback(
    (blockId) => {
      const el = getBlockElement(blockId);
      if (!el) return;
      const text = el.innerText || '';
      const html = el.innerHTML || '';
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, content: { ...b.content, text, html } } : b))
      );
    },
    [getBlockElement]
  );

  const formatToolbarRef = useRef(null);

  const setFormatToolbarIfChanged = useCallback((nextToolbar) => {
    const prev = formatToolbarRef.current;
    const equal =
      prev?.blockId === nextToolbar?.blockId &&
      prev?.position?.top === nextToolbar?.position?.top &&
      prev?.position?.left === nextToolbar?.position?.left;

    if (equal) return;

    formatToolbarRef.current = nextToolbar;
    setFormatToolbar(nextToolbar);
  }, []);

  useEffect(() => {
    const updateToolbar = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setFormatToolbarIfChanged(null);
        return;
      }

      const anchorEl = selection.anchorNode?.parentElement;
      const focusEl = selection.focusNode?.parentElement;
      if (!anchorEl || !focusEl) {
        setFormatToolbarIfChanged(null);
        return;
      }

      const editableA = anchorEl.closest('[contenteditable="true"]');
      const editableB = focusEl.closest('[contenteditable="true"]');
      if (!editableA || !editableB || editableA !== editableB) {
        setFormatToolbarIfChanged(null);
        return;
      }

      if (editableA === titleRef.current || editableA.closest('.block-code')) {
        setFormatToolbarIfChanged(null);
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setFormatToolbarIfChanged(null);
        return;
      }

      setFormatToolbarIfChanged({
        blockId: editableA.closest('[data-block-id]')?.getAttribute('data-block-id') || null,
        position: {
          top: Math.max(8, rect.top - 48),
          left: Math.max(8, rect.left + rect.width / 2 - 80),
        },
      });
    };

    document.addEventListener('selectionchange', updateToolbar);
    window.addEventListener('scroll', updateToolbar, true);

    return () => {
      document.removeEventListener('selectionchange', updateToolbar);
      window.removeEventListener('scroll', updateToolbar, true);
    };
  }, [setFormatToolbarIfChanged]);

  const applyFormat = useCallback(
    (command, value) => {
      document.execCommand(command, false, value);
      if (formatToolbar?.blockId) {
        syncBlockFromDom(formatToolbar.blockId);
      }
    },
    [formatToolbar, syncBlockFromDom]
  );

  // =============================================
  // BLOCK CONTENT CHANGE
  // =============================================
  const handleBlockChange = useCallback(
    (blockId, newContent) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, content: newContent } : b))
      );

      // Slash menu filter update
      if (slashMenu?.blockId === blockId) {
        const text = newContent.text || '';
        const slashIdx = text.lastIndexOf('/');
        if (slashIdx !== -1) {
          setSlashMenu((prev) => prev ? { ...prev, filter: text.slice(slashIdx + 1) } : null);
        } else {
          closeSlashMenu();
        }
      }
    },
    [slashMenu, closeSlashMenu]
  );

  // =============================================
  // BLOCK DELETE — Move to trash
  // =============================================
  const handleDeleteBlock = useCallback(
    async (blockId) => {
      if (!documentId) return;

      try {
        // Remove from local state immediately for responsive UI
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));

        // Send to backend (soft delete)
        await blockAPI.delete(documentId, blockId);

        // Show success feedback (could add toast notification here)
        console.log('Block moved to trash');
      } catch (error) {
        console.error('Failed to delete block:', error);
        // Revert local state on error
        // Note: In a real app, you'd want to refetch blocks here
        // For now, we'll just log the error
      }
    },
    [documentId]
  );

  // =============================================
  // BLOCK RESTORE — From trash
  // =============================================
  const handleRestoreBlock = useCallback(async () => {
    // Refetch blocks to ensure editor is up to date after restore
    if (documentId) {
      try {
        const response = await documentAPI.get(documentId);
        setBlocks(response.data.blocks.sort((a, b) => a.order_index - b.order_index));
      } catch (error) {
        console.error('Failed to refetch blocks after restore:', error);
      }
    }
  }, [documentId]);

  // =============================================
  // SLASH MENU SELECT — Change block type
  // =============================================
  const handleSlashSelect = useCallback(
    (type) => {
      if (!slashMenu) return;
      const { blockId } = slashMenu;

      closeSlashMenu();

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== blockId) return b;
          // CRITICAL: Clear the slash text from content — no bleed
          const newContent =
            type === 'todo'
              ? { text: '', html: '', checked: false }
              : type === 'table'
              ? { rows: [['', '', ''], ['', '', ''], ['', '', '']] }
              : type === 'file'
              ? { name: '', mime: '', size: 0, url: '' }
              : type === 'divider' || type === 'image'
              ? {}
              : { text: '', html: '' };
          return { ...b, type, content: newContent };
        })
      );

      // Clear the contenteditable text
      setTimeout(() => {
        const el = getBlockElement(blockId);
        if (el) {
          el.innerText = '';
          el.focus();
        }
      }, 0);
    },
    [slashMenu, closeSlashMenu, getBlockElement]
  );

  // =============================================
  // KEY HANDLER — The heart of the editor
  // =============================================
  const handleKeyDown = useCallback(
    (e, blockId, blockIndex) => {
      const currentBlock = blocks[blockIndex];
      if (!currentBlock) return;
      const element = getBlockElement(blockId);
      const text = element?.innerText || '';

      // ============================================
      // SLASH COMMAND — Open menu on '/' at start
      // CRITICAL: Don't allow "/heading" text to enter block content.
      // ============================================
      if (e.key === '/' && text.trim() === '' && !slashMenu) {
        e.preventDefault();
        const el = getBlockElement(blockId);
        if (el) openSlashMenu(blockId, el);
        return;
      }

      // If slash menu is open, it handles ArrowUp/Down/Enter/Escape via its own listener
      if (slashMenu && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
        return;
      }

      // While slash menu is open for this block, capture typing into menu filter
      // and keep block content empty (no bleed).
      if (slashMenu?.blockId === blockId) {
        if (e.key === 'Backspace') {
          e.preventDefault();
          setSlashMenu((prev) => {
            if (!prev) return null;
            const next = prev.filter.slice(0, -1);
            return { ...prev, filter: next };
          });
          return;
        }

        // Printable characters: update filter only.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setSlashMenu((prev) => (prev ? { ...prev, filter: prev.filter + e.key } : prev));
          return;
        }
      }

      // ============================================
      // ENTER — Split block at cursor (Notion-like)
      // CRITICAL: Preserve block type for heading/list/todo
      // ============================================
      if (e.key === 'Enter' && !e.shiftKey) {
        // Code block: Enter just adds a newline, handled by browser
        if (currentBlock.type === 'code') return;

        // Table block: Do not split, just focus next block (tables have own row logic)
        if (currentBlock.type === 'table') return;

        // Non-text blocks (divider, image, file): Create paragraph instead of splitting
        if (NON_EDITABLE_TYPES.includes(currentBlock.type)) {
          e.preventDefault();
          const nextBlock = blocks[blockIndex + 1];
          const newOrderIndex = getMidpointIndex(
            currentBlock.order_index,
            nextBlock?.order_index
          );
          const newBlock = createBlock('paragraph', { text: '', html: '' }, newOrderIndex);

          setBlocks((prev) => {
            const result = [
              ...prev.slice(0, blockIndex + 1),
              newBlock,
              ...prev.slice(blockIndex + 1),
            ];
            setTimeout(() => {
              setFocusedBlockId(newBlock.id);
              setFocusCursorPosition('start');
            }, 0);
            return result;
          });
          return;
        }

        e.preventDefault();

        // Get cursor position
        const cursorOffset = element ? getCursorOffset(element) : text.length;
        const textBefore = text.slice(0, cursorOffset);
        const textAfter = text.slice(cursorOffset);

        // Update current block with text before cursor
        setBlocks((prev) => {
          const updated = prev.map((b) => {
            if (b.id !== blockId) return b;
            const newContent =
              b.type === 'todo'
                ? { text: textBefore, html: textBefore, checked: b.content.checked }
                : b.type === 'bullet_list' || b.type === 'numbered_list'
                ? { text: textBefore, html: textBefore }
                : b.type.startsWith('heading_')
                ? { text: textBefore, html: textBefore }
                : { text: textBefore, html: textBefore };
            return { ...b, content: newContent };
          });

          // Calculate order_index for new block
          const nextBlock = prev[blockIndex + 1];
          const newOrderIndex = getMidpointIndex(
            currentBlock.order_index,
            nextBlock?.order_index
          );

          // Preserve block type: heading → same heading level, list → same list type, todo → unchecked todo
          let newBlockType = 'paragraph'; // default fallback
          let newBlockContent = { text: textAfter, html: textAfter };

          if (currentBlock.type.startsWith('heading_')) {
            // Preserve heading level
            newBlockType = currentBlock.type;
            newBlockContent = { text: textAfter, html: textAfter };
          } else if (currentBlock.type === 'bullet_list') {
            newBlockType = 'bullet_list';
            newBlockContent = { text: textAfter, html: textAfter };
          } else if (currentBlock.type === 'numbered_list') {
            newBlockType = 'numbered_list';
            newBlockContent = { text: textAfter, html: textAfter };
          } else if (currentBlock.type === 'todo') {
            newBlockType = 'todo';
            newBlockContent = { text: textAfter, html: textAfter, checked: false };
          }

          const newBlock = createBlock(newBlockType, newBlockContent, newOrderIndex);

          const result = [
            ...updated.slice(0, blockIndex + 1),
            newBlock,
            ...updated.slice(blockIndex + 1),
          ];

          // Schedule focus on new block
          setTimeout(() => {
            setFocusedBlockId(newBlock.id);
            setFocusCursorPosition('start');
          }, 0);

          // Update current block DOM to only show text before cursor
          if (element) element.innerText = textBefore;

          return result;
        });

        return;
      }

      // ============================================
      // BACKSPACE — Delete or merge blocks (Notion-like)
      // ============================================
      if (e.key === 'Backspace') {
        const atStart = element ? isCursorAtStart(element) : false;

        // If cursor is at start of block
        if (atStart) {
          // CASE 1: First block in document
          // Backspace moves cursor to end of title
          if (blockIndex === 0) {
            e.preventDefault();
            if (titleRef.current) {
              titleRef.current.focus();
              setCursorToEnd(titleRef.current);
            }
            return;
          }

          const prevBlock = blocks[blockIndex - 1];

          // CASE 2: Previous block is non-text (divider/image/file)
          // Skip non-editable blocks and find the previous editable block
          if (NON_EDITABLE_TYPES.includes(prevBlock.type)) {
            e.preventDefault();
            // Find the first editable block before current block
            let editableBlockIndex = blockIndex - 1;
            while (editableBlockIndex >= 0 && NON_EDITABLE_TYPES.includes(blocks[editableBlockIndex].type)) {
              editableBlockIndex--;
            }

            // If found an editable block, move cursor to its end
            if (editableBlockIndex >= 0) {
              const editableBlock = blocks[editableBlockIndex];
              setTimeout(() => {
                const editableEl = getBlockElement(editableBlock.id);
                if (editableEl) { editableEl.focus(); setCursorToEnd(editableEl); }
              }, 0);
            } else {
              // No editable block found, move to title
              if (titleRef.current) {
                titleRef.current.focus();
                setCursorToEnd(titleRef.current);
              }
            }
            return;
          }

          // CASE 3: Current block is non-text (divider/image/file)
          // Do nothing — cannot merge into previous text block
          if (NON_EDITABLE_TYPES.includes(currentBlock.type)) {
            return;
          }

          // CASE 4: Current block is empty
          // Delete the current block and focus the previous block at its end
          if (text === '' || text === '\n') {
            e.preventDefault();
            setBlocks((prev) => {
              const filtered = prev.filter((b) => b.id !== blockId);
              // Focus previous block at end
              setTimeout(() => {
                const prevEl = getBlockElement(prevBlock.id);
                if (prevEl) { prevEl.focus(); setCursorToEnd(prevEl); }
              }, 0);
              return filtered;
            });
            return;
          }

          // CASE 5: Current block is non-empty text, merge with previous text block
          // Append current block text to previous block, then delete current block
          e.preventDefault();
          const prevText = prevBlock.content.text || '';
          const mergeOffset = prevText.length; // Remember cursor position in merged block

          setBlocks((prev) => {
            const filtered = prev
              .filter((b) => b.id !== blockId)
              .map((b) => {
                if (b.id !== prevBlock.id) return b;
                return {
                  ...b,
                  content: {
                    ...b.content,
                    text: prevText + text,
                    html: prevText + text,
                  },
                };
              });

            // Update previous block DOM and focus it
            setTimeout(() => {
              const prevEl = getBlockElement(prevBlock.id);
              if (prevEl) {
                prevEl.innerText = prevText + text;
                prevEl.focus();
                setCursorOffset(prevEl, mergeOffset);
              }
            }, 0);

            return filtered;
          });
          return;
        }
      }

      // ============================================
      // ARROW UP — Move to previous block
      // ============================================
      if (e.key === 'ArrowUp' && blockIndex > 0) {
        const prevBlock = blocks[blockIndex - 1];
        if (!NON_EDITABLE_TYPES.includes(prevBlock.type)) {
          const prevEl = getBlockElement(prevBlock.id);
          if (prevEl) {
            prevEl.focus();
            setCursorToEnd(prevEl);
          }
        }
        return;
      }

      // ============================================
      // ARROW DOWN — Move to next block
      // ============================================
      if (e.key === 'ArrowDown' && blockIndex < blocks.length - 1) {
        const nextBlock = blocks[blockIndex + 1];
        if (!NON_EDITABLE_TYPES.includes(nextBlock.type)) {
          const nextEl = getBlockElement(nextBlock.id);
          if (nextEl) {
            nextEl.focus();
            setCursorToStart(nextEl);
          }
        }
        return;
      }

      // ============================================
      // ESCAPE — Close slash menu
      // ============================================
      if (e.key === 'Escape' && slashMenu) {
        e.preventDefault();
        // Clean slash text from block content
        setBlocks((prev) =>
          prev.map((b) => {
            if (b.id !== slashMenu.blockId) return b;
            const text = b.content.text || '';
            const slashIdx = text.lastIndexOf('/');
            const cleaned = slashIdx !== -1 ? text.slice(0, slashIdx) : text;
            return { ...b, content: { ...b.content, text: cleaned, html: cleaned } };
          })
        );
        // Update the DOM element
        setTimeout(() => {
          const el = getBlockElement(slashMenu.blockId);
          if (el) {
            const currentText = el.innerText;
            const slashIdx = currentText.lastIndexOf('/');
            if (slashIdx !== -1) {
              el.innerText = currentText.slice(0, slashIdx);
              setCursorToEnd(el);
            }
          }
        }, 0);
        closeSlashMenu();
        return;
      }
    },
    [blocks, slashMenu, openSlashMenu, closeSlashMenu, getBlockElement]
  );

  // =============================================
  // DRAG & DROP — Reorder blocks
  // =============================================
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;

      setBlocks((prev) => {
        const reordered = [...prev];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);

        // Recalculate order_index using midpoint
        const destIdx = destination.index;
        const prevBlock = reordered[destIdx - 1];
        const nextBlock = reordered[destIdx + 1];
        const newOrderIndex = getMidpointIndex(
          prevBlock?.order_index,
          nextBlock?.order_index
        );

        reordered[destIdx] = { ...moved, order_index: newOrderIndex };
        return reordered;
      });
    },
    []
  );

  // =============================================
  // TITLE HANDLING
  // =============================================
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to first block
      if (blocks.length > 0) {
        const firstEl = getBlockElement(blocks[0].id);
        if (firstEl) { firstEl.focus(); setCursorToStart(firstEl); }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-14 py-10 text-slate-900 dark:text-slate-100">
      {/* Save Indicator and Trash */}
      <div className="flex justify-end items-center gap-3 mb-2">
        <button
          onClick={() => setIsTrashOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Open trash"
        >
          <FiTrash2 size={16} />
        </button>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Document Title */}
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onTitleChange?.(e.currentTarget.innerText)}
        onKeyDown={handleTitleKeyDown}
        onFocus={() => setIsEditingTitle(true)}
        onBlur={(e) => {
          setIsEditingTitle(false);
          onTitleBlur?.(e.currentTarget.innerText);
        }}
        data-placeholder="Untitled"
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6 sm:mb-8 focus:outline-none leading-tight"
        style={{ minHeight: '1.2em', direction: 'ltr', unicodeBidi: 'plaintext' }}
      />

      {/* Blocks */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <motion.div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="pl-4 md:pl-6"
            >
              <AnimatePresence initial={false}>
                {blocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    data-block-id={block.id}
                    initial={{ opacity: 0, x: -18, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 18, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    <Block
                      block={block}
                      index={index}
                      onKeyDown={handleKeyDown}
                      onChange={handleBlockChange}
                      onFocus={setFocusedBlockId}
                      onDelete={handleDeleteBlock}
                      autoFocus={focusedBlockId === block.id}
                      cursorPosition={focusCursorPosition}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </motion.div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Slash Command Menu */}
      {slashMenu && (
        <SlashMenu
          position={slashMenu.position}
          filter={slashMenu.filter}
          onSelect={handleSlashSelect}
          onClose={closeSlashMenu}
        />
      )}

      {formatToolbar && (
        <InlineFormatToolbar position={formatToolbar.position} onFormat={applyFormat} />
      )}

      {/* Click below blocks to add paragraph */}
      <div
        className="min-h-[200px] cursor-text"
        onClick={() => {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && !NON_EDITABLE_TYPES.includes(lastBlock.type)) {
            const el = getBlockElement(lastBlock.id);
            if (el) { el.focus(); setCursorToEnd(el); }
          } else {
            // Add new block
            const newBlock = createBlock(
              'paragraph',
              { text: '' },
              getMidpointIndex(lastBlock?.order_index, undefined)
            );
            setBlocks((prev) => [...prev, newBlock]);
            setTimeout(() => {
              setFocusedBlockId(newBlock.id);
              setFocusCursorPosition('start');
            }, 0);
          }
        }}
      />

      {/* Trash View */}
      <TrashView
        documentId={documentId}
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onRestore={handleRestoreBlock}
      />
    </div>
  );
};

export default BlockEditor;
