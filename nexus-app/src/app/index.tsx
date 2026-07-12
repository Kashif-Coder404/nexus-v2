import { use, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  StatusBar,
} from "react-native";
import ChatInput from "../components/ChatInput";
import ChatBox from "@/components/ChatBox";
import BiometricDemo from "@/components/BiometricDemo";

export default function App() {
  const [isTesting, setIsTesting] = useState(true);
  return isTesting ? (
    <BiometricDemo />
  ) : (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <Text style={styles.header}>
        NEXUS <Text style={styles.headerAccent}>CONSOLE</Text>
      </Text>

      <ChatBox />
      <ChatInput />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
