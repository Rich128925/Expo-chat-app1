import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { uploadFileToCloudinary } from '@/service/imageService'
import ScreenWrapper from '@/components/ScreenWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'
import Avatar from '@/components/Avatar'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { getMessages, sendMessage, onNewMessage, GetMessagesResponse, SendMessageResponse, deleteMessage, onMessageDeleted, MessageDeletedResponse } from '@/socket/socketEvents'
import { useAuth } from '@/contexts/authContext'
import * as Icons from 'phosphor-react-native'
import { verticalScale } from '@/utils/styling'
import moment from 'moment'

const MessageItem = ({ item, currentUserId, isGroup, conversationId }: { item: any, currentUserId: string, isGroup: string, conversationId: string }) => {
  const isMine = item.senderId?._id === currentUserId || item.senderId?.id === currentUserId;
  const isVideo = item.attachment && item.attachment.includes('/video/');

  const player = useVideoPlayer(isVideo ? item.attachment : null, (player) => {
    player.loop = true;
  });

  const handleLongPress = () => {
    if (isMine && !item.isDeleted) {
      Alert.alert("Delete Message", "Delete this message for everyone?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: () => {
            deleteMessage({ messageId: item._id || item.id, conversationId })
          }
        }
      ])
    }
  }

  return (
    <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
      {!isMine && isGroup === '1' && (
        <Avatar size={30} uri={item.senderId?.avatar} />
      )}
      <View style={[!isMine && isGroup === '1' ? { marginLeft: 8 } : {}, { maxWidth: isGroup === '1' && !isMine ? '75%' : '80%' }]}>
        {!isMine && isGroup === '1' && (
          <Typo size={12} color={colors.neutral500} style={{ marginBottom: 2 }}>{item.senderId?.name}</Typo>
        )}
        <TouchableOpacity activeOpacity={0.8} onLongPress={handleLongPress}>
          <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage, item.isDeleted && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.neutral300 }]}>
            {item.isDeleted ? (
              <Typo color={colors.neutral400} size={14} style={{ fontStyle: 'italic' }}>🚫 This message was deleted</Typo>
            ) : (
              <>
                {item.attachment && !isVideo && (
                  <Image
                    source={{ uri: item.attachment }}
                    style={{ width: 220, height: 220, borderRadius: radius._10, marginBottom: item.content ? 5 : 0 }}
                    contentFit="cover"
                  />
                )}
                {item.attachment && isVideo && player && (
                  <VideoView
                    player={player}
                    style={{ width: 220, height: 220, borderRadius: radius._10, marginBottom: item.content ? 5 : 0 }}
                    allowsFullscreen
                    allowsPictureInPicture
                  />
                )}
                {item.content ? <Typo color={isMine ? colors.white : colors.black} size={15}>{item.content}</Typo> : null}
              </>
            )}
            <Typo color={item.isDeleted ? colors.neutral400 : (isMine ? 'rgba(255,255,255,0.7)' : colors.neutral400)} size={11} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
              {moment(item.createdAt).format('h:mm A')}
            </Typo>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const Chat = () => {
  const { conversationId, name, isGroup } = useLocalSearchParams<{ conversationId: string, name: string, isGroup: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [text, setText] = useState('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const currentUserId = user?.id || (user as any)?._id;

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardHeight(0)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const fetchMessages = useCallback(() => {
    setLoading(true)
    getMessages({ conversationId })
  }, [conversationId])

  useEffect(() => {
    fetchMessages()

    const handleGetMessages = (res: GetMessagesResponse) => {
      setLoading(false)
      if (res.success && res.data) {
        setMessages(res.data)
      }
    }

    const handleNewMessage = (res: SendMessageResponse) => {
      if (res.success && res.data) {
        const newMessage = res.data;
        // Only append if it belongs to this conversation
        if (newMessage.conversationId === conversationId) {
          setMessages(prev => {
            if (prev.some(m => m._id === newMessage._id || m.id === newMessage._id)) return prev;
            return [...prev, newMessage];
          })
        }
      }
    }

    const handleMessageDeleted = (res: MessageDeletedResponse) => {
      setMessages(prev => prev.map(m => {
        if ((m._id === res.messageId) || (m.id === res.messageId)) {
          return { ...m, content: '', attachment: '', isDeleted: true };
        }
        return m;
      }))
    }

    getMessages(handleGetMessages)
    onNewMessage(handleNewMessage)
    onMessageDeleted(handleMessageDeleted)

    return () => {
      getMessages(handleGetMessages, true)
      onNewMessage(handleNewMessage, true)
      onMessageDeleted(handleMessageDeleted, true)
    }
  }, [fetchMessages, conversationId])

  // Scroll to bottom when messages update
  useEffect(() => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true })
      }
    }, 100)
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage({
      conversationId,
      content: text.trim()
    })
    setText('')
  }

  const onPickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your media')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.5,
      })

      if (!result.canceled && result.assets?.length > 0) {
        setUploading(true)
        const res = await uploadFileToCloudinary(result.assets[0], 'chat_attachments')
        if (res.success && res.data) {
          sendMessage({
            conversationId,
            content: text.trim() || '',
            attachment: res.data
          })
          setText('')
        } else {
          Alert.alert('Error', res.msg || 'Could not upload media')
        }
        setUploading(false)
      }
    } catch (error) {
      console.log('Media picker error:', error)
      setUploading(false)
    }
  }

  const renderMessage = ({ item }: { item: any }) => {
    return <MessageItem item={item} currentUserId={currentUserId} isGroup={isGroup as string} conversationId={conversationId as string} />
  }

  return (
    <ScreenWrapper bgOpacity={0.1}>
      <Header
        title={name || 'Chat'}
        leftIcon={<BackButton color={colors.black} />}
        style={{ paddingHorizontal: spacingX._20, marginTop: spacingY._10, paddingBottom: spacingY._15 }}
      />

      <View
        style={[styles.container, { paddingBottom: keyboardHeight }]}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={onPickMedia} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icons.Image color={colors.neutral500} size={verticalScale(24)} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.neutral400}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Icons.PaperPlaneRight color={colors.white} weight="fill" size={verticalScale(20)} />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Chat

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
    borderTopLeftRadius: radius._30,
    borderTopRightRadius: radius._30,
    overflow: 'hidden'
  },
  messageList: {
    padding: spacingX._15,
    paddingBottom: spacingY._20
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: spacingY._10,
  },
  myMessageWrapper: {
    justifyContent: 'flex-end'
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  messageBubble: {
    padding: spacingX._12,
    borderRadius: radius._15,
  },
  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 0,
  },
  theirMessage: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: colors.neutral200
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacingX._15,
    paddingBottom: Platform.OS === 'ios' ? spacingY._20 : spacingX._15,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    alignItems: 'center',
    gap: spacingX._10
  },
  input: {
    flex: 1,
    backgroundColor: colors.neutral100,
    borderRadius: radius._20,
    paddingHorizontal: spacingX._15,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    maxHeight: verticalScale(100),
    fontSize: 16,
    color: colors.black
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: radius._20,
    justifyContent: 'center',
    alignItems: 'center'
  }
})