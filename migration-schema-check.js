const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wjotvfawhnibnjgoaqud.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb3R2ZmF3aG5pYm5qZ29hcXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA0NDMxMDcsImV4cCI6MjAwNjAxOTEwN30.xtirkUL9f4ciRcJNvwtkGuWGTMcTfRKD3KW9kdZWBpo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTablesSchema() {
    console.log('🔍 Analisi Schema Database per Migrazione Posts → Articles\n');

    try {
        console.log('1. Controllo struttura tabelle usando information_schema...\n');

        // Saltiamo la query diretta sui metadati per ora
        console.log('   Approccio diretto ai metadati non disponibile con chiave anonima');

        console.log('Schema non accessibile direttamente. Proviamo un approccio alternativo...\n');

        // Approccio alternativo: creiamo un record di test per vedere la struttura
        console.log('2. Test di inserimento per analizzare struttura...\n');

        // Test su tabella posts (se esiste)
        console.log('   Testing tabella "posts":');
        try {
            const { data: postsTest, error: postsTestError } = await supabase
                .from('posts')
                .insert({
                    title: 'TEST_MIGRATION_ANALYSIS',
                    url: 'https://test.com/migration'
                })
                .select()
                .single();

            if (postsTestError) {
                console.log('   ❌ Errore:', postsTestError.message);
                console.log('   Dettagli:', postsTestError.details || 'Nessun dettaglio');
                console.log('   Hint:', postsTestError.hint || 'Nessun suggerimento');
                
                // Analizza l'errore per capire la struttura
                if (postsTestError.message.includes('column') || postsTestError.message.includes('null')) {
                    console.log('   🔍 L\'errore può dirci qualcosa sulla struttura della tabella');
                }
            } else {
                console.log('   ✅ Test inserimento riuscito - struttura tabella posts:');
                if (postsTest) {
                    Object.keys(postsTest).forEach(column => {
                        console.log(`     - ${column}: ${typeof postsTest[column]} ${postsTest[column] === null ? '(nullable)' : ''}`);
                    });
                    
                    // Elimina il record di test
                    await supabase.from('posts').delete().eq('title', 'TEST_MIGRATION_ANALYSIS');
                    console.log('   🗑️ Record di test eliminato');
                }
            }
        } catch (error) {
            console.log('   ❌ Eccezione:', error.message);
        }

        // Test su tabella articles
        console.log('\n   Testing tabella "articles":');
        try {
            const { data: articlesTest, error: articlesTestError } = await supabase
                .from('articles')
                .insert({
                    title: 'TEST_MIGRATION_ANALYSIS',
                    url: 'https://test.com/migration',
                    user_id: 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb' // L'user_id che useremo per la migrazione
                })
                .select()
                .single();

            if (articlesTestError) {
                console.log('   ❌ Errore:', articlesTestError.message);
                console.log('   Dettagli:', articlesTestError.details || 'Nessun dettaglio');
            } else {
                console.log('   ✅ Test inserimento riuscito - struttura tabella articles:');
                if (articlesTest) {
                    Object.keys(articlesTest).forEach(column => {
                        console.log(`     - ${column}: ${typeof articlesTest[column]} ${articlesTest[column] === null ? '(nullable)' : ''}`);
                    });
                    
                    // Elimina il record di test
                    await supabase.from('articles').delete().eq('title', 'TEST_MIGRATION_ANALYSIS');
                    console.log('   🗑️ Record di test eliminato');
                }
            }
        } catch (error) {
            console.log('   ❌ Eccezione:', error.message);
        }

        // Verifica se ci sono dati nella tabella posts
        console.log('\n3. Controllo contenuto tabelle...');
        
        const { count: postsCount, error: postsCountError } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });
            
        const { count: articlesCount, error: articlesCountError } = await supabase
            .from('articles') 
            .select('*', { count: 'exact', head: true });

        console.log(`   - Posts: ${postsCountError ? 'Errore nel conteggio' : postsCount} record`);
        console.log(`   - Articles: ${articlesCountError ? 'Errore nel conteggio' : articlesCount} record`);

        // Se ci sono dati, mostra alcuni esempi
        if (postsCount > 0) {
            console.log('\n4. Esempi dalla tabella posts:');
            const { data: samplePosts } = await supabase
                .from('posts')
                .select('*')
                .limit(2);
            
            if (samplePosts) {
                samplePosts.forEach((post, index) => {
                    console.log(`\n   Record ${index + 1}:`);
                    Object.entries(post).forEach(([key, value]) => {
                        const preview = typeof value === 'string' && value.length > 50 
                            ? value.substring(0, 50) + '...' 
                            : value;
                        console.log(`     ${key}: ${JSON.stringify(preview)}`);
                    });
                });
            }
        }

        console.log('\n5. Verifica user_id target...');
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb')
            .single();

        if (userError) {
            console.log('   ❌ User target non trovato:', userError.message);
        } else {
            console.log('   ✅ User target trovato:', targetUser);
        }

    } catch (error) {
        console.error('❌ Errore generale:', error);
    }
}

analyzeTablesSchema();