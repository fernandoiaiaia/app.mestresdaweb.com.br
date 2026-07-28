/**
 * ═══════════════════════════════════════════════════════════════
 * MatrixRain — Lightweight version for mobile performance
 * Static grid lines + few animated beams (max 5)
 * ═══════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useMemo } from "react";
import { View, Animated, Dimensions, StyleSheet, Easing } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const COL_W = 60;
const NUM_COLS = Math.floor(SW / COL_W);
const MAX_BEAMS = 4; // Keep it lightweight

function Beam({ delay, duration, height, opacity, left }: { delay: number; duration: number; height: number; opacity: number; left: number }) {
    const y = useRef(new Animated.Value(-height)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(y, { toValue: SH + height, duration, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(y, { toValue: -height, duration: 0, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: 0,
                left,
                width: 1.5,
                height,
                borderRadius: 1,
                backgroundColor: "#22ffb5",
                opacity,
                transform: [{ translateY: y }],
            }}
        />
    );
}

export default function MatrixRain() {
    const beams = useMemo(() => {
        const picks: number[] = [];
        while (picks.length < MAX_BEAMS) {
            const col = Math.floor(Math.random() * NUM_COLS);
            if (!picks.includes(col)) picks.push(col);
        }
        return picks.map((col) => ({
            left: col * COL_W + COL_W / 2,
            delay: Math.random() * 4000,
            duration: Math.random() * 3000 + 5000,
            height: Math.random() * 120 + 180,
            opacity: Math.random() * 0.25 + 0.15,
        }));
    }, []);

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Static vertical grid lines */}
            {Array.from({ length: NUM_COLS }).map((_, i) => (
                <View key={i} style={[styles.line, { left: i * COL_W }]} />
            ))}
            {/* A few animated beams */}
            {beams.map((b, i) => (
                <Beam key={i} {...b} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#080f1e",
        overflow: "hidden",
        opacity: 0.6,
    },
    line: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: "rgba(51,65,85,0.12)",
    },
});
