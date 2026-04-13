// frontend/src/components/editor/BlockEditor.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import Block from './Block';
import SlashMenu from './SlashMenu';
import {
  createBlock,
  getMidpointIndex,
  getCursorOffset,
  setCursorOffset,
  setCursorToEnd,
  setCursorToStart,
  isCursorAtStart,
  BLOCK_TYPES,
} from '../../utils/blockUtils';
import useAutoSave from '../../hooks/useAutoSave';
import SaveIndicator from '../ui/SaveIndicator';

const NON_EDITABLE_TYPES = ['divider', 'image'];

const BlockEditor = ({ documentId, initialBlocks = [], documentTitle, onTitleChange, onTitleBlur }) => {
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
  const titleRef = useRef(null);
  const blockRefs = useRef({}); // blockId -> DOM element ref

  const { saveStatus, save } = useAutoSave(documentId);

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
              ? { text: '', checked: false }
              : type === 'divider' || type === 'image'
              ? {}
              : { text: '' };
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
      // ============================================
      if (e.key === '/' && text === '' && !slashMenu) {
        // Don't prevent default — let the '/' be typed first
        setTimeout(() => {
          const el = getBlockElement(blockId);
          if (el) openSlashMenu(blockId, el);
        }, 0);
        return;
      }

      // If slash menu is open, it handles ArrowUp/Down/Enter/Escape via its own listener
      if (slashMenu && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
        return;
      }

      // ============================================
      // ENTER — Split block at cursor
      // ============================================
      if (e.key === 'Enter' && !e.shiftKey) {
        // Code block: Enter just adds a newline, handled by browser
        if (currentBlock.type === 'code') return;

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
                ? { text: textBefore, checked: b.content.checked }
                : { text: textBefore };
            return { ...b, content: newContent };
          });

          // Calculate order_index for new block
          const nextBlock = prev[blockIndex + 1];
          const newOrderIndex = getMidpointIndex(
            currentBlock.order_index,
            nextBlock?.order_index
          );

          // Create new paragraph block with text after cursor
          const newBlock = createBlock('paragraph', { text: textAfter }, newOrderIndex);

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
      // BACKSPACE — Delete or merge blocks
      // ============================================
      if (e.key === 'Backspace') {
        const atStart = element ? isCursorAtStart(element) : false;

        // If cursor is at start of block
        if (atStart) {
          // If it's the FIRST block — no action (edge case: nothing to merge into)
          if (blockIndex === 0) {
            // Convert heading/etc to paragraph if non-empty
            if (currentBlock.type !== 'paragraph' && text.length > 0) {
              e.preventDefault();
              setBlocks((prev) =>
                prev.map((b) =>
                  b.id === blockId ? { ...b, type: 'paragraph' } : b
                )
              );
            }
            // If paragraph at start, no action
            return;
          }

          const prevBlock = blocks[blockIndex - 1];

          // If previous block is non-editable (divider/image), just delete the prev block
          if (NON_EDITABLE_TYPES.includes(prevBlock.type)) {
            e.preventDefault();
            setBlocks((prev) => prev.filter((b) => b.id !== prevBlock.id));
            // Keep focus on current block
            setTimeout(() => {
              const el = getBlockElement(blockId);
              if (el) { el.focus(); setCursorToStart(el); }
            }, 0);
            return;
          }

          // If current block is empty — delete it
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

          // If current block is non-empty and prev block is text — merge
          if (!NON_EDITABLE_TYPES.includes(currentBlock.type)) {
            e.preventDefault();
            const prevText = prevBlock.content.text || '';
            const mergeOffset = prevText.length; // Remember cursor position in merged block

            setBlocks((prev) => {
              const filtered = prev
                .filter((b) => b.id !== blockId)
                .map((b) => {
                  if (b.id !== prevBlock.id) return b;
                  return { ...b, content: { ...b.content, text: prevText + text } };
                });

              // Update prev block DOM
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
            return { ...b, content: { ...b.content, text: cleaned } };
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
    <div className="max-w-3xl mx-auto px-16 py-12">
      {/* Save Indicator */}
      <div className="flex justify-end mb-2">
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
        className="text-5xl font-bold text-notion-text mb-8 focus:outline-none leading-tight"
        style={{ minHeight: '1.2em', direction: 'ltr', unicodeBidi: 'plaintext' }}
      />

      {/* Blocks */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="pl-6" // Extra left padding for drag handles
            >
              {blocks.map((block, index) => (
                <div key={block.id} data-block-id={block.id}>
                  <Block
                    block={block}
                    index={index}
                    onKeyDown={handleKeyDown}
                    onChange={handleBlockChange}
                    onFocus={setFocusedBlockId}
                    autoFocus={focusedBlockId === block.id}
                    cursorPosition={focusCursorPosition}
                  />
                </div>
              ))}
              {provided.placeholder}
            </div>
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
    </div>
  );
};

export default BlockEditor;
