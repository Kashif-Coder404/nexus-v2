import React from "react";
import InputBox from "./InputBox";
import { View, Text } from "react-native";
import AIMsg from "./AIMsg";
import UserMsg from "./UserMsg"
const ChatBox = () => {
  return (
    <View>
      <View>
        <AIMsg role="Nexus" message="Hello! I'm Nexus, your AI assistant." />
        <UserMsg role="User" message="Hey , From the user" />
      </View>
      <InputBox />
    </View>
  );
};

export default ChatBox;
