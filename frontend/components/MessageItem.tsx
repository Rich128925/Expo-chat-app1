import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { MessageProps } from '@/types'
import { useAuth } from '@/contexts/authContext'
import { verticalScale } from '@/utils/styling'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import Avatar from './Avatar'
import Typo from './Typo'

const formatTime = (createdAt: string | Date | undefined) => {
  if (!createdAt) return "";

  if (typeof createdAt === "string" && (createdAt.includes("AM") || createdAt.includes("PM"))) {
    return createdAt;
  }

  const date = new Date(createdAt);

  if (isNaN(date.getTime())) return createdAt;

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
};

const MessageItem = ({
  item, isDirect
}: { item: MessageProps, isDirect: boolean }) => {

  const { user: currentUser } = useAuth()
  const isMe = item.sender?.id === currentUser?.id || item.isMe;

  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage
      ]}
    >
      {
        !isMe && !isDirect && (
          <Avatar
            size={30} uri={item.sender?.avatar}
            style={styles.messageAvatar}
          />
        )
      }

      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.theirBubble
        ]}>
        {
          !isMe && !isDirect && (
            <Typo color={colors.neutral900} fontWeight={"600"} size={13}>
              {item.sender?.name}
            </Typo>
          )
        }

        {item.content && <Typo size={15}>{item.content}</Typo>}

        <Typo
          style={{ alignSelf: 'flex-end' }}
          size={11}
          fontWeight={"500"}
          color={colors.neutral600}
        >
          {formatTime(item.createdAt)}
        </Typo>

      </View>
    </View>
  )
}

export default MessageItem

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    gap: spacingX._7,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    alignSelf: "flex-end",
  },
  attachment: {
    height: verticalScale(180),
    width: verticalScale(180),
    borderRadius: radius._10,
    // marginBottom: spacingY._5,
  },
  messageBubble: {
    padding: spacingX._10,
    borderRadius: radius._15,
    gap: spacingY._5,
  },
  myBubble: {
    backgroundColor: colors.myBubble,
  },
  theirBubble: {
    backgroundColor: colors.otherBubble,
  },
  messageText: {
    fontSize: verticalScale(14),
    lineHeight: verticalScale(20),
  },
  messageTime: {
    fontSize: verticalScale(10),
    marginTop: spacingY._7,
    alignSelf: "flex-end",
  },
  deletedMessage: {
    fontStyle: "italic",
    opacity: 0.7,
  },
  mediaContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    position: "relative",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  senderName: {
    marginBottom: spacingY._7,
    fontSize: verticalScale(12),
    fontWeight: "500",
  },
});