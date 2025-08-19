-- =====================================
-- SCRIPT MIGRAZIONE POSTS → ARTICLES (FINALE FUNZIONANTE)
-- =====================================
-- Basato sulle strutture reali: posts.id=text, articles.id=uuid, articles.user_id=text

BEGIN;

-- Verifica preliminare
DO $$ 
BEGIN
    RAISE NOTICE '=== INIZIO MIGRAZIONE ===';
    RAISE NOTICE 'Records in posts: %', (SELECT COUNT(*) FROM posts);
    RAISE NOTICE 'Records in articles: %', (SELECT COUNT(*) FROM articles);
END $$;

-- Verifica che l'user target esista
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb') THEN
        RAISE EXCEPTION 'User target non trovato: a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb';
    END IF;
    RAISE NOTICE 'User target verificato: andrea.zampierolo@me.com';
END $$;

-- Migrazione completa
INSERT INTO articles (
    id,                   -- uuid (genera sempre nuovo)
    user_id,             -- text (assegna all'user target)
    url,                 -- text → text
    title,               -- text → text
    content,             -- text → text
    excerpt,             -- text → text
    image_url,           -- text → text (da lead_image_url)
    favicon_url,         -- text (null, non esiste in posts)
    author,              -- text → text
    published_date,      -- timestamp → timestamp
    domain,              -- text → text
    tags,                -- array (vuoto, non esiste in posts)
    is_favorite,         -- boolean (default false)
    like_count,          -- integer (default 0)
    comment_count,       -- integer (default 0)
    reading_status,      -- text (default 'unread')
    estimated_read_time, -- integer (calcolato da word_count)
    is_public,           -- boolean (default false)
    scraped_at,          -- timestamp (usa savedOn)
    created_at,          -- timestamp (usa savedOn)
    updated_at           -- timestamp (now)
)
SELECT 
    -- ID: genera sempre nuovo UUID
    gen_random_uuid() as id,
    
    -- User ID: assegna all'user target (come TEXT)
    'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb' as user_id,
    
    p.url,
    
    -- Titolo: pulisce caratteri problematici
    TRIM(REPLACE(REPLACE(p.title, E'\n', ' '), E'\r', '')) as title,
    
    p.content,
    
    -- Excerpt: gestisce stringhe vuote
    CASE 
        WHEN p.excerpt IS NOT NULL AND TRIM(p.excerpt) != '' 
        THEN TRIM(p.excerpt)
        ELSE NULL 
    END as excerpt,
    
    -- Image URL: mappa da lead_image_url
    CASE 
        WHEN p.lead_image_url IS NOT NULL AND TRIM(p.lead_image_url) != '' 
        THEN TRIM(p.lead_image_url)
        ELSE NULL 
    END as image_url,
    
    -- Favicon URL: non esiste in posts
    NULL as favicon_url,
    
    -- Author: gestisce stringhe vuote
    CASE 
        WHEN p.author IS NOT NULL AND TRIM(p.author) != '' 
        THEN TRIM(p.author)
        ELSE NULL 
    END as author,
    
    -- Published date: mapping diretto
    p.date_published as published_date,
    
    p.domain,
    
    -- Tags: array vuoto (non esiste in posts)
    '{}'::text[] as tags,
    
    -- Campi con valori default
    false as is_favorite,
    0 as like_count,
    0 as comment_count,
    'unread' as reading_status,
    
    -- Estimated read time: calcola da word_count
    CASE 
        WHEN p.word_count IS NOT NULL AND p.word_count > 0 
        THEN GREATEST(1, CEIL(p.word_count::float / 250.0)::integer)
        ELSE NULL
    END as estimated_read_time,
    
    false as is_public,
    
    -- Timestamps: usa savedOn se disponibile, altrimenti now()
    COALESCE(p."savedOn", NOW()) as scraped_at,
    COALESCE(p."savedOn", NOW()) as created_at,
    NOW() as updated_at

FROM posts p
WHERE 
    -- Filtri di validità
    p.id IS NOT NULL 
    AND p.url IS NOT NULL 
    AND p.title IS NOT NULL
    AND LENGTH(TRIM(p.title)) > 0
    AND p.url != ''
    -- Controllo duplicati: evita URL già esistenti per lo stesso user
    AND NOT EXISTS (
        SELECT 1 FROM articles a 
        WHERE a.url = p.url 
        AND a.user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb'
    );

-- Verifica post-migrazione
DO $$ 
DECLARE
    posts_count integer;
    articles_count integer;
    migrated_count integer;
    success_rate numeric;
BEGIN
    SELECT COUNT(*) INTO posts_count FROM posts;
    SELECT COUNT(*) INTO articles_count FROM articles;
    SELECT COUNT(*) INTO migrated_count 
    FROM articles 
    WHERE user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb';
    
    IF posts_count > 0 THEN
        success_rate := (migrated_count::numeric / posts_count::numeric) * 100;
    ELSE
        success_rate := 0;
    END IF;
    
    RAISE NOTICE '=== RISULTATI MIGRAZIONE ===';
    RAISE NOTICE 'Record originali (posts): %', posts_count;
    RAISE NOTICE 'Record totali (articles): %', articles_count;
    RAISE NOTICE 'Record migrati per user: %', migrated_count;
    RAISE NOTICE 'Tasso successo: %.1f%%', success_rate;
    
    IF success_rate >= 95 THEN
        RAISE NOTICE '✅ MIGRAZIONE ECCELLENTE!';
    ELSIF success_rate >= 85 THEN
        RAISE NOTICE '✅ MIGRAZIONE BUONA';
    ELSIF success_rate >= 70 THEN
        RAISE NOTICE '⚠️ MIGRAZIONE ACCETTABILE - Alcuni record non migrati';
    ELSE
        RAISE NOTICE '❌ MIGRAZIONE PROBLEMATICA - Verificare i dati';
    END IF;
END $$;

-- Controllo qualità dati
DO $$
DECLARE
    title_issues integer;
    image_count integer;
    content_count integer;
BEGIN
    -- Titoli con problemi
    SELECT COUNT(*) INTO title_issues
    FROM articles 
    WHERE user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb'
    AND LENGTH(title) > 200;
    
    -- Articoli con immagini
    SELECT COUNT(*) INTO image_count
    FROM articles 
    WHERE user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb'
    AND image_url IS NOT NULL;
    
    -- Articoli con contenuto
    SELECT COUNT(*) INTO content_count
    FROM articles 
    WHERE user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb'
    AND content IS NOT NULL AND LENGTH(content) > 100;
    
    RAISE NOTICE '=== QUALITÀ DATI ===';
    RAISE NOTICE 'Titoli molto lunghi (>200 char): %', title_issues;
    RAISE NOTICE 'Articoli con immagini: %', image_count;
    RAISE NOTICE 'Articoli con contenuto sostanziale: %', content_count;
END $$;

-- Mostra esempi di articoli migrati
SELECT 
    '=== PRIMI 5 ARTICOLI MIGRATI ===' as info,
    LEFT(id::text, 8) || '...' as id_preview,
    LEFT(title, 50) || CASE WHEN LENGTH(title) > 50 THEN '...' ELSE '' END as title_preview,
    domain,
    estimated_read_time,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_date
FROM articles 
WHERE user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb'
ORDER BY created_at DESC 
LIMIT 5;

-- Distribuzione per domini più comuni
SELECT 
    '=== TOP 5 DOMINI ===' as info,
    domain,
    COUNT(*) as articles_count
FROM articles 
WHERE user_id = 'a9f8bfe8-44a4-47aa-8cd8-4fd7014666fb'
AND domain IS NOT NULL
GROUP BY domain
ORDER BY articles_count DESC
LIMIT 5;

DO $$ 
BEGIN
    RAISE NOTICE '=== MIGRAZIONE COMPLETATA CON SUCCESSO ===';
    RAISE NOTICE 'Tutti gli articoli sono stati assegnati a andrea.zampierolo@me.com';
    RAISE NOTICE 'La tabella posts originale è stata mantenuta come backup';
    RAISE NOTICE 'Puoi ora testare l\'applicazione con i dati migrati';
    RAISE NOTICE '=============================================';
END $$;

COMMIT;