import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, KeySquare, ShieldCheck, Smartphone, Monitor } from "lucide-react-native";
import { useState } from "react";

const B = "#0a0a0a";
const C1 = "#111111";
const WHT = "#ffffff";
const MUT2 = "#86868b";
const MUT3 = "rgba(255,255,255,0.06)";
const GRN = "#22ffb5";
const RED = "#ef4444";

export default function SecurityScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [twoFactor, setTwoFactor] = useState(true);
    const [biometrics, setBiometrics] = useState(true);

    return (
        <View style={{ flex: 1, backgroundColor: B }}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#f1f5f9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Segurança</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                
                {/* ── Settings Controls ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Opções de Entrada</Text>
                    
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.iconWrap}><KeySquare size={16} color={WHT} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>Alterar Senha</Text>
                                <Text style={styles.rowDesc}>Última alteração: há 3 meses</Text>
                            </View>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Text style={styles.actionBtnText}>Alterar</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <View style={styles.iconWrap}><ShieldCheck size={16} color={WHT} /></View>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.rowTitle}>Autenticação em 2 Fatores</Text>
                                <Text style={styles.rowDesc}>Requer código via SMS ao entrar em novos dispositivos.</Text>
                            </View>
                            <Switch value={twoFactor} onValueChange={setTwoFactor} trackColor={{ true: GRN, false: MUT3 }} />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <View style={styles.iconWrap}><Smartphone size={16} color={WHT} /></View>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.rowTitle}>Acesso Biométrico</Text>
                                <Text style={styles.rowDesc}>Usar FaceID/TouchID para abrir o app.</Text>
                            </View>
                            <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ true: GRN, false: MUT3 }} />
                        </View>
                    </View>
                </View>

                {/* ── Active Sessions ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sessões Ativas</Text>
                    
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.iconWrap, { backgroundColor: "rgba(34,255,181,0.15)" }]}><Smartphone size={16} color={GRN} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>iPhone 14 Pro</Text>
                                <Text style={[styles.rowDesc, { color: GRN }]}>Sessão atual · São Paulo, SP</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <View style={styles.iconWrap}><Monitor size={16} color={WHT} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>MacBook Pro (Chrome)</Text>
                                <Text style={styles.rowDesc}>Último acesso: 10/04/2026 às 14:32</Text>
                            </View>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Text style={[styles.actionBtnText, { color: RED }]}>Desconectar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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

    section: { gap: 12 },
    sectionTitle: { fontSize: 13, fontWeight: "800", color: MUT2, letterSpacing: 1, textTransform: "uppercase", marginLeft: 4 },
    
    card: { backgroundColor: C1, borderRadius: 24, borderWidth: 1, borderColor: MUT3, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
    iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
    rowTitle: { fontSize: 15, fontWeight: "700", color: WHT, marginBottom: 2 },
    rowDesc: { fontSize: 12, color: MUT2, lineHeight: 18 },
    divider: { height: 1, backgroundColor: MUT3, marginLeft: 64 },

    actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" },
    actionBtnText: { fontSize: 13, fontWeight: "800", color: WHT },
});
