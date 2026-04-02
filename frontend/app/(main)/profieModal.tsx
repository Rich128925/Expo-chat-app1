import { Alert, Platform, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ScreenWrapper from '@/components/ScreenWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Avatar from '@/components/Avatar'
import * as Icons from 'phosphor-react-native'
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import { useAuth } from '@/contexts/authContext'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'
import { updateProfile, UpdateProfileResponse } from '@/socket/socketEvents'

const ProfileModal = () => {
  const { user, signOut, updateToken } = useAuth()
  const router = useRouter()

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: null as string | null,
    username: '',
    phone: '',
    address: '',
    bio: '',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUserData({
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
      username: user?.username || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
    })
  }, [user])

  useEffect(() => {
    const updateProfileHandler = async (response: UpdateProfileResponse) => {
  console.log("📥 updateProfile response:", response);

  try {
    if (response?.success) {
      if (response?.data?.token) {
        await updateToken(response.data.token)
      }

      Alert.alert('Success', response.msg || 'Profile updated successfully')

      // 👇 Delay navigation slightly to ensure UI updates
      setTimeout(() => {
        router.back()
      }, 300)

    } else {
      Alert.alert('Error', response?.msg || 'Something went wrong')
    }
  } catch (error) {
    console.log('updateProfile response handling error:', error)
  } finally {
    setLoading(false)
  }
}

    updateProfile(updateProfileHandler)

    return () => {
      updateProfile(updateProfileHandler, true)
    }
  }, [router, updateToken])

  const handleLogout = async () => {
    router.back()
    await signOut()
  }

  const showLogoutAlert = () => {
    Alert.alert('Confirm', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: handleLogout,
        style: 'destructive',
      },
    ])
  }

  const onSubmit = async () => {
    if (!userData.name.trim()) {
      Alert.alert('Validation', 'Please enter your name')
      return
    }

    if (!userData.username.trim()) {
      Alert.alert('Validation', 'Please enter your username')
      return
    }

    if (!userData.phone.trim()) {
      Alert.alert('Validation', 'Please enter your phone number')
      return
    }

    try {
      setLoading(true)

      const payload = {
        name: userData.name,
        avatar: userData.avatar,
        username: userData.username,
        phone: userData.phone,
        address: userData.address,
        bio: userData.bio,
      }

      console.log('sending updated profile:', payload)
      updateProfile(payload)
    } catch (error) {
      console.log('profile update error:', error)
      setLoading(false)
      Alert.alert('Error', 'Something went wrong')
    }
  }

  return (
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Header
            title={'Update Profile'}
            leftIcon={Platform.OS == 'android' && <BackButton color={colors.black} />}
            style={{ marginBottom: spacingY._15 }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}
          >
            <View style={styles.avatarContainer}>
              <Avatar uri={userData.avatar} size={verticalScale(140)} />

              <TouchableOpacity style={styles.editIcon}>
                <Icons.Pencil
                  size={verticalScale(16)}
                  color={colors.neutral800}
                  weight="fill"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.label}>Email</Typo>
              <Input
                value={userData.email}
                editable={false}
                containerStyle={styles.emailInput}
                onChangeText={(value: string) =>
                  setUserData({ ...userData, email: value })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.label}>Name</Typo>
              <Input
                value={userData.name}
                containerStyle={styles.input}
                onChangeText={(value: string) =>
                  setUserData({ ...userData, name: value })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.label}>Username</Typo>
              <Input
                value={userData.username}
                containerStyle={styles.input}
                onChangeText={(value: string) =>
                  setUserData({ ...userData, username: value })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.label}>Phone</Typo>
              <Input
                value={userData.phone}
                keyboardType="phone-pad"
                containerStyle={styles.input}
                onChangeText={(value: string) =>
                  setUserData({ ...userData, phone: value })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.label}>Address</Typo>
              <Input
                value={userData.address}
                containerStyle={styles.input}
                onChangeText={(value: string) =>
                  setUserData({ ...userData, address: value })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.label}>Bio</Typo>
              <Input
                value={userData.bio}
                multiline
                containerStyle={styles.bioInput}
                onChangeText={(value: string) =>
                  setUserData({ ...userData, bio: value })
                }
              />
            </View>
          </ScrollView>
        </View>

        <View style={styles.footer}>
          {!loading && (
            <Button style={styles.logoutBtn} onPress={showLogoutAlert}>
              <Icons.SignOut
                size={verticalScale(24)}
                color={colors.white}
                weight="bold"
              />
            </Button>
          )}

          <Button
            style={styles.updateBtn}
            onPress={onSubmit}
            loading={loading}
          >
            <Typo color={colors.black} fontWeight={'700'}>
              Update
            </Typo>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default ProfileModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  form: {
    gap: spacingY._25,
    marginTop: spacingY._20,
    paddingBottom: spacingY._20,
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: spacingY._10,
  },
  editIcon: {
    position: 'absolute',
    bottom: spacingY._5,
    right: spacingX._5,
    backgroundColor: colors.white,
    borderRadius: 100,
    height: verticalScale(30),
    width: verticalScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  inputContainer: {
    gap: spacingY._7,
  },
  label: {
    paddingLeft: spacingX._10,
  },
  emailInput: {
    borderColor: colors.neutral300,
    backgroundColor: colors.neutral300,
    borderRadius: 100,
    paddingHorizontal: spacingX._20,
    minHeight: verticalScale(52),
  },
  input: {
    borderColor: colors.neutral300,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: spacingX._20,
    minHeight: verticalScale(52),
  },
  bioInput: {
    borderColor: colors.neutral300,
    borderWidth: 1,
    borderRadius: scale(20),
    paddingHorizontal: spacingX._20,
    minHeight: verticalScale(100),
    paddingTop: spacingY._10,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    paddingBottom: spacingY._10,
    borderTopColor: colors.neutral200,
    borderTopWidth: 1,
    backgroundColor: colors.white,
  },
  logoutBtn: {
    backgroundColor: colors.rose,
    height: verticalScale(52),
    width: verticalScale(52),
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtn: {
    flex: 1,
    height: verticalScale(52),
    borderRadius: 100,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
})