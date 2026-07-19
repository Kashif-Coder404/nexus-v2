import { use, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatInput from "../components/ChatInput";
import ChatBox from "@/components/ChatBox";
import BiometricDemo from "@/components/BiometricDemo";

export default function App() {
  const [isTesting, setIsTesting] = useState(false);
  const Container = Platform.OS === "ios" ? KeyboardAvoidingView : View;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0F19" }}>
      <Container
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <Text style={styles.header}>
          NEXUS <Text style={styles.headerAccent}>CONSOLE</Text>
        </Text>

        <View style={{ flex: 1 }}>
          <ChatBox />
        </View>
        <ChatInput />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19", // Deep dark space background
  },
  header: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 2,
  },
  headerAccent: {
    color: "#2563EB", // Accent blue matching buttons
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
