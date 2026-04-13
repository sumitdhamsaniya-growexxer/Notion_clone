// frontend/src/components/editor/Block.jsx
import React, { useRef, useState, useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { FiMenu } from 'react-icons/fi';
import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import TodoBlock from './blocks/TodoBlock';
import CodeBlock from './blocks/CodeBlock';
import DividerBlock from './blocks/DividerBlock';
import ImageBlock from './blocks/ImageBlock';

const BLOCK_COMPONENTS = {
  paragraph: ParagraphBlock,
  heading_1: HeadingBlock,
  heading_2: HeadingBlock,
  todo: TodoBlock,
  code: CodeBlock,
  divider: DividerBlock,
  image: ImageBlock,
};

const Block = ({
  block,
  index,
  onKeyDown,
  onChange,
  onFocus,
  readOnly = false,
  autoFocus = false,
  cursorPosition = 'end',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const BlockComponent = BLOCK_COMPONENTS[block.type] || ParagraphBlock;

  const handleChange = useCallback(
    (content) => {
      onChange?.(block.id, content);
    },
    [block.id, onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      onKeyDown?.(e, block.id, index);
    },
    [block.id, index, onKeyDown]
  );

  const blockContent = (provided) => (
    <div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      className="block-wrapper relative group flex items-start gap-1 px-2 py-0.5 rounded"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onFocus?.(block.id)}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <div
          {...(provided?.dragHandleProps || {})}
          className={`flex-shrink-0 mt-1 p-1 rounded cursor-grab active:cursor-grabbing text-notion-muted hover:bg-gray-100 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ marginLeft: '-24px' }}
          title="Drag to reorder"
        >
          <FiMenu size={14} />
        </div>
      )}

      {/* Block Content */}
      <div className="flex-1 min-w-0">
        <BlockComponent
          block={block}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          autoFocus={autoFocus}
          cursorPosition={cursorPosition}
        />
      </div>

      {provided?.placeholder}
    </div>
  );

  if (readOnly) {
    return blockContent(null);
  }

  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`block-wrapper relative group flex items-start gap-1 px-2 py-0.5 rounded ${
            snapshot.isDragging ? 'shadow-lg bg-white opacity-90' : ''
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onFocus?.(block.id)}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className={`flex-shrink-0 mt-1 p-1 rounded cursor-grab active:cursor-grabbing text-notion-muted hover:bg-gray-100 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ marginLeft: '-24px' }}
            title="Drag to reorder"
          >
            <FiMenu size={14} />
          </div>

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <BlockComponent
              block={block}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              autoFocus={autoFocus}
              cursorPosition={cursorPosition}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Block;
