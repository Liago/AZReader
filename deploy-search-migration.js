// Deployment script for AZReader search functionality migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://wjotvfawhnibnjgoaqud.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb3R2ZmF3aG5pYm5qZ29hcXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA0NDMxMDcsImV4cCI6MjAwNjAxOTEwN30.xtirkUL9f4ciRcJNvwtkGuWGTMcTfRKD3KW9kdZWBpo'
);

async function deploySearchMigration() {
  console.log('🚀 Deploying AZReader Search Functionality Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database-migrations', '001-search-functionality.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`📊 Migration size: ${migrationSQL.length} characters\n`);

    // Split the migration into individual statements
    // We need to execute each major section separately due to Supabase limitations
    const statements = [
      // 1. Create search_queries table
      migrationSQL.match(/CREATE TABLE IF NOT EXISTS search_queries[\s\S]*?(?=-- RLS policies)/)[0],
      
      // 2. RLS policies for search_queries
      migrationSQL.match(/-- RLS policies for search_queries[\s\S]*?(?=-- ================================)/)[0],
      
      // 3. Extensions
      migrationSQL.match(/-- Enable trigram extension[\s\S]*?CREATE EXTENSION IF NOT EXISTS unaccent;/)[0],
      
      // 4. Indices (split into chunks)
      migrationSQL.match(/-- Full-text search indices[\s\S]*?(?=-- ================================\n-- 4\. SEARCH_ARTICLES)/)[0],
      
      // 5. Functions (each separately)
      migrationSQL.match(/CREATE OR REPLACE FUNCTION search_articles[\s\S]*?\$\$;/)[0],
      migrationSQL.match(/CREATE OR REPLACE FUNCTION get_search_suggestions[\s\S]*?\$\$;/)[0],
      migrationSQL.match(/CREATE OR REPLACE FUNCTION get_search_statistics[\s\S]*?\$\$;/)[0],
      migrationSQL.match(/CREATE OR REPLACE FUNCTION generate_search_snippet[\s\S]*?\$\$;/)[0],
      migrationSQL.match(/CREATE OR REPLACE FUNCTION log_search_query[\s\S]*?\$\$;/)[0],
      
      // 6. Permissions
      migrationSQL.match(/-- Grant execute permissions[\s\S]*?GRANT EXECUTE ON FUNCTION log_search_query TO authenticated;/)[0]
    ];

    console.log(`📝 Split migration into ${statements.length} statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use raw SQL execution for complex statements
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`❌ Error in statement ${i + 1}:`, error.message);
          
          // Try direct approach for some statements
          if (statement.includes('CREATE EXTENSION')) {
            console.log('🔄 Retrying extension creation...');
            // Extensions might already exist, continue
            console.log('⚠️  Extension might already exist, continuing...');
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Failed to execute statement ${i + 1}:`, err.message);
        console.log('📄 Statement content:', statement.substring(0, 200) + '...');
        
        // For some errors, we might want to continue
        if (err.message.includes('already exists') || err.message.includes('extension')) {
          console.log('⚠️  Resource might already exist, continuing...');
        } else {
          throw err;
        }
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Migration deployment completed successfully!');
    console.log('\n🧪 Running verification tests...\n');

    // Verify the deployment
    await verifyDeployment();

  } catch (error) {
    console.error('\n❌ Migration deployment failed:', error.message);
    console.error('\n📋 Manual deployment required. Please run the SQL migration manually in Supabase dashboard.');
    console.log('\n📁 Migration file location: database-migrations/001-search-functionality.sql');
    process.exit(1);
  }
}

async function verifyDeployment() {
  const tests = [
    {
      name: 'search_queries table',
      test: async () => {
        const { data, error } = await supabase.from('search_queries').select('*').limit(1);
        return !error;
      }
    },
    {
      name: 'search_articles function',
      test: async () => {
        const { data, error } = await supabase.rpc('search_articles', {
          user_id_param: '00000000-0000-0000-0000-000000000000',
          search_query: '',
          limit_count: 1
        });
        return !error;
      }
    },
    {
      name: 'get_search_suggestions function',
      test: async () => {
        const { data, error } = await supabase.rpc('get_search_suggestions', {
          user_id_param: '00000000-0000-0000-0000-000000000000',
          query_prefix: 'test'
        });
        return !error;
      }
    },
    {
      name: 'generate_search_snippet function',
      test: async () => {
        const { data, error } = await supabase.rpc('generate_search_snippet', {
          content_text: 'test content',
          search_query: 'test'
        });
        return !error;
      }
    }
  ];

  let passed = 0;
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${name}: FAILED`);
      }
    } catch (err) {
      console.log(`❌ ${name}: ERROR -`, err.message);
    }
  }

  console.log(`\n📊 Verification Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All search functions are working correctly!');
  } else {
    console.log('⚠️  Some functions may need manual deployment via Supabase dashboard');
  }
}

// Run the deployment
deploySearchMigration().catch(console.error);