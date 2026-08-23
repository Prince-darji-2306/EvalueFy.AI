import { useState, useEffect, useRef, useCallback } from 'react';

const BAR_COUNT = 64;

/**
 * Hook to capture microphone audio stream and analyze live 64-bin frequency spectrum & amplitude data
 * using Web Audio API's AnalyserNode, mapped symmetrically around the entire 360° radial circle.
 */
export function useAudioAnalyser(isActive = false) {
  const [amplitude, setAmplitude] = useState(0);
  const [spectrum, setSpectrum] = useState(() => new Float32Array(BAR_COUNT));
  const [audioError, setAudioError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const smoothedAmpRef = useRef(0);
  const smoothedSpecRef = useRef(new Float32Array(BAR_COUNT));

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAmplitude(0);
    smoothedAmpRef.current = 0;
    const zeroSpec = new Float32Array(BAR_COUNT);
    smoothedSpecRef.current = zeroSpec;
    setSpectrum(zeroSpec);
  }, []);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }

    let isMounted = true;

    async function initAudio() {
      try {
        setAudioError(null);
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API is not supported in this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256; // 128 frequency bins for rich vocal spectrum
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount; // 128
        const freqData = new Uint8Array(bufferLength);
        const timeData = new Uint8Array(analyser.fftSize);

        const updateData = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(freqData);
          analyserRef.current.getByteTimeDomainData(timeData);

          // Root Mean Square amplitude calculation
          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128;
            sum += v * v;
          }
          const rawAmp = Math.min(1, Math.sqrt(sum / timeData.length) * 3.4);

          // Exponential smoothing on amplitude
          smoothedAmpRef.current += (rawAmp - smoothedAmpRef.current) * 0.3;
          const currentAmp = smoothedAmpRef.current;
          setAmplitude(currentAmp);

          // Map human vocal frequency range (bins 1 to ~36, representing 80Hz - 4500Hz)
          // symmetrically across both halves of the 64-bar circle so ALL sides react evenly.
          const halfCount = BAR_COUNT / 2; // 32
          const currentSpec = new Float32Array(BAR_COUNT);
          const vocalRangeBins = 32;

          for (let i = 0; i < halfCount; i++) {
            // Smoothly interpolate across vocal range
            const binIndex = Math.min(bufferLength - 1, Math.floor((i / halfCount) * vocalRangeBins) + 1);
            const rawFreqVal = freqData[binIndex] / 255;

            // Combine localized frequency with overall vocal amplitude for full-circle fullness
            const barVal = Math.min(1, rawFreqVal * 0.75 + currentAmp * 0.45);

            // Smooth each bar
            smoothedSpecRef.current[i] += (barVal - smoothedSpecRef.current[i]) * 0.38;

            // Symmetrical bilateral reflection (0..31 and 63..32)
            const mirroredIndex = BAR_COUNT - 1 - i;
            smoothedSpecRef.current[mirroredIndex] = smoothedSpecRef.current[i];

            currentSpec[i] = smoothedSpecRef.current[i];
            currentSpec[mirroredIndex] = smoothedSpecRef.current[i];
          }

          setSpectrum(currentSpec);

          animationFrameRef.current = requestAnimationFrame(updateData);
        };

        updateData();
      } catch (err) {
        console.error('Microphone audio analyser error:', err);
        if (isMounted) {
          setAudioError(err.message || 'Microphone access denied or unavailable');
        }
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isActive, cleanup]);

  return { amplitude, spectrum, audioError };
}
