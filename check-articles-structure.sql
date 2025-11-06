-- Controlla la struttura effettiva della tabella articles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' AND table_schema = 'public'
ORDER BY ordinal_position;