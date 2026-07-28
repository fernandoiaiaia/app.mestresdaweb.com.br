/**
 * ═══════════════════════════════════════════════════════════════
 * SPLASH SCREEN — Premium animated entry
 * Logo mesmo tamanho do login (width * 0.85 / 160px)
 * ═══════════════════════════════════════════════════════════════
 */
import { useEffect, useRef } from "react";
import {
    View, Image, Text, Animated, StyleSheet,
    Dimensions, Easing
} from "react-native";
import { useRouter } from "expo-router";
import MatrixRain from "../components/MatrixRain";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
    const router = useRouter();

    // Animations
    const bgOp      = useRef(new Animated.Value(0)).current;
    const logoOp    = useRef(new Animated.Value(0)).current;
    const logoY     = useRef(new Animated.Value(24)).current;
    const logoScale = useRef(new Animated.Value(0.92)).current;
    const tagOp     = useRef(new Animated.Value(0)).current;
    const lineW     = useRef(new Animated.Value(0)).current;
    const exitOp    = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // 1) Fundo
        Animated.timing(bgOp, {
            toValue: 1, duration: 600, useNativeDriver: true,
        }).start();

        // 2) Logo entra com spring
        Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
                Animated.timing(logoOp,    { toValue: 1,    duration: 900, easing: Easing.out(Easing.cubic),       useNativeDriver: true }),
                Animated.timing(logoY,     { toValue: 0,    duration: 900, easing: Easing.out(Easing.cubic),       useNativeDriver: true }),
                Animated.spring(logoScale, { toValue: 1,    friction: 5, tension: 80,                              useNativeDriver: true }),
            ]),
        ]).start();

        // 3) Linha decorativa cresce
        Animated.sequence([
            Animated.delay(900),
            Animated.timing(lineW, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]).start();

        // 4) Tag line aparece
        Animated.sequence([
            Animated.delay(1100),
            Animated.timing(tagOp, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]).start();

        // 5) Fade out e navega
        const exit = setTimeout(() => {
            Animated.timing(exitOp, {
                toValue: 0, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true,
            }).start(() => router.replace("/login"));
        }, 3000);

        return () => clearTimeout(exit);
    }, []);


    const lineWidthInterp = lineW.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.28] });

    return (
        <Animated.View style={[styles.container, { opacity: exitOp }]}>
            {/* Background + MatrixRain */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgOp }]}>
                <MatrixRain />
            </Animated.View>

            {/* Overlay escuro */}
            <View style={styles.overlay} pointerEvents="none" />

            {/* Conteúdo central */}
            <View style={styles.center}>

                {/* Logo */}
                <Animated.View style={[
                    styles.logoWrap,
                    { opacity: logoOp, transform: [{ translateY: logoY }, { scale: logoScale }] }
                ]}>
                    <Image
                        source={require("../assets/logo-ciano.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Linha decorativa ciano */}
                <Animated.View style={[styles.accentLine, { width: lineWidthInterp }]} />

                {/* Tag */}
                <Animated.Text style={[styles.tag, { opacity: tagOp }]}>
                    PORTAL DO CLIENTE
                </Animated.Text>

            </View>


        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
        alignItems: "center",
        justifyContent: "center",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15,23,42,0.68)",
    },
    center: {
        alignItems: "center",
        zIndex: 10,
    },

    // Logo — mesmo tamanho do login
    logoWrap: {
        alignItems: "center",
        marginBottom: 20,
    },
    logo: {
        width: width * 0.85,
        height: 160,
    },

    // Linha decorativa ciano
    accentLine: {
        height: 2,
        backgroundColor: "#22ffb5",
        borderRadius: 2,
        marginBottom: 14,
        shadowColor: "#22ffb5",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },

    // Tag
    tag: {
        color: "#64748b",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 5,
    },


});
