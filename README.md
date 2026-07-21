# Finexy

A modern, mobile-first financial and business operations dashboard.

## Deployment to Vercel

This app is configured to be deployed easily to Vercel.

1. Commit and push your code to a GitHub repository.
2. In your Vercel Dashboard, select **Add New Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect that this is a Vite project. It will pre-fill:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **Deploy**.

The repository includes a `vercel.json` file which configures URL rewrites so that React Router works correctly on page reloads.

## Installing as a Mobile App (PWA)

This application is configured as a Progressive Web App (PWA).

1. Open your deployed Vercel URL in **Safari (iOS)** or **Chrome (Android)**.
2. Tap the browser's Share button (iOS) or Menu button (Android).
3. Select **Add to Home Screen**.
4. The app will be installed on your device with the custom Infinity Logo and will run in a standalone, full-screen mode without browser UI.
