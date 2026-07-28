import { Tabs } from "expo-router";
import { View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, FolderKanban, FileText, User } from "lucide-react-native";
import { BlurView } from "expo-blur";
import MatrixRain from "../../components/MatrixRain";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const DARK = "#080f1e";
const GRN = "#22ffb5";
const INACTIVE = "#334155";

const TAB_META: Record<string, { Icon: any; label: string }> = {
    index:          { Icon: Home,        label: "Dashboard" },
    projects_list:  { Icon: FolderKanban, label: "Projetos" },
    documents_list: { Icon: FileText,    label: "Documentos" },
    profile:        { Icon: User,        label: "Perfil" },
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.floatingContainer, { bottom: Math.max(insets.bottom, 12) + 4 }]}>
            <BlurView
                intensity={20}
                tint="dark"
                style={styles.blurWrap}
            >
                {/* Extra dark overlay on top of blur for contrast */}
                <View style={styles.blurOverlay} />

                <View style={styles.tabRow}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const meta = TAB_META[route.name];
                        if (!meta) return null;

                        const { Icon, label } = meta;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                activeOpacity={0.7}
                                style={styles.tabItem}
                            >
                                <View style={[styles.iconWrap, isFocused && styles.iconFocused]}>
                                    <Icon size={20} color={isFocused ? GRN : INACTIVE} />
                                </View>
                                <Text style={[
                                    styles.tabLabel,
                                    { color: isFocused ? GRN : INACTIVE },
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

export default function DashboardLayout() {
    return (
        <View style={styles.root}>
            <View style={StyleSheet.absoluteFillObject} />
            <MatrixRain />
            <View style={styles.overlay} pointerEvents="none" />

            <Tabs
                tabBar={(props) => <FloatingTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tabs.Screen name="index" />
                <Tabs.Screen name="projects_list" />
                <Tabs.Screen name="documents_list" />
                <Tabs.Screen name="profile" />
                <Tabs.Screen name="notifications" options={{ href: null }} />
                <Tabs.Screen name="security" options={{ href: null }} />
                <Tabs.Screen name="support" options={{ href: null }} />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: DARK,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(8,15,30,0.6)",
    },

    /* ── Floating Tab Bar ── */
    floatingContainer: {
        position: "absolute",
        left: 16,
        right: 16,
        borderRadius: 24,
        overflow: "hidden",
        // Shadow
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    blurWrap: {
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(34,255,181,0.12)",
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(8,15,30,0.12)",
    },
    tabRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 4,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    iconFocused: {
        backgroundColor: "rgba(34,255,181,0.10)",
    },
});
