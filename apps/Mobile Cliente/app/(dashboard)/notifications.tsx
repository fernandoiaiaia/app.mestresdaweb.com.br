import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Bell, CheckCircle2, MessageCircle } from "lucide-react-native";

const B = "#0a0a0a";
const C1 = "#111111";
const WHT = "#ffffff";
const MUT2 = "#86868b";
const MUT3 = "rgba(255,255,255,0.06)";
const GRN = "#22ffb5";

import { useEffect, useState } from "react";
import { api } from "../../src/lib/api";

type Notification = {
    id: string; title: string; content?: string;
    createdAt: string; read: boolean; type?: string;
};

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        api<any>("/api/notifications/feed")
            .then(res => {
                if (res?.success && res.data?.items) {
                    setNotifications(res.data.items);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: B }}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#f1f5f9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificações</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                {notifications.length === 0 ? (
                    <Text style={{textAlign: "center", color: MUT2, marginTop: 40}}>Nenhuma notificação recente.</Text>
                ) : notifications.map((notif) => {
                    const unread = !notif.read;
                    const Icon = notif.type === "proposal" ? CheckCircle2 : Bell;
                    return (
                        <View key={notif.id} style={[styles.notifCard, unread && styles.notifUnread]}>
                            <View style={[styles.iconWrap, unread ? { backgroundColor: "rgba(34,255,181,0.15)" } : { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                                <Icon size={18} color={unread ? GRN : MUT2} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.notifTitle, unread && { color: WHT }]}>{notif.title}</Text>
                                <Text style={styles.notifDesc}>{notif.content || "Sem descrição"}</Text>
                                <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString("pt-BR")}</Text>
                            </View>
                            {unread && <View style={styles.unreadDot} />}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: MUT3 },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: WHT },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 12 },

    notifCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: C1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: MUT3 },
    notifUnread: { borderColor: "rgba(34,255,181,0.3)", backgroundColor: "rgba(34,255,181,0.03)" },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    notifTitle: { fontSize: 15, fontWeight: "700", color: "#e2e8f0", marginBottom: 4 },
    notifDesc: { fontSize: 13, color: MUT2, lineHeight: 18, marginBottom: 8 },
    notifTime: { fontSize: 11, color: "#64748b", fontWeight: "600" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GRN, marginTop: 6 },
});
