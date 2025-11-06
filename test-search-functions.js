// Test script to verify Supabase search functions
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wjotvfawhnibnjgoaqud.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb3R2ZmF3aG5pYm5qZ29hcXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA0NDMxMDcsImV4cCI6MjAwNjAxOTEwN30.xtirkUL9f4ciRcJNvwtkGuWGTMcTfRKD3KW9kdZWBpo'
);

async function testSearchFunctions() {
  console.log('Testing Supabase search functions...\n');

  // Test 1: Check if search_articles function exists
  try {
    console.log('1. Testing search_articles function...');
    const { data, error } = await supabase.rpc('search_articles', {
      user_id_param: '00000000-0000-0000-0000-000000000000',
      search_query: 'test',
      limit_count: 5
    });
    
    if (error) {
      console.log('❌ search_articles function not found or error:', error.message);
    } else {
      console.log('✅ search_articles function exists and working');
    }
  } catch (err) {
    console.log('❌ search_articles function error:', err.message);
  }

  // Test 2: Check if get_search_suggestions function exists
  try {
    console.log('\n2. Testing get_search_suggestions function...');
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      user_id_param: '00000000-0000-0000-0000-000000000000',
      query_prefix: 'te',
      suggestion_limit: 5
    });
    
    if (error) {
      console.log('❌ get_search_suggestions function not found or error:', error.message);
    } else {
      console.log('✅ get_search_suggestions function exists and working');
    }
  } catch (err) {
    console.log('❌ get_search_suggestions function error:', err.message);
  }

  // Test 3: Check if get_search_statistics function exists
  try {
    console.log('\n3. Testing get_search_statistics function...');
    const { data, error } = await supabase.rpc('get_search_statistics', {
      user_id_param: '00000000-0000-0000-0000-000000000000',
      days_back: 30
    });
    
    if (error) {
      console.log('❌ get_search_statistics function not found or error:', error.message);
    } else {
      console.log('✅ get_search_statistics function exists and working');
    }
  } catch (err) {
    console.log('❌ get_search_statistics function error:', err.message);
  }

  // Test 4: Check if generate_search_snippet function exists
  try {
    console.log('\n4. Testing generate_search_snippet function...');
    const { data, error } = await supabase.rpc('generate_search_snippet', {
      content_text: 'This is a test content with some words to search',
      search_query: 'test content',
      snippet_length: 50
    });
    
    if (error) {
      console.log('❌ generate_search_snippet function not found or error:', error.message);
    } else {
      console.log('✅ generate_search_snippet function exists and working');
    }
  } catch (err) {
    console.log('❌ generate_search_snippet function error:', err.message);
  }

  // Test 5: Check if log_search_query function exists
  try {
    console.log('\n5. Testing log_search_query function...');
    const { data, error } = await supabase.rpc('log_search_query', {
      user_id_param: '00000000-0000-0000-0000-000000000000',
      query_text_param: 'test query',
      result_count_param: 5,
      execution_time_param: 150
    });
    
    if (error) {
      console.log('❌ log_search_query function not found or error:', error.message);
    } else {
      console.log('✅ log_search_query function exists and working');
    }
  } catch (err) {
    console.log('❌ log_search_query function error:', err.message);
  }

  // Test 6: Check if search_queries table exists
  try {
    console.log('\n6. Testing search_queries table...');
    const { data, error, count } = await supabase
      .from('search_queries')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('❌ search_queries table not found or error:', error.message);
    } else {
      console.log('✅ search_queries table exists');
    }
  } catch (err) {
    console.log('❌ search_queries table error:', err.message);
  }

  console.log('\nTest completed. If functions are missing, run the SQL migration.');
}

testSearchFunctions().catch(console.error);