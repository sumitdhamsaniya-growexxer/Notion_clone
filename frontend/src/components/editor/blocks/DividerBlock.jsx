// frontend/src/components/editor/blocks/DividerBlock.jsx
import React from 'react';

// Non-editable — just a horizontal rule
const DividerBlock = () => {
  return (
    <div className="py-3 cursor-default select-none">
      <hr className="border-notion-border" />
    </div>
  );
};

export default DividerBlock;
