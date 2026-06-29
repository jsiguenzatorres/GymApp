import { useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * TTS con fallback: intenta primero ElevenLabs via /ai/tts (voz natural y de
 * marca), y si no hay API key o falla, cae a expo-speech (TTS nativo del SO,
 * gratis pero más robótico). Esto permite que la app FUNCIONE sin contratar
 * ElevenLabs — la calidad mejora si se contrata.
 */
export function useTts(accessToken: string | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const speakWithNative = async (text: string): Promise<void> => {
    setIsPlaying(true);
    try {
      await Speech.speak(text.slice(0, 400), {
        language: 'es-ES',
        rate: 1.0,
        pitch: 1.0,
        onDone: () => setIsPlaying(false),
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch {
      setIsPlaying(false);
    }
  };

  const speak = async (text: string, voiceId?: string): Promise<void> => {
    if (!accessToken || !text.trim()) return;

    // 1) Intentar ElevenLabs (mejor calidad)
    try {
      const res = await fetch(`${API_BASE}/ai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: text.slice(0, 400), voiceId }),
      });

      if (res.ok) {
        const data = (await res.json()) as { audio?: string; error?: string };
        if (data.audio) {
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
          return;
        }
      }
    } catch {
      // continúa al fallback nativo
    }

    // 2) Fallback: TTS nativo del SO (expo-speech)
    await speakWithNative(text);
  };

  const stop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {}
    }
    try {
      await Speech.stop();
    } catch {}
    setIsPlaying(false);
  };

  return { isPlaying, speak, stop };
}
