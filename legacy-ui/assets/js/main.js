import { loadManifest } from './core/manifest.js';
import { mountSections } from './core/mount.js';
import { initTopbar } from './modules/topbar.js';
import { initBuildPanel } from './modules/build.js';
import { initLivePanels } from './modules/live.js';

const manifest = await loadManifest();
await mountSections(manifest);
initTopbar(manifest);
initBuildPanel(manifest);
initLivePanels(manifest);
