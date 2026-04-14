// frontend/src/utils/blockUtils.js
import { v4 as uuidv4 } from 'uuid';

// Create a new block object (client-side, before save)
export const createBlock = (type = 'paragraph', content = {}, orderIndex) => ({
  id: uuidv4(),
  type,
  content: type === 'todo'
    ? { text: '', html: '', checked: false, ...content }
    : { text: '', html: '', ...content },
  order_index: orderIndex,
  parent_id: null,
});

// Calculate order_index for a new block inserted between prev and next
// Uses midpoint — FLOAT as per spec
export const getMidpointIndex = (prevIndex, nextIndex) => {
  if (prevIndex === undefined && nextIndex === undefined) return 1000.0;
  if (prevIndex === undefined) return nextIndex - 1000.0;
  if (nextIndex === undefined) return prevIndex + 1000.0;
  return (prevIndex + nextIndex) / 2;
};

// Check if gap between two consecutive blocks is dangerously small
export const needsRenormalization = (blocks) => {
  for (let i = 0; i < blocks.length - 1; i++) {
    const gap = blocks[i + 1].order_index - blocks[i].order_index;
    if (gap < 0.001) return true;
  }
  return false;
};

// Re-assign evenly spaced order_index values client-side before saving
export const renormalizeBlocks = (blocks) => {
  return blocks.map((block, i) => ({
    ...block,
    order_index: (i + 1) * 1000.0,
  }));
};

// Get text content from a block's contenteditable element
export const getBlockText = (element) => {
  return element?.innerText || element?.textContent || '';
};

// Get cursor position within a contenteditable element
export const getCursorOffset = (element) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
};

// Set cursor position within a contenteditable element
export const setCursorOffset = (element, offset) => {
  if (!element) return;
  const selection = window.getSelection();
  const range = document.createRange();

  let currentOffset = 0;
  let found = false;

  const walkNode = (node) => {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent.length;
      if (currentOffset + len >= offset) {
        range.setStart(node, offset - currentOffset);
        range.collapse(true);
        found = true;
      } else {
        currentOffset += len;
      }
    } else {
      for (const child of node.childNodes) {
        walkNode(child);
        if (found) return;
      }
    }
  };

  walkNode(element);

  if (!found) {
    range.selectNodeContents(element);
    range.collapse(false); // end of element
  }

  selection.removeAllRanges();
  selection.addRange(range);
};

// Place cursor at end of contenteditable
export const setCursorToEnd = (element) => {
  if (!element) return;
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

// Place cursor at start of contenteditable
export const setCursorToStart = (element) => {
  if (!element) return;
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

// Is cursor at the very start of a contenteditable?
export const isCursorAtStart = (element) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  if (!range.collapsed) return false;
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length === 0;
};

// Is cursor at the very end of a contenteditable?
export const isCursorAtEnd = (element) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  if (!range.collapsed) return false;
  const text = element.innerText || element.textContent || '';
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length === text.length;
};

// BLOCK TYPES CONFIG for slash menu
export const BLOCK_TYPES = [
  { type: 'paragraph', label: 'Text', description: 'Plain text paragraph', icon: '¶', keywords: ['text', 'paragraph', 'p'] },
  { type: 'heading_1', label: 'Heading 1', description: 'Large section heading', icon: 'H1', keywords: ['h1', 'heading', 'title'] },
  { type: 'heading_2', label: 'Heading 2', description: 'Medium section heading', icon: 'H2', keywords: ['h2', 'heading', 'subtitle'] },
  { type: 'heading_3', label: 'Heading 3', description: 'Small section heading', icon: 'H3', keywords: ['h3', 'heading'] },
  { type: 'heading_4', label: 'Heading 4', description: 'Compact heading', icon: 'H4', keywords: ['h4', 'heading'] },
  { type: 'bullet_list', label: 'Bulleted list', description: 'Create a bulleted list item', icon: '•', keywords: ['bullet', 'list', 'ul'] },
  { type: 'numbered_list', label: 'Numbered list', description: 'Create a numbered list item', icon: '1.', keywords: ['numbered', 'list', 'ol'] },
  { type: 'table', label: 'Table', description: 'Insert a basic editable table', icon: '▦', keywords: ['table', 'grid', 'rows', 'columns'] },
  { type: 'todo', label: 'To-do', description: 'Track tasks with checkbox', icon: '☑', keywords: ['todo', 'task', 'check', 'checkbox'] },
  { type: 'code', label: 'Code', description: 'Capture code snippet', icon: '<>', keywords: ['code', 'snippet', 'pre'] },
  { type: 'file', label: 'Attach file', description: 'Upload and attach a file', icon: '📎', keywords: ['file', 'attach', 'upload'] },
  { type: 'divider', label: 'Divider', description: 'Horizontal divider line', icon: '—', keywords: ['divider', 'hr', 'separator', 'line'] },
  { type: 'image', label: 'Image', description: 'Embed image from URL', icon: '🖼', keywords: ['image', 'img', 'photo', 'picture', 'url'] },
];
