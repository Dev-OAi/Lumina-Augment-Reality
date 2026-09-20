# Lumina - Neural Visual Core

Lumina transforms complex conceptual prompts and descriptions into high-resolution cinematic visualizations with interactive augmented data overlays.

---

## Features

- **Neural Visual Synthesis**: Generates high-detail conceptual imagery from text prompts using Google Gemini.
- **Augmented Data Overlay**: Explores interactive hotspots, telemetry, and detailed conceptual traces across visualizations.
- **Perspective Tuning**: Switch between *Simple*, *Curious*, and *Expert* perspectives.
- **Refinement Engine**: Iteratively adjust or expand upon generated scenes.
- **High-Resolution Export**: Download rendered visuals directly to your machine.

---

## Local Setup & Offline Development

Follow these steps to set up and run the application locally on your machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Clone the Repository

```bash
git clone <your-repository-url>
cd lumina---veo-explorer
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your text editor and add your personal Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

> **Security Note**: Never commit your `.env` file to GitHub or share it publicly. The `.gitignore` file is configured to protect your credentials.

### 5. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to start exploring.

### 6. Build for Production

To create a production-ready build:

```bash
npm run build
```

The compiled static files will be placed in the `dist/` directory, ready to be deployed to any static host or web server.

---

## Offline Architecture & Data Privacy

- **Client-Side Security**: All sensitive API keys are kept in your local `.env` file.
- **Local Persistence**: Visualizations and session states can be saved directly in your local environment.
- **No External Data Tracking**: Your personal account credentials and user data are never uploaded or tracked.
