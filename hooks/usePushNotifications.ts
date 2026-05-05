import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '../constants/api';

// Affichage des notifications même quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(authToken: string): Promise<'granted' | 'denied' | 'already_granted'> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return 'already_granted';
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return 'denied';
  await registerForPushNotifications(authToken);
  return 'granted';
}

export function usePushNotifications(token: string | null) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!token) return;

    // Ne pas demander la permission automatiquement — l'utilisateur le fait manuellement

    // Notification reçue (app ouverte)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // On peut mettre à jour un badge ici si besoin
    });

    // Tap sur une notification → navigation
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.screen === 'messages' && data?.userId) {
        router.push(`/messages/${data.userId}` as any);
      } else if (data?.screen === 'bookings') {
        router.push('/mes-reservations' as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token]);
}

async function registerForPushNotifications(authToken: string) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'GuiCarLoc',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = pushTokenData.data;

    // Envoyer le token au backend
    await fetch(`${API_URL}/users/me/push-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: expoPushToken }),
    });
  } catch (err) {
    console.error('Push token registration error:', err);
  }
}
