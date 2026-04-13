import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileText, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const B    = "#0a0a0a";
const C1   = "#111111";
const WHT  = "#ffffff";
const MUT  = "rgba(255,255,255,0.40)";
const MUT3 = "rgba(255,255,255,0.06)";

export default function DocumentList() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[s.wrapper, { paddingTop: insets.top }]}>
            <View style={s.navbar}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={18} color={MUT} />
                </TouchableOpacity>
                <Text style={s.navTitle}>Documentos</Text>
            </View>
            <View style={s.center}>
                <View style={s.iconWrap}>
                    <Lock size={32} color={MUT} />
                </View>
                <Text style={s.title}>Acesso Restrito</Text>
                <Text style={s.sub}>Os documentos deste projeto requerem validação local para serem exibidos.</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: B },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    navbar: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: MUT3, gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: MUT3, alignItems: "center", justifyContent: "center",
    },
    navTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: WHT },
    iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C1, borderWidth: 1, borderColor: MUT3, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    title: { fontSize: 18, fontWeight: "800", color: WHT, marginBottom: 8 },
    sub: { fontSize: 13, color: MUT, textAlign: "center", lineHeight: 20 },
});
