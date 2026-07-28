import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MessageSquare, Phone, Mail } from "lucide-react-native";
const B = "#0a0a0a";
const C1 = "#111111";
const WHT = "#ffffff";
const MUT2 = "#86868b";
const MUT3 = "rgba(255,255,255,0.06)";
const GRN = "#22ffb5";



export default function SupportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, backgroundColor: B }}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#f1f5f9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Suporte</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                
                {/* ── Contact Options ── */}
                <View style={styles.cardsRow}>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Alert.alert("WhatsApp", "Redirecionando para o aplicativo do WhatsApp...")}>
                        <View style={[styles.iconWrap, { backgroundColor: "rgba(34,255,181,0.15)" }]}><MessageSquare size={24} color="#22ffb5" /></View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.contactTitle}>WhatsApp</Text>
                            <Text style={styles.contactDesc}>Resposta rápida e direta pelo chat</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Alert.alert("E-mail", "Abrindo o cliente de e-mail do dispositivo...")}>
                        <View style={[styles.iconWrap, { backgroundColor: "rgba(34,255,181,0.15)" }]}><Mail size={24} color={GRN} /></View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.contactTitle}>E-mail</Text>
                            <Text style={styles.contactDesc}>suporte@mestresdaweb.com.br</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Alert.alert("Telefone", "Iniciando ligação para a central...")}>
                        <View style={[styles.iconWrap, { backgroundColor: "rgba(160,32,240,0.15)" }]}><Phone size={24} color="#a020f0" /></View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.contactTitle}>Telefone</Text>
                            <Text style={styles.contactDesc}>Ligar para (11) 99999-9999</Text>
                        </View>
                    </TouchableOpacity>
                </View>


            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: MUT3 },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: WHT },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 24, paddingBottom: 40 },

    cardsRow: { flexDirection: "column", gap: 12 },
    contactCard: { flexDirection: "row", backgroundColor: C1, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: MUT3, alignItems: "center", gap: 16 },
    iconWrap: { width: 56, height: 56, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    cardTextContainer: { flex: 1 },
    contactTitle: { fontSize: 18, fontWeight: "800", color: WHT, marginBottom: 4 },
    contactDesc: { fontSize: 13, color: MUT2 },
});
