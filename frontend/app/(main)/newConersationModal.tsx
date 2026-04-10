import { Alert, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'

import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Avatar from '@/components/Avatar'
import Input from '@/components/Input'
import Typo from '@/components/Typo'
import { useAuth } from '@/contexts/authContext'
import Button from '@/components/Button'
import { verticalScale } from '@/utils/styling'
import {
  getContacts,
  GetContactsResponse,
  onNewConversation,
  emitNewConversation,
  NewConversationResponse,
} from '@/socket/socketEvents'

type ContactType = {
  id: string
  name: string
  avatar: string | null
  email?: string
}

const NewConversationModal = () => {
  const { isGroup } = useLocalSearchParams<{ isGroup?: string }>()
  const isGroupMode = isGroup === '1'
  const router = useRouter()
  const { user: currentUser } = useAuth()

  const [contacts, setContacts] = useState<ContactType[]>([])
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingContacts, setIsFetchingContacts] = useState(true)

  // Process contacts response
  const processGetContacts = useCallback((res: GetContactsResponse) => {
    console.log('📞 Got contacts response:', res)
    setIsFetchingContacts(false)

    if (res?.success && res.data && Array.isArray(res.data)) {
      const formattedContacts: ContactType[] = res.data.map((item: any) => ({
        id: String(item.id || item._id || ''),
        name: item.name || '',
        avatar: item.avatar || null,
        email: item.email,
      }))

      const filteredContacts = formattedContacts.filter(
        (contact) => contact.id && contact.id !== currentUser?.id
      )

      console.log(`✅ Loaded ${filteredContacts.length} contacts`)
      setContacts(filteredContacts)
    } else {
      console.log('⚠️ No contacts found or invalid response')
      setContacts([])
    }
  }, [currentUser?.id])

  // Process new conversation response
  const processNewConversation = useCallback((res: NewConversationResponse) => {
    console.log('💬 New conversation response:', res)
    setIsLoading(false)

    if (res?.success && res.data) {
      // Navigate to chat screen
      router.push({
        pathname: "/(main)/chat",
        params: {
          conversationId: res.data._id || res.data.id,
          name: res.data.name || '',
          isGroup: isGroupMode ? '1' : '0'
        }
      })
    } else {
      Alert.alert('Error', res?.msg || 'Failed to create conversation')
    }
  }, [router, isGroupMode])

  useEffect(() => {
    // Get contacts when component mounts (only once)
    getContacts(processGetContacts)
    
    // Listen for conversation creation response
    onNewConversation(processNewConversation)

    // Cleanup on unmount
    return () => {
      getContacts(processGetContacts, true)
      onNewConversation(processNewConversation, true)
    }
  }, [processGetContacts, processNewConversation]) // Added dependencies

  const onSelectUser = (user: ContactType) => {
    if (!currentUser?.id) {
      Alert.alert('Authentication', 'Please login to start a conversation')
      return
    }

    if (!user?.id) {
      Alert.alert('Error', 'Invalid user selected')
      return
    }

    if (isGroupMode) {
      toggleParticipant(user)
      return
    }

    setIsLoading(true)
    console.log('📤 Creating direct conversation with:', user.id)

    emitNewConversation({
      type: 'direct',
      participants: [String(currentUser.id), String(user.id)],
    })
  }

  const toggleParticipant = (user: ContactType) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(user.id)) {
        return prev.filter((id) => id !== user.id)
      }
      return [...prev, user.id]
    })
  }

  const createGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Validation', 'Please enter a group name')
      return
    }

    if (!currentUser?.id) {
      Alert.alert('Validation', 'Please login first')
      return
    }

    if (selectedParticipants.length < 2) {
      Alert.alert('Validation', 'Please select at least 2 participants')
      return
    }

    setIsLoading(true)
    console.log('👥 Creating group:', {
      name: groupName.trim(),
      participants: [String(currentUser.id), ...selectedParticipants.map(String)]
    })

    emitNewConversation({
      type: 'group',
      name: groupName.trim(),
      avatar: groupAvatar,
      participants: [String(currentUser.id), ...selectedParticipants.map(String)],
    })
  }

  const onPickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1], // Square for group avatar
        quality: 0.5,
        allowsEditing: true,
      })

      if (!result.canceled && result.assets?.length > 0) {
        setGroupAvatar(result.assets[0].uri)
      }
    } catch (error) {
      console.log('Image picker error:', error)
      Alert.alert('Error', 'Could not pick image')
    }
  }

  return (
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
        <Header
          title={isGroupMode ? 'New Group' : 'Select User'}
          leftIcon={<BackButton color={colors.black} />}
        />

        {isGroupMode && (
          <View style={styles.groupInfoContainer}>
            <TouchableOpacity onPress={onPickImage} style={styles.avatarContainer}>
              <Avatar uri={groupAvatar} size={100} isGroup={true} />
              <View style={styles.cameraIcon}>
                <Typo size={20}>📷</Typo>
              </View>
            </TouchableOpacity>

            <View style={styles.groupNameContainer}>
              <Input
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
            
            {selectedParticipants.length > 0 && (
              <Typo size={12} color={colors.neutral500}>
                Selected: {selectedParticipants.length} participants
              </Typo>
            )}
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
        >
          {isFetchingContacts ? (
            <View style={styles.emptyState}>
              <Typo color={colors.neutral500}>Loading contacts...</Typo>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Typo color={colors.neutral500}>No contacts found</Typo>
              <Typo size={12} color={colors.neutral400} style={{ marginTop: 5 }}>
                Other users will appear here when they register
              </Typo>
            </View>
          ) : (
            contacts.map((user) => {
              const isSelected = selectedParticipants.includes(user.id)

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.contactRow, isSelected && styles.selectedContact]}
                  onPress={() => onSelectUser(user)}
                  disabled={isLoading}
                >
                  <Avatar size={45} uri={user.avatar} />

                  <View style={styles.userInfo}>
                    <Typo fontWeight={'500'}>{user.name}</Typo>
                    {!!user.email && (
                      <Typo size={12} color={colors.neutral500}>
                        {user.email}
                      </Typo>
                    )}
                  </View>

                  {isGroupMode && (
                    <View style={styles.selectionIndicator}>
                      <View style={[styles.checkbox, isSelected && styles.checked]}>
                        {isSelected && (
                          <Typo size={12} color={colors.white}>✓</Typo>
                        )}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })
          )}
        </ScrollView>

        {isGroupMode && contacts.length > 0 && (
          <View style={styles.createGroupButton}>
            <Button
              onPress={createGroup}
              disabled={!groupName.trim() || selectedParticipants.length < 2 || isLoading}
              loading={isLoading}
            >
              <Typo fontWeight={'bold'} size={17}>
                Create Group ({selectedParticipants.length} participants)
              </Typo>
            </Button>
          </View>
        )}
      </View>
    </ScreenWrapper>
  )
}

export default NewConversationModal

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacingX._15,
    flex: 1,
  },
  groupInfoContainer: {
    alignItems: 'center',
    marginTop: spacingY._10,
    gap: spacingY._10,
    marginBottom: spacingY._20,
  },
  avatarContainer: {
    marginBottom: spacingY._5,
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 5,
  },
  groupNameContainer: {
    width: '100%',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._10,
  },
  userInfo: {
    flex: 1,
  },
  selectedContact: {
    backgroundColor: colors.neutral100,
  },
  contactList: {
    gap: spacingY._10,
    marginTop: spacingY._10,
    paddingTop: spacingY._10,
    paddingBottom: verticalScale(150),
  },
  selectionIndicator: {
    marginLeft: 'auto',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: colors.primary,
  },
  createGroupButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacingX._15,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._40,
  },
})