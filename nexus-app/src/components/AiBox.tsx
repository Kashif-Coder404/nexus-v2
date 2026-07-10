import React from "react";
import { Text, View, StyleSheet, Platform } from "react-native";

export interface AIBoxProps {
  id: string;
  role: "nexus";
  content: {
    AiMsg: string;
    terminal: string;
    terminalOutput: string;
    cmd: string;
  };
}

const AiBox = ({ role, content }: AIBoxProps) => {
  const { AiMsg, terminal, terminalOutput, cmd } = content;
  return (
    <View style={styles.mainBox}>
      <View style={styles.box}>
        <Text style={styles.roleText}>{role}</Text>
        <View style={styles.terminalCont}>
          <Text style={styles.aiMsg}>{AiMsg}</Text>
          <>
            {cmd && (
              <View style={styles.cmdCont}>
                <Text style={styles.prompt}>{"$>"}</Text>
                <Text style={styles.cmd}>{cmd}</Text>
              </View>
            )}
            {terminalOutput && (
              <Text style={styles.terminalOutput}>{terminalOutput}</Text>
            )}
          </>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainBox: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  box: {
    backgroundColor: "#1E293B", // Dark slate background
    borderTopLeftRadius: 4, // Chat bubble tail
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#94A3B8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  terminalCont: {
    marginTop: 2,
  },
  aiMsg: {
    fontSize: 15,
    color: "#F1F5F9",
    lineHeight: 22,
    marginBottom: 6,
  },
  cmdCont: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    marginVertical: 4,
  },
  prompt: {
    color: "#F2F2F2",
    fontWeight: "bold",
    marginRight: 6,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  cmd: {
    color: "#38BDF8", // Cyan cmd color
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    flex: 1,
  },
  terminalOutput: {
    color: "#34D399", // Neon emerald terminal output
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    backgroundColor: "#080C14",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    lineHeight: 16,
  },
});

export default AiBox;
