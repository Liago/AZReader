const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://wjotvfawhnibnjgoaqud.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb3R2ZmF3aG5pYm5qZ29hcXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA0NDMxMDcsImV4cCI6MjAwNjAxOTEwN30.xtirkUL9f4ciRcJNvwtkGuWGTMcTfRKD3KW9kdZWBpo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
    console.log('🔍 Analisi Database Supabase per Migrazione Posts → Articles\n');

    try {
        // 1. Verifica esistenza tabelle
        console.log('1. Controllo esistenza tabelle...');
        
        const { data: postsExists, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .limit(1);
        
        const { data: articlesExists, error: articlesError } = await supabase
            .from('articles')
            .select('*')
            .limit(1);

        console.log(`   - Tabella "posts": ${postsError ? '❌ Non trovata' : '✅ Trovata'}`);
        console.log(`   - Tabella "articles": ${articlesError ? '❌ Non trovata' : '✅ Trovata'}`);

        if (postsError && articlesError) {
            console.log('❌ Entrambe le tabelle non sono accessibili');
            return;
        }

        // 2. Conta record nelle tabelle
        console.log('\n2. Conteggio record...');
        
        if (!postsError) {
            const { count: postsCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true });
            console.log(`   - Posts: ${postsCount} record`);
        }

        if (!articlesError) {
            const { count: articlesCount } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true });
            console.log(`   - Articles: ${articlesCount} record`);
        }

        // 3. Analizza struttura tabella posts (se esiste)
        if (!postsError) {
            console.log('\n3. Struttura tabella "posts":');
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .limit(1);
            
            if (postsData && postsData.length > 0) {
                const columns = Object.keys(postsData[0]);
                columns.forEach(col => {
                    const value = postsData[0][col];
                    const type = typeof value;
                    console.log(`   - ${col}: ${type} ${value === null ? '(nullable)' : ''}`);
                });
            }
        }

        // 4. Analizza struttura tabella articles (se esiste)
        if (!articlesError) {
            console.log('\n4. Struttura tabella "articles":');
            const { data: articlesData } = await supabase
                .from('articles')
                .select('*')
                .limit(1);
            
            if (articlesData && articlesData.length > 0) {
                const columns = Object.keys(articlesData[0]);
                columns.forEach(col => {
                    const value = articlesData[0][col];
                    const type = typeof value;
                    console.log(`   - ${col}: ${type} ${value === null ? '(nullable)' : ''}`);
                });
            } else {
                console.log('   - Tabella articles è vuota, analizzando i tipi dalle database-types...');
            }
        }

        // 5. Mostra alcuni record di esempio dalla tabella posts
        if (!postsError) {
            console.log('\n5. Primi 3 record dalla tabella "posts":');
            const { data: samplePosts } = await supabase
                .from('posts')
                .select('*')
                .limit(3);
            
            if (samplePosts) {
                samplePosts.forEach((post, index) => {
                    console.log(`\n   Record ${index + 1}:`);
                    Object.entries(post).forEach(([key, value]) => {
                        console.log(`     ${key}: ${JSON.stringify(value)}`);
                    });
                });
            }
        }

    } catch (error) {
        console.error('❌ Errore durante l\'analisi:', error);
    }
}

// Esegui l'analisi
analyzeDatabase();