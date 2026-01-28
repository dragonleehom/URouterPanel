import { syncAllApps } from './server/appStoreSyncService.ts';

console.log('Starting sync test...');
try {
  const result = await syncAllApps();
  console.log('Sync completed:', result);
} catch (error) {
  console.error('Sync failed:', error);
}
