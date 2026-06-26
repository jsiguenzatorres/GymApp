import { useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export function useTts(accessToken: string | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const speak = async (text: string, voiceId?: string): Promise<void> => {
    if (!accessToken || !text.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/ai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: text.slice(0, 400), voiceId }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as { audio?: string; error?: string };
      if (!data.audio) return;

      // Guardar audio base64 en archivo temporal y reproducir
      const tempUri = (FileSystem.cacheDirectory ?? '') + 'tts_aria.mp3';
      await FileSystem.writeAsStringAsync(tempUri, data.audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: tempUri });
      soundRef.current = sound;

      setIsPlaying(true);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying) {
          setIsPlaying(false);
        }
      });
    } catch {}
  };

  const stop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {}
      setIsPlaying(false);
    }
  };

  return { isPlaying, speak, stop };
}
