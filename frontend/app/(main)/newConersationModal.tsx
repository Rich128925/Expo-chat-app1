import { Alert, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Avatar from '@/components/Avatar'
import * as ImagePicker from 'expo-image-picker'
import Input from '@/components/Input'
import Typo from '@/components/Typo'
import { useAuth } from '@/contexts/authContext'
import Button from '@/components/Button'
import { verticalScale } from '@/utils/styling'
import { getContacts, GetContactsResponse } from '@/socket/socketEvents'

type ContactType = {
  id: string
  name: string
  avatar: string | null
  email?: string
}

const NewConersationModal = () => {
  const { isGroup } = useLocalSearchParams<{ isGroup?: string }>()
  const isGroupMode = isGroup === '1'
  const router = useRouter()
  const { user: currentUser } = useAuth()

  const [contacts, setContacts] = useState<ContactType[]>([])
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getContacts(processGetContacts)
    getContacts()

    return () => {
      getContacts(processGetContacts, true)
    }
  }, [])

  const processGetContacts = (res: GetContactsResponse) => {
    console.log('got contacts:', res)

    if (res?.success && res.data) {
      const formattedContacts: ContactType[] = res.data.map((item: any) => ({
        id: item.id || item._id,
        name: item.name,
        avatar: item.avatar || null,
        email: item.email,
      }))

      const filteredContacts = formattedContacts.filter(
        (contact) => contact.id !== currentUser?.id
      )

      setContacts(filteredContacts)
    } else {
      setContacts([])
    }
  }

  const onSelectUser = (user: ContactType) => {
    if (!currentUser) {
      Alert.alert('Authentication', 'Please login to start a conversation')
      return
    }

    if (isGroupMode) {
      toggleParticipant(user)
    } else {
      Alert.alert('Info', `Start conversation with ${user.name}`)
    }
  }

  const toggleParticipant = (user: ContactType) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(user.id)) {
        return prev.filter((id) => id !== user.id)
      }
      return [...prev, user.id]
    })
  }

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Validation', 'Enter group name')
      return
    }

    if (!currentUser) {
      Alert.alert('Validation', 'Please login first')
      return
    }

    if (selectedParticipants.length < 2) {
      Alert.alert('Validation', 'Select at least 2 users')
      return
    }

    try {
      setIsLoading(true)

      const payload = {
        name: groupName.trim(),
        avatar: groupAvatar,
        participants: selectedParticipants,
      }

      console.log('Creating group:', payload)

      Alert.alert('Success', 'Group created successfully')
      router.back()
    } catch (error) {
      console.log('create group error:', error)
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
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
        aspect: [4, 3],
        quality: 0.5,
        allowsEditing: true,
      })

      console.log('picked image:', result)

      if (!result.canceled) {
        setGroupAvatar(result.assets[0].uri)
      }
    } catch (error) {
      console.log('image picker error:', error)
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
            </TouchableOpacity>

            <View style={styles.groupNameContainer}>
              <Input
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
        >
          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Typo color={colors.neutral500}>No contacts found</Typo>
            </View>
          ) : (
            contacts.map((user: ContactType, index: number) => {
              const isSelected = selectedParticipants.includes(user.id)

              return (
                <TouchableOpacity
                  key={user.id || index}
                  style={[styles.contactRow, isSelected && styles.selectedContact]}
                  onPress={() => onSelectUser(user)}
                >
                  <Avatar size={45} uri={user.avatar} />
                  <Typo fontWeight={'500'}>{user.name}</Typo>

                  {isGroupMode && (
                    <View style={styles.selectionIndicator}>
                      <View style={[styles.checkbox, isSelected && styles.checked]} />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })
          )}
        </ScrollView>

        {isGroupMode && (
          <View style={styles.createGroupButton}>
            <Button
              onPress={createGroup}
              disabled={!groupName.trim() || selectedParticipants.length < 2 || isLoading}
              loading={isLoading}
            >
              <Typo fontWeight={'bold'} size={17}>Create Group</Typo>
            </Button>
          </View>
        )}
      </View>
    </ScreenWrapper>
  )
}

export default NewConersationModal

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacingX._15,
    flex: 1,
  },
  groupInfoContainer: {
    alignItems: 'center',
    marginTop: spacingY._10,
    gap: spacingY._10,
  },
  avatarContainer: {
    marginBottom: spacingY._5,
  },
  groupNameContainer: {
    width: '100%',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._10,
  },
  selectedContact: {
    backgroundColor: colors.neutral100,
    borderRadius: radius._15,
  },
  contactList: {
    gap: spacingY._12,
    marginTop: spacingY._10,
    paddingTop: spacingY._10,
    paddingBottom: verticalScale(150),
  },
  selectionIndicator: {
    marginLeft: 'auto',
    marginRight: spacingX._10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
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
    paddingVertical: spacingY._20,
  },
})