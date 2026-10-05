import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// VS Code (and other Electron-based editors) set ELECTRON_RUN_AS_NODE in their
// integrated terminals, which makes the dev Electron start as plain Node and crash.
// electron-vite launches Electron from this process, so clearing it here fixes
// `npm run dev` and `npm start` everywhere. Packaged builds ignore it via fuses.
delete process.env.ELECTRON_RUN_AS_NODE

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': resolve('src/shared') } }
  },
  preload: {
    resolve: { alias: { '@shared': resolve('src/shared') } }
  },
  renderer: {
    resolve: { alias: { '@shared': resolve('src/shared') } },
    plugins: [react()]
  }
})
