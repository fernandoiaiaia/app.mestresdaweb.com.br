/**
 * ═════════════════════════════════════════════════
 * PERFIL — Dados do usuário + logout
 * ═════════════════════════════════════════════════
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../src/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    User, Mail, Building2, Phone, LogOut,
    ChevronRight, Shield, Bell, HelpCircle, FileText,
} from "lucide-react-native";
import { useAuth } from "../../src/contexts/AuthContext";

const { width } = Dimensions.get("window");

const MENU_ITEMS = [
    { icon: FileText,   label: "Minhas Propostas", sub: "Histórico de propostas comerciais", route: "/proposals" },
    { icon: Shield,     label: "Segurança",       sub: "Senha e privacidade", route: "/security" },
    { icon: HelpCircle, label: "Suporte",          sub: "Falar com a equipe", route: "/support" },
];

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, logout, updateSession } = useAuth();
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.0.133:7777";

    async function handleLogout() {
        await logout();
    }

    async function handlePickAvatar() {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permissão necessária", "Precisamos de acesso às fotos para alterar o perfil.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const uri = asset.uri;
                const fileName = uri.split('/').pop() || "avatar.jpg";
                const match = /\.(\w+)$/.exec(fileName);
                const type = match ? `image/${match[1]}` : `image`;

                const formData = new FormData();
                formData.append('avatar', {
                    uri,
                    name: fileName,
                    type,
                } as any);

                const res = await api<any>("/api/users/me/avatar", { 
                    method: "POST", 
                    body: formData,
                });

                if (res.success && res.data?.avatar) {
                    updateSession({ avatar: res.data.avatar });
                    Alert.alert("Sucesso", "Foto de perfil atualizada!");
                } else {
                    Alert.alert("Erro", "Não foi possível enviar a foto.");
                }
            }
        } catch (error) {
            Alert.alert("Erro", "Ocorreu um erro ao processar a foto.");
        }
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

            {/* ── Avatar + Info ── */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarRing}>
                    <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={handlePickAvatar}>
                        {user?.avatar ? (
                            <Image source={{ uri: `${API_BASE_URL}${user.avatar}` }} style={{ width: "100%", height: "100%", borderRadius: 40 }} />
                        ) : (
                            <User size={36} color="#22ffb5" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.userName}>{user?.name || "Cliente"}</Text>
                <Text style={styles.userEmail}>{user?.email || "..."}</Text>
                <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>CLIENTE MESTRES DA WEB</Text>
                </View>
            </View>

            {/* ── Info Cards ── */}
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Mail size={15} color="#64748b" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>E-mail</Text>
                        <Text style={styles.infoValue}>{user?.email || "..."}</Text>
                    </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                    <Building2 size={15} color="#64748b" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Empresa</Text>
                        <Text style={styles.infoValue}>{(user as any)?.company || "Empresa Não Informada"}</Text>
                    </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                    <Phone size={15} color="#64748b" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Telefone</Text>
                        <Text style={styles.infoValue}>{(user as any)?.phone || "(00) 00000-0000"}</Text>
                    </View>
                </View>
            </View>

            {/* ── Menu ── */}
            <View style={styles.menuCard}>
                {MENU_ITEMS.map((item, i) => (
                    <View key={item.label}>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { if (item.route) router.push(item.route as any); }}>
                            <View style={styles.menuIconWrap}>
                                <item.icon size={16} color="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuSub}>{item.sub}</Text>
                            </View>
                            <ChevronRight size={16} color="#334155" />
                        </TouchableOpacity>
                        {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
                    </View>
                ))}
            </View>

            {/* ── Logout ── */}
            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>

            {/* Branding */}
            <Text style={styles.branding}>Mestres da Web © 2025</Text>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: "#080f1e" },
    content: { padding: 20 },

    avatarSection: {
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 28,
    },
    avatarRing: {
        width: 88, height: 88, borderRadius: 44,
        borderWidth: 2, borderColor: "rgba(34,255,181,0.3)",
        padding: 3, marginBottom: 14,
        alignItems: "center", justifyContent: "center",
    },
    avatar: {
        width: "100%", height: "100%", borderRadius: 40,
        backgroundColor: "rgba(34,255,181,0.12)",
        alignItems: "center", justifyContent: "center",
    },
    userName: { fontSize: 22, fontWeight: "700", color: "#f1f5f9", letterSpacing: -0.5 },
    userEmail: { fontSize: 13, color: "#64748b", marginTop: 4 },
    planBadge: {
        marginTop: 10,
        backgroundColor: "rgba(34,255,181,0.08)",
        borderWidth: 1, borderColor: "rgba(34,255,181,0.2)",
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    },
    planBadgeText: { fontSize: 9, fontWeight: "700", color: "#22ffb5", letterSpacing: 2 },

    infoCard: {
        backgroundColor: "rgba(15,23,42,0.7)",
        borderWidth: 1, borderColor: "rgba(71,85,105,0.25)",
        borderRadius: 16, padding: 4, marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row", alignItems: "center",
        gap: 12, paddingHorizontal: 16, paddingVertical: 14,
    },
    infoLabel: { fontSize: 10, color: "#64748b", fontWeight: "600", letterSpacing: 0.5 },
    infoValue: { fontSize: 14, color: "#f1f5f9", fontWeight: "500", marginTop: 1 },
    infoDivider: { height: 1, backgroundColor: "rgba(71,85,105,0.15)", marginHorizontal: 16 },

    menuCard: {
        backgroundColor: "rgba(15,23,42,0.7)",
        borderWidth: 1, borderColor: "rgba(71,85,105,0.25)",
        borderRadius: 16, padding: 4, marginBottom: 16,
    },
    menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    menuIconWrap: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: "rgba(71,85,105,0.15)",
        alignItems: "center", justifyContent: "center",
    },
    menuLabel: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
    menuSub: { fontSize: 11, color: "#64748b", marginTop: 1 },
    menuDivider: { height: 1, backgroundColor: "rgba(71,85,105,0.15)", marginHorizontal: 16 },

    logoutBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 14,
        backgroundColor: "rgba(239,68,68,0.08)",
        borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
        borderRadius: 14, marginBottom: 16,
    },
    logoutText: { fontSize: 14, fontWeight: "700", color: "#ef4444" },

    branding: { textAlign: "center", fontSize: 11, color: "#1e293b", letterSpacing: 1 },
});
