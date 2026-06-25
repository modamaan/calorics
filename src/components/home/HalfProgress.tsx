import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  progress: number; // 0 -> 1
  size?: number;
  strokeWidth?: number;
  segments?: number;
  gapAngle?: number;
  value?: number;
  label?: string;
};

export function SegmentedHalfCircleProgress30({
  progress,
  size = 60,
  strokeWidth = 28,
  segments = 15,
  gapAngle = 25,
  value,
  label,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const totalAngle = 180;
  const totalGap = gapAngle * (segments - 1);

  // slightly reduce angle to avoid edge overlap
  const segmentAngle = (totalAngle - totalGap) / segments - 0.5;

  const activeSegments = Math.round(clamped * segments);

  const polarToCartesian = (angle: number) => {
    const rad = (Math.PI / 180) * angle;

    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);

    return `
      M ${start.x} ${start.y}
      A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}
    `;
  };

  let currentAngle = 180;

  const height = (size + strokeWidth) / 2;

  return (
    <View
      style={{
        width: size,
        height: height,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Svg width={size} height={height}>
        {Array.from({ length: segments }).map((_, i) => {
          const start = currentAngle;
          const end = currentAngle - segmentAngle;

          currentAngle = end - gapAngle;

          const isActive = i < activeSegments;

          return (
            <Path
              key={i}
              d={createArc(start, end)}
              stroke={isActive ? Colors.accent : "rgba(255,255,255,0.05)"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>

      <View style={styles.textOverlay}>
        <Text style={styles.iconText}>🔥</Text>
        <Text style={styles.mainText}>{value}</Text>
        <Text style={styles.subText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textOverlay: {
    position: "absolute",
    bottom: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 26,
    marginBottom: 2,
  },
  mainText: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  subText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});