require('dotenv').config();
const { query } = require('./config/database');

async function fixFileBlocks() {
  try {
    console.log('🔧 Fixing existing file blocks...');

    // Convert any existing file blocks to paragraph blocks
    const result = await query(
      "UPDATE blocks SET type = 'paragraph', content = $1 WHERE type = 'file'",
      [{ text: 'File attachment removed' }]
    );

    console.log(`✅ Converted ${result.rowCount} file blocks to paragraphs`);

    // Drop and re-add the constraint
    await query('ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check');
    await query(`
      ALTER TABLE blocks ADD CONSTRAINT blocks_type_check
      CHECK (type IN ('paragraph','heading_1','heading_2','heading_3','heading_4','bullet_list','numbered_list','table','todo','code','divider','image'))
    `);

    console.log('✅ Database constraint updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing database:', err.message);
    process.exit(1);
  }
}

fixFileBlocks();
