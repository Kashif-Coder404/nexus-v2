import React from "react";
import { StyleSheet, View } from "react-native";
import UserBox, { UserProp } from "./UserBox";
import AiBox, { AIBoxProps } from "./AiBox";

export type MessageItems = UserProp | AIBoxProps;

const ChatBox = ({ item }: { item: MessageItems }) => {
  return (
    <View style={styles.container}>
      {item.role === "user" ? (
        <UserBox {...(item as UserProp)} />
      ) : (
        <AiBox {...(item as AIBoxProps)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 2,
  },
});

export default ChatBox;

