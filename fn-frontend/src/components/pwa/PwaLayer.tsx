'use client';

import { InstallPrompt } from './InstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { ServiceWorkerManager } from './ServiceWorkerManager';

/**
 * All the app-like behaviour that sits above every page: worker registration
 * and updates, connectivity status, and the install offer. Each renders
 * nothing until it has something to say.
 */
export function PwaLayer() {
  return (
    <>
      <ServiceWorkerManager />
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}
