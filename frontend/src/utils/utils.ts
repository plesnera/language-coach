/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

export const audioContext: (
  options?: GetAudioContextOptions,
) => Promise<AudioContext> = (() => {
  const didInteract = new Promise((res) => {
    window.addEventListener("pointerdown", res, { once: true });
    window.addEventListener("keydown", res, { once: true });
  });

  return async (options?: GetAudioContextOptions) => {
    try {
      const a = new Audio();
      a.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      await a.play();
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    } catch (e) {
      await didInteract;
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    }
  };
})();

export const blobToJSON = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } else {
        reject("oops");
      }
    };
    reader.readAsText(blob);
  });

function cleanBase64String(base64: string): string {
  // Convert URL-safe base64 to standard base64
  let cleaned = base64
    .replace(/-/g, '+')  // Replace - with +
    .replace(/_/g, '/')  // Replace _ with /
    .replace(/[^A-Za-z0-9+/=]/g, ''); // Remove any other invalid characters
  
  // Ensure proper padding (base64 strings must be multiples of 4)
  return cleaned + '='.repeat((4 - cleaned.length % 4) % 4);
}

export function base64ToArrayBuffer(base64: string) {
  const cleanedBase64 = cleanBase64String(base64);
  
  try {
    var binaryString = atob(cleanedBase64);
    var bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error('Failed to decode base64 audio data:', error);
    console.error('Original base64 length:', base64.length);
    console.error('Cleaned base64 length:', cleanedBase64.length);
    console.error('First 100 chars:', base64.substring(0, 100));
    // Return empty buffer on error
    return new ArrayBuffer(0);
  }
}

/**
 * Creates a WAV file blob from raw PCM audio data.
 * @param pcmData An array of ArrayBuffers containing the 16-bit PCM audio.
 * @param sampleRate The sample rate of the audio (e.g., 16000).
 * @returns A Blob representing the WAV file.
 */
export function createWavFileFromPcm(pcmData: ArrayBuffer[], sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const totalLength = pcmData.reduce((acc, val) => acc + val.byteLength, 0);
  const buffer = new ArrayBuffer(44 + totalLength);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + totalLength, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // Bits per sample

  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, totalLength, true);

  // Write PCM data
  let offset = 44;
  for (const chunk of pcmData) {
    new Uint8Array(buffer, offset).set(new Uint8Array(chunk));
    offset += chunk.byteLength;
  }

  return new Blob([view], { type: 'audio/wav' });
}
