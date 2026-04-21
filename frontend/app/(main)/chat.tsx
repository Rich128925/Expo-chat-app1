import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import * as Icons from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";

import { uploadFileToCloudinary } from "@/service/imageService";
import { getMessages, onNewMessage, sendMessage } from "@/socket/socketEvents";
import { ResponseProps } from "@/types";

const Chat = () => {
  const { user: currentUser } = useAuth();

  const {
    id: conversationId,
    name,
    participants: stringifiedParticipants,
    avatar,
    type,
  } = useLocalSearchParams();

  const participants = useMemo(() => {
    try {
      return JSON.parse(stringifiedParticipants as string);
    } catch {
      return [];
    }
  }, [stringifiedParticipants]);

  const isDirect = type === "direct";

  const otherParticipant = isDirect
    ? participants.find((p: any) => p._id !== currentUser?.id)
    : null;

  const conversationAvatar =
    isDirect && otherParticipant ? otherParticipant.avatar : avatar;

  const conversationName =
    isDirect && otherParticipant ? otherParticipant.name : name;

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ uri: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    getMessages({ conversationId: conversationId as string });
    getMessages(getMessagesHandler);
    onNewMessage(newMessageHandler);

    return () => {
      getMessages(getMessagesHandler, true);
      onNewMessage(newMessageHandler, true);
    };
  }, []);

  const getMessagesHandler = (res: any) => {
    if (res?.success) {
      setMessages(res.data || []);
    }
  };

  const newMessageHandler = (res: ResponseProps) => {
    if (res?.success) {
      setMessages((prev) => [res.data, ...prev]);
    }
  };

  const onSend = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!currentUser) return;

    setLoading(true);

    try {
      let attachment = null;

      if (selectedFile) {
        const uploadResult = await uploadFileToCloudinary(
          selectedFile,
          "message-attachments"
        );

        if (uploadResult.success) {
          attachment = uploadResult.data;
        } else {
          setLoading(false);
          return Alert.alert("Error", "Could not send the image");
        }
      }

      const payload = {
        conversationId: conversationId as string,
        content: message.trim(),
        attachment: attachment || null,
      };

      sendMessage(payload);
      setMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.log("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to your photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.6,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.log("image picker error:", error);
      Alert.alert("Error", "Could not pick image");
    }
  };

  const renderItem = ({ item }: any) => {
    const isMe =
      item?.senderId === currentUser?.id ||
      item?.sender?._id === currentUser?.id ||
      item?.userId === currentUser?.id;

    const senderAvatar = item?.sender?.avatar || item?.avatar || "";

    const time = item?.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
      : "";

    const attachmentSource =
      typeof item?.attachment === "string"
        ? item.attachment
        : item?.attachment?.url || item?.attachment?.secure_url;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {!isMe && (
          <View style={styles.avatarWrap}>
            <Avatar size={24} uri={senderAvatar} />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {!!item?.content && (
            <Typo style={styles.messageText}>{item.content}</Typo>
          )}

          {!!attachmentSource && (
            <Image
              source={attachmentSource}
              style={styles.chatImage}
              contentFit="cover"
            />
          )}

          {!!time && <Typo style={styles.timeText}>{time}</Typo>}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
      >
        <Header
          style={styles.header}
          leftIcon={
            <View style={styles.headerLeft}>
              <BackButton />
              <Avatar
                size={34}
                uri={conversationAvatar as string}
                isGroup={type === "group"}
              />
              <Typo color={colors.white} fontWeight={"700"} size={18}>
                {conversationName}
              </Typo>
            </View>
          }
          rightIcon={
            <TouchableOpacity style={styles.headerRight}>
              <Icons.DotsThreeOutlineVertical
                weight="fill"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          }
        />

        <View style={styles.chatCard}>
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item, index) =>
              item?._id?.toString() || item?.id?.toString() || index.toString()
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageContent}
          />

          {selectedFile?.uri && (
            <View style={styles.previewWrap}>
              <Image source={selectedFile.uri} style={styles.previewImage} />
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.composer}>
              <TouchableOpacity style={styles.leftAvatarBtn}>
                <Avatar
                  size={28}
                  uri={currentUser?.avatar || ""}   
                />
              </TouchableOpacity>

              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type message"
                placeholderTextColor={colors.neutral400}
                style={styles.input}
              />

              <TouchableOpacity style={styles.attachBtn} onPress={onPickFile}>
                <Icons.Plus
                  size={18}
                  weight="bold"
                  color={colors.neutral700}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
                {loading ? (
                  <Loading size="small" color={colors.white} />
                ) : (
                  <Icons.PaperPlaneTilt
                    size={18}
                    weight="fill"
                    color={colors.white}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Chat;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._12,
    backgroundColor: colors.black,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  headerRight: {
    paddingBottom: spacingY._5,
  },
  chatCard: {
    flex: 1,
    backgroundColor: colors.neutral100,
    borderTopLeftRadius: radius._40,
    borderTopRightRadius: radius._40,
    overflow: "hidden",
  },
  messageContent: {
    paddingHorizontal: spacingX._10,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacingY._10,
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  avatarWrap: {
    marginRight: spacingX._5,
    marginBottom: spacingY._5,
  },
  bubble: {
    maxWidth: "42%",
    minWidth: scale(70),
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._10,
    borderRadius: radius._15,
  },
  myBubble: {
    backgroundColor: colors.myBubble,
    borderBottomRightRadius: radius._6,
  },
  otherBubble: {
    backgroundColor: colors.otherBubble,
    borderBottomLeftRadius: radius._6,
  },
  messageText: {
    color: colors.neutral900,
    fontSize: verticalScale(10),
    lineHeight: verticalScale(14),
    fontWeight: "600",
  },
  timeText: {
    alignSelf: "flex-end",
    marginTop: spacingY._5,
    fontSize: verticalScale(7),
    fontWeight: "600",
    color: colors.neutral500,
  },
  chatImage: {
    width: scale(100),
    height: verticalScale(90),
    borderRadius: radius._10,
    marginTop: spacingY._7,
  },
  previewWrap: {
    marginTop: spacingY._7,
    paddingHorizontal: spacingX._10,
  },
  previewImage: {
    width: scale(70),
    height: verticalScale(70),
    borderRadius: radius._12,
  },
  footer: {
    paddingHorizontal: spacingX._10,
    paddingTop: spacingY._7,
    paddingBottom: Platform.OS === "ios" ? spacingY._17 : spacingY._12,
    backgroundColor: colors.neutral100,
  },
  composer: {
    minHeight: verticalScale(50),
    backgroundColor: colors.white,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacingX._5,
    paddingRight: spacingX._5,
  },
  leftAvatarBtn: {
    marginRight: spacingX._5,
  },
  input: {
    flex: 1,
    fontSize: verticalScale(13),
    color: colors.neutral700,
    paddingVertical: spacingY._10,
  },
  attachBtn: {
    width: scale(34),
    height: verticalScale(34),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral100,
    marginLeft: spacingX._5,
  },
  sendBtn: {
    width: scale(36),
    height: verticalScale(36),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginLeft: spacingX._5,
  },
});