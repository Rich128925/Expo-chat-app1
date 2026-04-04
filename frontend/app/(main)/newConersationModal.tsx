import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScreenContentWrapper } from 'react-native-screens'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Avatar from '@/components/Avatar'

const NewConersationModal = () => {
  const { isGroup } = useLocalSearchParams()
  const isGroupMode = isGroup == "1";
  const router = useRouter()

  const contacts = [
    {
      id: 1,
      name: "Liam Carter",
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    {
      id: 2,
      name: "Emma Davis",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 3,
      name: "Noah Wilson",
      avatar: "https://i.pravatar.cc/150?img=13",
    },
    {
      id: 4,
      name: "Olivia Moore",
      avatar: "https://i.pravatar.cc/150?img=14",
    },
    {
      id: 5,
      name: "James Anderson",
      avatar: "https://i.pravatar.cc/150?img=15",
    },
    {
      id: 6,
      name: "Ava Thomas",
      avatar: "https://i.pravatar.cc/150?img=16",
    },
    {
      id: 7,
      name: "Ethan Miller",
      avatar: "https://i.pravatar.cc/150?img=16",
    },
    {
      id: 8,
      name: "Sophia Taylor",
      avatar: "https://i.pravatar.cc/150?img=18",
    },
    {
      id: 9,
      name: "Benjamin Harris",
      avatar: "https://i.pravatar.cc/150?img=19",
    },
    {
      id: 10,
      name: "Mia Clark",
      avatar: "https://i.pravatar.cc/150?img=20",
    },
  ]
  

  return (
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
      <Header
        title={isGroupMode ? "New Group" : "Select User"}
        leftIcon={<BackButton color={colors.black}/>}
      />
      {
        isGroupMode && (
          <View style={styles.groupInfoContainer}>
            <View style={styles.avatarContainer}>
            <TouchableOpacity>
              <Avatar
              uri={null} size={100}
              isGroup={true}
              />
            </TouchableOpacity>
            </View>
          </View>
        )
      }
      </View>
    </ScreenWrapper>
  )
}

export default NewConersationModal

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacingX._15,
    flex: 1
  },
  groupInfoContainer: {
    alignItems: "center",
    marginTop: spacingY._10
  },
  avatarContainer: {
    marginBottom: spacingY._10
  },
  groupNameContainer: {
    width: "100%"
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    paddingVertical: spacingY._5
  },
  selectedContact: {
    backgroundColor: colors.neutral100,
    borderRadius: radius._15
  },
  contactList: {
    gap: spacingY._12,
    marginTop: spacingY._10,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._20
  },
  selectionIndicator: {
    marginLeft: "auto",
    marginRight: spacingX._10
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary
  },
  checked: {
    backgroundColor: colors.primary
  }, 
  createGroupButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacingX._15,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200
  }
})