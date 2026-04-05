/**
 * Push notification registration — stub for driver app.
 * Push notifications for drivers are managed server-side.
 * This module is kept for compatibility but is a no-op.
 */
export async function registerPushToken(_driverId: number): Promise<void> {
  // No-op: driver push tokens are managed server-side
}
