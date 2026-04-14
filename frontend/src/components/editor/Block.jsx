// frontend/src/components/editor/Block.jsx
import React, { useRef, useState, useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';
import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import TodoBlock from './blocks/TodoBlock';
import CodeBlock from './blocks/CodeBlock';
import DividerBlock from './blocks/DividerBlock';
import ImageBlock from './blocks/ImageBlock';
import BulletListBlock from './blocks/BulletListBlock';
import NumberedListBlock from './blocks/NumberedListBlock';
import FileBlock from './blocks/FileBlock';
import TableBlock from './blocks/TableBlock';

const BLOCK_COMPONENTS = {
  paragraph: ParagraphBlock,
  heading_1: HeadingBlock,
  heading_2: HeadingBlock,
  heading_3: HeadingBlock,
  heading_4: HeadingBlock,
  bullet_list: BulletListBlock,
  numbered_list: NumberedListBlock,
  table: TableBlock,
  todo: TodoBlock,
  code: CodeBlock,
  file: FileBlock,
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
      className="block-wrapper relative group flex items-start gap-1 px-2 py-0.5 rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onFocus?.(block.id)}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <div
          {...(provided?.dragHandleProps || {})}
          className={`flex-shrink-0 mt-1 p-1 rounded-lg cursor-grab active:cursor-grabbing text-slate-500 hover:bg-white/10 transition-all active:scale-110 ${
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${block.id}-${block.type}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <BlockComponent
              block={block}
              index={index}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              autoFocus={autoFocus}
              cursorPosition={cursorPosition}
            />
          </motion.div>
        </AnimatePresence>
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
          className={`block-wrapper relative group flex items-start gap-1 px-2 py-0.5 rounded-xl ${
            snapshot.isDragging ? 'shadow-2xl bg-slate-100/90 dark:bg-slate-900/90 opacity-95 scale-[1.01]' : ''
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onFocus?.(block.id)}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className={`flex-shrink-0 mt-1 p-1 rounded-lg cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-110 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ marginLeft: '-24px' }}
            title="Drag to reorder"
          >
            <FiMenu size={14} />
          </div>

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${block.id}-${block.type}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <BlockComponent
                  block={block}
                  index={index}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  readOnly={readOnly}
                  autoFocus={autoFocus}
                  cursorPosition={cursorPosition}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Block;
