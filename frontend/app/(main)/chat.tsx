import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/authContext'
import { scale, verticalScale } from '@/utils/styling'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Avatar from '@/components/Avatar'
import * as Icons from 'phosphor-react-native'
import MessageItem from '@/components/MessageItem'
import Input from '@/components/Input'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import { Image } from 'expo-image'
import Loading from '@/components/Loading'
import { uploadFileToCloudinary } from '@/service/imageService'
import { getMessages, onNewMessage, sendMessage } from '@/socket/socketEvents'
import { ResponseProps } from '@/types'


const Chat = () => {

  const {user: currentUser} = useAuth()

  const {
    id: conversationId,
    name,
    participants: stringifiedParticipants,
    avatar,
    type
  } = useLocalSearchParams()

  const participants = JSON.parse(stringifiedParticipants as string)

  let conversationAvatar = avatar
  let isDirect = type == 'direct'
  const otherParticipant = isDirect? participants.find((p:any)=> p._id !=currentUser?.id): null
  if (isDirect && otherParticipant) conversationAvatar = otherParticipant.avatar;
  let conversationName = isDirect? otherParticipant.name : name
  const [message, setMessage] = useState("")
  const [selectedFile, SetSelectedFile] = useState<{uri: string} | (null)> (null)
  const [loading, setloading] = useState(false)

  const [messages, setMessages] = useState<any[]>([])

  // console.log('got conversation data:', data);

  useEffect(()=>{
    getMessages({ conversationId: conversationId as string })
    getMessages(getMessagesHandler)
    onNewMessage(newMessageHandler)

    return()=> {
      getMessages(getMessagesHandler, true)
      onNewMessage(newMessageHandler, true)
    }
  },[])

  const getMessagesHandler = (res: any)=>{
    console.log('got messages response: ', res);
    if(res.success){
      setMessages(res.data)
    }
  }

  const newMessageHandler = (res: ResponseProps)=>{
    console.log('got new message response: ', res);
    if(res.success){
      setMessages((prev)=>[res.data, ...prev])
    }
  }

const onSend = async ()=> {
    if(!message.trim() && !selectedFile) return;

    if(!currentUser) return;

    setloading(true)

    try {
      let attachement = null;
      if(selectedFile){
        const uploadResult = await uploadFileToCloudinary(
          selectedFile,
          "message-aattachements"
        );

        if(uploadResult.success){
          attachement = uploadResult.data
        }else{
          setloading(false)
          return Alert.alert("Error", "Could not send the image!");
        }
      }

      let payload = {
        conversationId: conversationId as string,
        content: message,
        attachment: attachement || null
      }

      sendMessage(payload);
      setMessage("");
      SetSelectedFile(null);
      
    } catch (error) {
      console.log('Error Sending message: ', error);
      Alert.alert("Error", "Failed to Send message");
    }finally{
      setloading(false)
    }
}

const onPickFile = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.5,
        allowsEditing: true,
      })

      console.log('picked image:', result)

      if (!result.canceled) {
        SetSelectedFile(result.assets[0])
      }
    } catch (error) {
      console.log('image picker error:', error)
      Alert.alert('Error', 'Could not pick image')
    }
  }
  

  return (
    <ScreenWrapper showPattern={true} bgOpacity={0.5}>
    <KeyboardAvoidingView
    behavior={Platform.OS == 'ios' ? "padding": "height"}
    style={styles.container}>
      {/** Header */}
      <Header 
      style={styles.header}
      leftIcon={
        <View style={styles.headerLeft}>
          <BackButton/>
          <Avatar
          size={30}
          uri={conversationAvatar as string}
          isGroup={type == 'group'}
          />
          <Typo color={colors.white} fontWeight={'500'} size={22}>
            {conversationName}
          </Typo>
        </View>
      }
      rightIcon={
        <TouchableOpacity style={{ marginBottom: verticalScale(7)}}>
          <Icons.DotsThreeOutlineVertical
          weight = 'fill'
          color={colors.white}
          />
        </TouchableOpacity>
      }
      />
      {/** Messages */}
      <View style={styles.content}>
        <FlatList
        data={messages}
        inverted={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messageContent}
        renderItem={({item})=>(
          <MessageItem item={item} isDirect={isDirect}/>
        )}
        keyExtractor={(item)=> item.id}
        />

        <View style={styles.footer}>
          <View style={{ position: 'relative' }}>
          <Input 
          value={message}
          onChangeText={setMessage}
          containerStyle={{
            paddingLeft: spacingX._10,
            paddingRight: scale(65),
            borderWidth: 0
          }}
          placeholder='Type message...'
          icon={
            <TouchableOpacity style={styles.inputIcon} onPress={onPickFile}>
              <Icons.Plus
              color={colors.black}
              weight="bold"
              size={verticalScale(22)}
              />

              {selectedFile && selectedFile.uri && (
                <Image
                source={selectedFile.uri}
                style={styles.selectedFile}
                />
              )}

            </TouchableOpacity>
          }
          />

          <View style={styles.sendButtonPosition}>
            <TouchableOpacity style={styles.inputIcon} onPress={onSend}>
              {
                loading ? (
                  <Loading size='small' color={colors.black}/>

                ) : (
                  <Icons.PaperPlaneTilt
              color={colors.black}
              weight='fill'
              size={verticalScale(22)}
              />
                )
              }
              
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </View>

      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default Chat

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: 'center',
    gap: spacingX._12
  },
  inputRightIcon: {
    position: "absolute",
    right: scale(10),
    top: verticalScale(15),
    paddingLeft: spacingX._12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.neutral300
  },
  sendButtonPosition: {
    position: 'absolute',
    right: scale(10),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedFile: {
    position: "absolute",
    height: verticalScale(38),
    width: verticalScale(38),
    borderRadius: radius.full,
    alignSelf: "center"
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._15
  },
  inputIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8
  },
  footer: {
    paddingTop: spacingY._7,
    paddingBottom: verticalScale(22)
  },
  messagesContainer: {
    flex: 1
  },
  messageContent: {
    // padding: spacingX._15,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._12
  },
  plusIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8
  }
})