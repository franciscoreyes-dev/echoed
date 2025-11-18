# Echoed

**Spotify Data Visualization SPA**

A modern single-page application for visualizing your Spotify listening data, playlists, and music analytics with beautiful charts and insights.

## Features

- Spotify authentication and API integration
- Interactive data visualizations with Apache ECharts
- User listening history and analytics
- Playlist exploration and insights
- Custom-built UI components

## Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Pinia** - Intuitive state management
- **Vue Router** - Official routing solution
- **Axios** - HTTP client for API requests
- **Apache ECharts** - Powerful charting library

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Spotify Developer Account (for API credentials)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd echoed
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create .env file and add your Spotify API credentials
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
VITE_REDIRECT_URI=http://localhost:5173/callback
```

4. Start the development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Development Commands

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

```
src/
├── api/          # Spotify API client services
├── assets/       # Static assets (images, fonts)
├── components/   # Reusable Vue components
├── composables/  # Composition API composables
├── router/       # Vue Router configuration
├── stores/       # Pinia state stores
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
├── views/        # Page-level components
├── App.vue       # Root component
└── main.ts       # Application entry point
```

## Architecture

This project follows modern Vue 3 best practices:

- **Composition API** with `<script setup>` syntax
- **TypeScript** for type safety
- **Pinia stores** for centralized state management
- **Custom styling** without UI frameworks
- **Modular architecture** with clear separation of concerns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
