import { useEffect, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Animated, Easing, Dimensions, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ScanFace, Fingerprint, Check } from "lucide-react-native";
import { useAuth } from "../src/contexts/AuthContext";
import * as LocalAuthentication from "expo-local-authentication";
import * as AppleAuthentication from "expo-apple-authentication";
import { getCredentials, getBiometricsEnabled, saveCredentials, setBiometricsEnabled, clearTokens } from "../src/lib/secure-store";
import MatrixRain from "../components/MatrixRain";
import { YStack, XStack, Input, Text, Button, View as TView } from "tamagui";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
    const router = useRouter();
    const { login, appleLogin, isLoading } = useAuth();
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isBioSupported, setIsBioSupported] = useState(false);
    const [bioType, setBioType] = useState<number>(0);
    const [hasBioCreds, setHasBioCreds] = useState(false);

    useEffect(() => {
        const checkBiometrics = async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            const bioEnabled = await getBiometricsEnabled();
            const creds = await getCredentials();
            
            if (compatible && enrolled) {
                setIsBioSupported(true);
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBioType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
                } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                    setBioType(LocalAuthentication.AuthenticationType.FINGERPRINT);
                }
            }
            if (bioEnabled && creds?.email && creds?.pass) {
                setHasBioCreds(true);
                setRememberMe(true);
            }
        };
        checkBiometrics();
    }, []);

    const handleAppleLogin = async () => {
        try {
            setErrorMsg("");
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            if (credential.identityToken) {
                const fullNameStr = credential.fullName 
                    ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim() 
                    : undefined;
                
                const res = await appleLogin(credential.identityToken, fullNameStr);
                if (res.success) {
                    router.replace("/(dashboard)");
                } else {
                    setErrorMsg(res.message || "Erro no login com a Apple");
                }
            }
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                setErrorMsg("Erro na autenticação nativa com Apple");
            }
        }
    };

    const handleBiometricAuth = async () => {
        try {
            setErrorMsg("");
            const creds = await getCredentials();
            if (!creds?.email || !creds?.pass) {
                setErrorMsg("Nenhuma credencial salva encontrada.");
                return;
            }
            const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage: "Autenticação necessária para acessar seus Projetos",
                cancelLabel: "Cancelar",
                fallbackLabel: "Usar Senha",
                disableDeviceFallback: false,
            });

            if (authResult.success) {
                const res = await login(creds.email, creds.pass);
                if (res.success) {
                    router.replace("/(dashboard)");
                } else {
                    setErrorMsg("Suas credenciais salvas estão inválidas.");
                    clearTokens(); 
                    setBiometricsEnabled(false);
                    setHasBioCreds(false);
                }
            }
        } catch (e) {
            setErrorMsg("Ocorreu um erro ao validar biometria.");
        }
    };

    const handleLogin = async () => {
        setErrorMsg("");
        if (!email || !password) {
            setErrorMsg("Preencha e-mail e senha");
            return;
        }
        const res = await login(email, password);
        if (res.success) {
            if (rememberMe && isBioSupported) {
                await saveCredentials(email, password);
                await setBiometricsEnabled(true);
            } else if (!rememberMe) {
                await setBiometricsEnabled(false);
            }
            router.replace("/(dashboard)");
        } else {
            setErrorMsg(res.message || "Erro ao conectar");
        }
    };

    const heroOp = useRef(new Animated.Value(0)).current;
    const heroY = useRef(new Animated.Value(20)).current;
    const cardOp = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.parallel([
                Animated.timing(heroOp, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(heroY, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(cardOp, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(cardY, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const isSmall = height < 700;

    return (
        <TView flex={1} backgroundColor="$background">
            <MatrixRain />
            <TView position="absolute" top={0} bottom={0} left={0} right={0} backgroundColor="rgba(15,23,42,0.72)" pointerEvents="none" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <YStack flex={1} px={24} jc="center" pt={StatusBar.currentHeight ?? 24} pb={24}>

                    {/* Logo */}
                    <Animated.View style={{ opacity: heroOp, transform: [{ translateY: heroY }], alignItems: "center", marginBottom: 20 }}>
                        <Image
                            source={require("../assets/logo-ciano.png")}
                            style={{ width: isSmall ? width * 0.78 : width * 0.85, height: isSmall ? 120 : 160 }}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Hero text */}
                    <Animated.View style={{ opacity: heroOp, transform: [{ translateY: heroY }], marginBottom: 20 }}>
                        <Text fontSize={isSmall ? 18 : 22} fontWeight="500" color="#cbd5e1" mb={6} letterSpacing={-0.8}>
                            Cliente Hub
                        </Text>
                        <Text fontSize={isSmall ? 11 : 13} color="#94a3b8" lineHeight={isSmall ? 16 : 19}>
                            Acompanhe seus projetos, entregas e documentos. Portal exclusivo Mestres da Web.
                        </Text>
                    </Animated.View>

                    {/* Form card */}
                    <Animated.View style={{ opacity: cardOp, transform: [{ translateY: cardY }] }}>
                        <YStack backgroundColor="rgba(15,23,42,0.55)" br={16} px={22} pt={24} pb={20}>

                            {/* Email */}
                            <YStack mb={isSmall ? 10 : 14}>
                                <Text fontSize={9} fontWeight="700" letterSpacing={2} color="#94a3b8" mb={5} ml={2}>E-MAIL CORPORATIVO</Text>
                                <XStack
                                    ai="center"
                                    backgroundColor={focusedField === "email" ? "rgba(15,23,42,0.8)" : "rgba(15,23,42,0.5)"}
                                    bw={1}
                                    borderColor={focusedField === "email" ? "$primary" : "rgba(71,85,105,0.5)"}
                                    br={10}
                                    h={46}
                                >
                                    <Mail size={15} color="#64748b" style={{ marginLeft: 13 }} />
                                    <Input
                                        flex={1}
                                        color="#fff"
                                        fontSize={14}
                                        pl={9} pr={12}
                                        h="100%"
                                        borderWidth={0}
                                        outlineWidth={0}
                                        focusStyle={{ outlineWidth: 0, borderWidth: 0 }}
                                        backgroundColor="transparent"
                                        placeholder="email@empresa.com.br"
                                        placeholderTextColor={"#64748b" as any}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </XStack>
                            </YStack>

                            {/* Password */}
                            <YStack mb={isSmall ? 14 : 20}>
                                <Text fontSize={9} fontWeight="700" letterSpacing={2} color="#94a3b8" mb={5} ml={2}>SENHA</Text>
                                <XStack
                                    ai="center"
                                    backgroundColor={focusedField === "password" ? "rgba(15,23,42,0.8)" : "rgba(15,23,42,0.5)"}
                                    bw={1}
                                    borderColor={focusedField === "password" ? "$primary" : "rgba(71,85,105,0.5)"}
                                    br={10}
                                    h={46}
                                >
                                    <Lock size={15} color="#64748b" style={{ marginLeft: 13 }} />
                                    <Input
                                        flex={1}
                                        color="#fff"
                                        fontSize={14}
                                        pl={9} pr={12}
                                        h="100%"
                                        borderWidth={0}
                                        outlineWidth={0}
                                        focusStyle={{ outlineWidth: 0, borderWidth: 0 }}
                                        backgroundColor="transparent"
                                        placeholder="••••••••"
                                        placeholderTextColor={"#64748b" as any}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <Button
                                        size="$2"
                                        bg="transparent"
                                        chromeless
                                        h="100%"
                                        px={13}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={15} color="#64748b" /> : <Eye size={15} color="#64748b" />}
                                    </Button>
                                </XStack>
                            </YStack>

                            {!!errorMsg && (
                                <Text color="#ef4444" fontSize={12} mb={12} textAlign="center">
                                    {errorMsg}
                                </Text>
                            )}

                            {/* CTA */}
                            <Button
                                bg="$primary"
                                br={10}
                                h={48}
                                disabled={isLoading}
                                opacity={isLoading ? 0.7 : 1}
                                ai="center"
                                jc="center"
                                shadowColor="$primary"
                                shadowOffset={{ width: 0, height: 6 }}
                                shadowOpacity={0.25}
                                shadowRadius={12}
                                hoverStyle={{ bg: "$primaryHover" }}
                                pressStyle={{ bg: "$primaryHover" }}
                                onPress={handleLogin}
                                iconAfter={!isLoading ? <ArrowRight size={15} color="#000" /> : undefined}
                            >
                                <Text color="#000" fontSize={14} fontWeight="700" letterSpacing={0.3}>
                                    {isLoading ? "Carregando..." : "Acessar Portal"}
                                </Text>
                            </Button>

                            {/* Divider */}
                            <XStack ai="center" gap={12} my={isSmall ? 10 : 14}>
                                <TView flex={1} h={1} backgroundColor="rgba(51,65,85,0.5)" />
                                <Text fontSize={9} fontWeight="700" letterSpacing={2} color="#475569">OU</Text>
                                <TView flex={1} h={1} backgroundColor="rgba(51,65,85,0.5)" />
                            </XStack>

                            {/* Alternative Logins Group Row */}
                            <XStack jc="center" ai="center" gap={16}>
                                {/* Apple Sign-In */}
                                {Platform.OS === 'ios' && (
                                    <TView w={50} h={50} br={12} overflow="hidden">
                                        <AppleAuthentication.AppleAuthenticationButton
                                            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                                            cornerRadius={12}
                                            style={{ width: 50, height: 50 }}
                                            onPress={handleAppleLogin}
                                        />
                                    </TView>
                                )}

                                {/* Google */}
                                <Button
                                    w={50} h={50} p={0}
                                    bg="rgba(15,23,42,0.5)"
                                    bw={1} borderColor="rgba(71,85,105,0.5)" br={12}
                                    ai="center" jc="center"
                                >
                                    <Text color="#cbd5e1" fontSize={20} fontWeight="700">G</Text>
                                </Button>

                                {/* Biometrics */}
                                {isBioSupported && hasBioCreds && (
                                    <Button
                                        w={50} h={50} p={0}
                                        bg="rgba(34, 255, 181, 0.1)"
                                        bw={1} borderColor="rgba(34, 255, 181, 0.3)" br={12}
                                        ai="center" jc="center"
                                        onPress={handleBiometricAuth}
                                    >
                                        {bioType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? <ScanFace size={24} color="#22ffb5" /> : <Fingerprint size={24} color="#22ffb5" />}
                                    </Button>
                                )}
                            </XStack>

                            {/* Bottom row */}
                            <XStack jc="space-between" ai="center" mt={isSmall ? 12 : 16}>
                                <Button chromeless p={0} onPress={() => setRememberMe(!rememberMe)} ai="center" jc="center">
                                    <XStack ai="center" gap={8}>
                                        <TView 
                                            w={18} h={18} br={6} bw={1} 
                                            borderColor={rememberMe ? "$primary" : "rgba(148, 163, 184, 0.4)"} 
                                            backgroundColor={rememberMe ? "rgba(34, 255, 181, 0.15)" : "transparent"} 
                                            ai="center" jc="center"
                                        >
                                            {rememberMe && <Check size={12} color="#22ffb5" strokeWidth={3} />}
                                        </TView>
                                        <Text color={rememberMe ? "$primary" : "#94a3b8"} fontSize={13} fontWeight="500">Lembrar (Biometria)</Text>
                                    </XStack>
                                </Button>
                                <Button chromeless p={0}>
                                    <Text color="#94a3b8" fontSize={9} fontWeight="700" letterSpacing={2}>ESQUECI MINHA SENHA</Text>
                                </Button>
                            </XStack>

                        </YStack>
                    </Animated.View>
                </YStack>
            </KeyboardAvoidingView>
        </TView>
    );
}
