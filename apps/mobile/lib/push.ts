import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { pushApi } from './api-client';

type PermResult = { ios?: { status: number } };

const AUTHORIZED = Notifications.IosAuthorizationStatus?.AUTHORIZED ?? 2;
const PROVISIONAL = Notifications.IosAuthorizationStatus?.PROVISIONAL ?? 3;

const isGranted = (p: PermResult) =>
  Platform.OS === 'android' || p.ios?.status === AUTHORIZED || p.ios?.status === PROVISIONAL;

/**
 * Pide permiso (si hace falta), obtiene el Expo push token y lo registra
 * en el backend. Fire-and-forget: NO bloquea al caller si falla.
 */
export async function registerPushToken(accessToken: string): Promise<void> {
  try {
    let perm = (await Notifications.getPermissionsAsync()) as unknown as PermResult;
    if (!isGranted(perm)) {
      perm = (await Notifications.requestPermissionsAsync()) as unknown as PermResult;
    }
    if (!isGranted(perm)) return;

    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    if (!tokenData?.data) return;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await pushApi.registerToken(tokenData.data, platform, accessToken);
  } catch {
    // silent — no bloquea el login
  }
}
