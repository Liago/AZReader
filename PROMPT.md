# AZReader – Product Requirements Document (PRD)

## 🧾 Overview
AZReader è un'app mobile per la raccolta, organizzazione e lettura di articoli web, ripuliti tramite un'istanza privata di Mercury Parser. Gli articoli sono salvabili, taggabili, condivisibili, commentabili e ricercabili.

## 🎯 Goals
- Offrire un'esperienza di lettura pulita da contenuti web disordinati.
- Consentire l'interazione sociale sugli articoli salvati.
- Garantire autenticazione sicura e sincronizzazione tramite Supabase.

## 🧩 Features

### 🟩 Core Features
- **Inserimento URL**: parsing via Mercury Parser, anteprima, salvataggio.
- **Salvataggio Articolo**: con tag, stato lettura, descrizione.
- **Interazioni Sociali**: like, commenti liberi, preferiti, condivisione interna/esterna.
- **Ricerca**: per testo, titolo, autore, tag.
- **Autenticazione**: Gmail, Apple, Twitter, Email/password via Supabase Auth.
- **Condivisione**: articoli privati di default, ma condivisibili con altri utenti.

### 🧠 Discover
- Articoli popolari e pubblici condivisi.
- Ordinabili per popolarità, attività, tempo.
- Possibilità di seguire altri utenti.

### 📰 Integrazione RSS/Feedly (post-MVP)
- Collegamento a feed personali.
- Parsing automatico tramite Mercury Parser.

### ⏱️ Tempo di lettura stimato
- Calcolo automatico in minuti per ogni articolo.
- Visualizzato nella lista e nel dettaglio.

### 🎯 Gamification & Obiettivi di Lettura
- Obiettivi settimanali/mensili personalizzabili.
- Badge e progressi giornalieri.
- Notifiche di avanzamento lettura.

### 📊 Statistiche di Lettura
- Articoli letti totali, tempo di lettura stimato.
- Grafici settimanali/mensili.
- Classifica articoli più letti/preferiti.

## ⚙️ Technical Stack
- **Frontend**: React + Ionic 8 (capacitor)
- **Backend**: Supabase (Auth, DB)
- **Parsing**: Mercury Parser self-hosted

## 📂 Supabase Schema

### `users`
- id, email, name, avatar_url, auth_provider

### `articles`
- id, user_id, url, title, content, image_url, tags[], created_at, is_favorite, like_count, comment_count, status, estimated_read_time

### `comments`
- id, article_id, user_id, content, created_at

### `reading_log` (nuova)
- id, user_id, article_id, read_at, duration_seconds

## 📱 Screens
- Login
- Home (articoli salvati)
- Inserisci URL
- Articolo (lettura e interazioni)
- Ricerca
- Tag View
- Discover
- Profilo utente
- Dashboard lettura

## ✅ MVP Scope
- Login (Supabase)
- Inserimento e parsing URL
- Salvataggio con tag
- Like, preferiti
- Ricerca per testo e tag

## 🔄 Stretch Goals
- Modalità offline
- Dark mode
- Esportazione (PDF, Markdown)
- Notifiche push
- Statistiche di lettura
- Text-to-speech
- Feed RSS/Feedly
- Tempo di lettura stimato
- Obiettivi lettura e gamification


DO NOT create a new app, use the existing one.
DO NOT use yarn or pm or pomp just use npm.
USE TypeScript.
DO NOT build the app. Come up with a plan using . taskmaster/templates/example_prd.txt as a template.
Then save the plan to scripts/PRD.txt