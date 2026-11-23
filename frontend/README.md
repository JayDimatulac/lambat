# LAMBAT Frontend

React + TypeScript + Vite + Tailwind CSS.

## Run locally

    npm install
    npm run dev

## Build

    npm run build

## Environment

Create `frontend/.env` with the address of the backend API:

    VITE_API_URL=http://localhost:4000/api

On Render, set `VITE_API_URL` on the `lambat-app` static site to the URL of `lambat-api`, ending in `/api`.