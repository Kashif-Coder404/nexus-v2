import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

type ChatInputProps = {
  message: string;
  setMessage: (text: string) => void;
  tempMsg: string;
  onSend: () => void;
};

export default function ChatInput({ message, setMessage, tempMsg, onSend }: ChatInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={message}
        placeholder="Type a message..."
        placeholderTextColor="#A0AEC0"
        onChangeText={setMessage}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          !message && styles.sendButtonDisabaled,
          !!tempMsg && styles.sendingButtonState,
        ]}
        onPress={onSend}
        disabled={!message || !!tempMsg}
      >
        <Text style={styles.sendButtonText}>
          {tempMsg ? "Sending..." : "Send"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: "#F0F4F8",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginRight: 10,
    color: "#2D3748",
  },
  sendButton: {
    backgroundColor: "#3182CE",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  sendButtonDisabaled: {
    backgroundColor: "#A0AEC0",
    color: "#2D3748",
    opacity: 0.5,
  },
  sendingButtonState: {
    backgroundColor: "#f5860d",
    opacity: 0.5,
    color: "gray",
  },
});
