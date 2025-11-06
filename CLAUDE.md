# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AZReader is a cross-platform article reader and sharing application built with React, Ionic, and Capacitor. It allows users to parse, save, and read articles from various sources with features like authentication, tagging, commenting, and customizable reading themes.

## Development Commands

### Setup & Configuration
- `npm run config` - Generate environment configuration file from environment variables
- `npm i` - Install dependencies

### Development
- `npm run start` - Start development server on port 3001
- `npm run build` - Build the application for production
- `npm run test` - Run tests with Craco
- `npm run deploy:version` - Create semantic release

### Mobile Development
- `npx cap sync` - Sync web assets with native projects
- `npx cap run android` - Run on Android device/emulator
- `npx cap run ios` - Run on iOS device/simulator
- `npx cap build android` - Build Android APK
- `npx cap build ios` - Build iOS app

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Ionic 8 + Tailwind CSS
- **State Management**: Redux with Redux Persist and Redux First History
- **Backend**: Supabase (authentication, database) + Firebase (legacy support)
- **Mobile**: Capacitor 7 for cross-platform deployment
- **Build Tools**: Craco (Create React App Configuration Override)

### Key Directory Structure
```
src/
├── common/          # Shared interfaces, API client, scraper logic
├── components/      # Reusable UI components
│   ├── ui/         # Generic UI components (themes, settings, controls)  
│   └── form/       # Authentication forms
├── config/         # Environment and scraper configuration
├── context/        # React contexts (auth context)
├── hooks/          # Custom React hooks (useAuth, useArticles, etc.)
├── pages/          # Page components (routing)
├── store/          # Redux store, actions, reducers
├── theme/          # CSS theme files and reading themes
└── utility/        # Helper functions and services
```

### State Management
- Redux store with persistence handles posts, authentication, reading settings
- Router state managed via redux-first-history
- Supabase session management integrated with Redux actions

### Authentication Flow
- Supabase authentication with email/password
- Deep link support for auth confirmation (`azreader://auth/confirm`)
- Session persistence and automatic refresh
- Auth state synchronized with Redux store

### Article Processing
- URL-based article parsing using custom scrapers and RapidAPI
- Content extraction with Cheerio for specific domains
- Support for HTML and text content processing
- Image processing and data-src attribute handling

### Mobile Integration
- Custom URL schemes: `azreader://auth/*` and `azreader://article/*`
- Deep linking for article sharing
- Capacitor plugins: App, Clipboard, Haptics, Keyboard, Share, Status Bar, Screen Brightness
- Platform-specific configurations for Android and iOS

## Environment Configuration

Create environment variables and run `npm run config` to generate `src/config/environment.ts`:

Required variables:
- `SUPABASE_URL`, `SUPABASE_KEY` - Supabase database connection
- `FIREBASE_*` - Firebase configuration (legacy)
- `PARSER_ENDPOINT`, `CORS_PROXY` - Article parsing services
- `RAPID_API_KEY` - RapidAPI for article extraction
- `DEBUG` - Development mode flag

## Key Features

### Reading Experience
- Customizable themes (dark/light) with reading-specific settings
- Font size controls and typography options
- Distraction-free reading mode
- Article content sanitization and image optimization

### Article Management
- URL parsing and content extraction
- Tagging system for article organization
- Article sharing via deep links
- Like and comment system

### Cross-Platform
- Responsive design for web and mobile
- Native mobile app capabilities via Capacitor
- Platform-specific UI adaptations (iOS-style interface)

## Import Aliases

The project uses path aliases configured in both `tsconfig.json` and `craco.config.js`:
- `@common/*` → `src/common/*`
- `@components/*` → `src/components/*`
- `@config/*` → `src/config/*`
- `@context/*` → `src/context/*`
- `@hooks/*` → `src/hooks/*`
- `@pages/*` → `src/pages/*`
- `@store/*` → `src/store/*`
- `@theme/*` → `src/theme/*`
- `@utility/*` → `src/utility/*`
- `@ui/*` → `src/ui/*`

## Development Notes

- Uses strict TypeScript configuration with additional safety checks
- Tailwind CSS with custom theme extensions for branding
- Ionic React components for mobile-first UI
- Redux DevTools enabled in development with logger middleware
- Service worker support for offline capabilities

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
