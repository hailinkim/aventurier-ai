# Aventeurier AI

## Overview

This project is a travel assistant that leverages user's saved Instagram post data to automate market research and generate on-trend travel itineraries.

## Features

- **Semantic Search**: Efficiently retrieves relevant Instagram posts by understanding the context behind user queries and social media content, overcoming Instagram’s lack of a built-in search function.
- **AI-Powered Chatbot**: Generates personalized travel itineraries and recommends on-trend places based on saved Instagram posts using Retrieval Augmented Generation (RAG).

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Next.js, Flask API
- Deployment: Vercel

The Flask server is mapped into to Next.js app under `/api/`.
This is implemented using `next.config.js` rewrites to map any request to `/api/:path\*` to the Flask API, which is hosted in the /api folder.
On localhost, the rewrite will be made to the 127.0.0.1:5328 port, which is where the Flask server is running.
In production, the Flask server is hosted as Python serverless functions on Vercel.

### Key Technologies

- Langchain - Used to implement LLM features, enabling advanced language processing and retrieval-augmented generation (RAG) within the chatbot.
- [instagram-private-api](<(https://github.com/dilame/instagram-private-api)>): - A Node JS library that allows for the retrieval of Instagram posts and user data.
- Upstage Document OCR API - Extract travel information embedded in images.
- Solar Embeddings API - Embeds Instagram posts into a high-dimensional vector space for efficient retrieval.
- MongoDB - Stores Instagram posts and their embeddings for semantic search and chatbot features.
- Solar Chat API - Powers the AI chatbot with RAG
- Upstage Groundedness Check API - Validates the alignment between AI's response and retrieved Instagram posts to cope with hallucination.
- Google Maps API - Displays curated on-trend places on a map with detailed information such as address, rating, and photos.

### Dependencies

- Dependencies for Next.js and Node.js are managed via `package.json`.
- Dependencies for Flask and related Python packages are managed via `Pipfile`.

## Project Structure

```bash
.
├── app/ (Next.js app)
│   ├── [username]/
│   │   ├── chat/ (API route for the chatbot feature)
│   │   └── search/ (API route for the semantic search feature)
│   ├── components/
│   │   └── ... (UI components)
│   ├── lib/
│   │   └── ocr.js (Utility functions for OCR)
|   |   └── ... (Other utility functions)
│   └── ... (Next.js app files)
│
├── api/ (Flask API)
│   ├── index.py (Entry point for the Flask app, initializes routes)
│   ├── TravelAgent.py (Defines the TravelAgent class, encapsulating chatbot logic)
│   └── Search.py (Performs semantic search using Upstage embeddings and MongoDB)
│   └── lib/
│      └── template.py (Defines the prompt template for the chatbot)
│
├── package.json (Dependencies for Next.js)
├── Pipfile (Dependencies for Flask)
└── ... (Other configuration files)
```

## How to run the project

This is a Next.js project that uses Flask as an API backend, so you need to have Node.js installed on your machine to run it. You can download Node.js from [here](https://nodejs.org/en/download/).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The app is also deployed on Vercel for production, and you can access it [here](https://aventurier2.vercel.app/).

**Note:** The app may initially show an error as it takes some time to connect to the MongoDB server. Please refresh the page if this occurs.

To demonstrate the app, you can use the sample Instagram account:

- **Username:** `heylinkim`
- **Password:** `Upstage1234`
