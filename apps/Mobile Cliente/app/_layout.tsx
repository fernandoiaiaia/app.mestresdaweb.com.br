import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";

import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent={true} />
        <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#080f1e" },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(dashboard)" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="project/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="project/backlog/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="project/backlog/task/[taskId]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="project/documents/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="proposals/index" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
