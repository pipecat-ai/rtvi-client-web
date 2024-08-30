import React, { useEffect, useRef } from "react";
import { useVoiceClientMediaTrack } from "./useVoiceClientMediaTrack";

type ParticipantType = Parameters<typeof useVoiceClientMediaTrack>[1];

interface Props {
  backgroundColor?: string;
  barColor?: string;
  barGap?: number;
  barWidth?: number;
  barMaxHeight?: number;
  participantType: ParticipantType;
}

export const VoiceVisualizer: React.FC<Props> = React.memo(
  ({
    backgroundColor = "transparent",
    barColor = "black",
    barWidth = 30,
    barGap = 12,
    barMaxHeight = 120,
    participantType,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const track: MediaStreamTrack | null = useVoiceClientMediaTrack(
      "audio",
      participantType
    );

    useEffect(() => {
      if (!track || !canvasRef.current) return;

      const canvasWidth = 5 * barWidth + 4 * barGap;
      const canvasHeight = barMaxHeight;

      const canvas = canvasRef.current;

      const scaleFactor = 2;

      // Make canvas fill the width and height of its container
      const resizeCanvas = () => {
        canvas.width = canvasWidth * scaleFactor;
        canvas.height = canvasHeight * scaleFactor;

        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        canvasCtx.lineCap = "round";
        canvasCtx.scale(scaleFactor, scaleFactor);
      };

      const canvasCtx = canvas.getContext("2d")!;
      resizeCanvas();

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(
        new MediaStream([track])
      );
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 1024;

      source.connect(analyser);

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      canvasCtx.lineCap = "round";

      const bands = [
        { startFreq: 85, endFreq: 255, smoothValue: 0 }, // Covers fundamental frequencies for male and female voices
        { startFreq: 255, endFreq: 500, smoothValue: 0 }, // Lower formants and some harmonics
        { startFreq: 500, endFreq: 2000, smoothValue: 0 }, // Vowel formants and key consonant frequencies
        { startFreq: 2000, endFreq: 4000, smoothValue: 0 }, // Higher formants, "clarity" of speech
        { startFreq: 4000, endFreq: 8000, smoothValue: 0 }, // Sibilance and high-frequency consonants
      ];

      const getFrequencyBinIndex = (frequency: number) => {
        const nyquist = audioContext.sampleRate / 2;
        return Math.round(
          (frequency / nyquist) * (analyser.frequencyBinCount - 1)
        );
      };

      function drawSpectrum() {
        analyser.getByteFrequencyData(frequencyData);
        canvasCtx.clearRect(
          0,
          0,
          canvas.width / scaleFactor,
          canvas.height / scaleFactor
        );
        canvasCtx.fillStyle = backgroundColor;
        canvasCtx.fillRect(
          0,
          0,
          canvas.width / scaleFactor,
          canvas.height / scaleFactor
        );

        let isActive = false;

        const totalBarsWidth =
          bands.length * barWidth + (bands.length - 1) * barGap;
        const startX = (canvas.width / scaleFactor - totalBarsWidth) / 2; // Center bars

        const adjustedCircleRadius = barWidth / 2; // Fixed radius for reset circles

        bands.forEach((band, i) => {
          const startIndex = getFrequencyBinIndex(band.startFreq);
          const endIndex = getFrequencyBinIndex(band.endFreq);
          const bandData = frequencyData.slice(startIndex, endIndex);
          const bandValue =
            bandData.reduce((acc, val) => acc + val, 0) / bandData.length;

          const smoothingFactor = 0.2;

          if (bandValue < 1) {
            band.smoothValue = Math.max(
              band.smoothValue - smoothingFactor * 5,
              0
            );
          } else {
            band.smoothValue =
              band.smoothValue +
              (bandValue - band.smoothValue) * smoothingFactor;
            isActive = true;
          }

          const x = startX + i * (barWidth + barGap);
          // Calculate bar height with a maximum cap
          const barHeight = Math.min(
            (band.smoothValue / 255) * barMaxHeight,
            barMaxHeight
          );

          const yTop = Math.max(
            canvas.height / scaleFactor / 2 - barHeight / 2,
            adjustedCircleRadius
          );
          const yBottom = Math.min(
            canvas.height / scaleFactor / 2 + barHeight / 2,
            canvas.height / scaleFactor - adjustedCircleRadius
          );

          if (band.smoothValue > 0) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x + barWidth / 2, yTop);
            canvasCtx.lineTo(x + barWidth / 2, yBottom);
            canvasCtx.lineWidth = barWidth;
            canvasCtx.strokeStyle = barColor;
            canvasCtx.stroke();
          } else {
            canvasCtx.beginPath();
            canvasCtx.arc(
              x + barWidth / 2,
              canvas.height / scaleFactor / 2,
              adjustedCircleRadius,
              0,
              2 * Math.PI
            );
            canvasCtx.fillStyle = barColor;
            canvasCtx.fill();
            canvasCtx.closePath();
          }
        });

        if (!isActive) {
          drawInactiveCircles(adjustedCircleRadius, barColor);
        }

        requestAnimationFrame(drawSpectrum);
      }

      function drawInactiveCircles(circleRadius: number, color: string) {
        const totalBarsWidth =
          bands.length * barWidth + (bands.length - 1) * barGap;
        const startX = (canvas.width / scaleFactor - totalBarsWidth) / 2;
        const y = canvas.height / scaleFactor / 2;

        bands.forEach((_, i) => {
          const x = startX + i * (barWidth + barGap);

          canvasCtx.beginPath();
          canvasCtx.arc(x + barWidth / 2, y, circleRadius, 0, 2 * Math.PI);
          canvasCtx.fillStyle = color;
          canvasCtx.fill();
          canvasCtx.closePath();
        });
      }

      drawSpectrum();

      // Handle resizing
      window.addEventListener("resize", resizeCanvas);

      return () => {
        audioContext.close();
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [backgroundColor, barColor, barGap, barMaxHeight, barWidth, track]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    );
  }
);

VoiceVisualizer.displayName = "VoiceVisualizer";
