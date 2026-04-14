import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import * as Icons from 'phosphor-react-native'
import { verticalScale } from '@/utils/styling'
import { useRouter } from 'expo-router'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'

const Register = () => {

  const nameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter();

  const { signUp } = useAuth();

  const handleSumbit = async () => {
    if (!emailRef.current || !passwordRef.current || !nameRef.current) {
      Alert.alert("Sign Up", "Please fill all the fields")
      return;
    }

    try {
      setIsLoading(true);
      await signUp(emailRef.current, passwordRef.current, nameRef.current, "");
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Registration Error", error.message);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenWrapper showPattern={true}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton iconSize={28} />
            <Typo size={17} color={colors.white}>
              Need some help?
            </Typo>
          </View>

          <View style={styles.content}>
            {/* your form goes here */}
            <ScrollView
              contentContainerStyle={styles.form}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: spacingY._10, marginBottom: spacingY._15 }}>
                <Typo size={28} fontWeight={"600"}>
                  Getting Started
                </Typo>
                <Typo color={colors.neutral600}>
                  Created an account to continue
                </Typo>
              </View>

              <Input
                placeholder='Enter your name'
                onChangeText={(value: string) => nameRef.current = value}
                icon={
                  <Icons.User
                    size={verticalScale(26)}
                    color={colors.neutral600}
                  />
                }
              />
              <Input
                placeholder='Enter your email'
                onChangeText={(value: string) => emailRef.current = value}
                icon={
                  <Icons.At
                    size={verticalScale(26)}
                    color={colors.neutral600}
                  />
                }
              />
              <Input
                placeholder='Enter your password'
                secureTextEntry
                onChangeText={(value: string) => passwordRef.current = value}
                icon={
                  <Icons.Lock
                    size={verticalScale(26)}
                    color={colors.neutral600}
                  />
                }
              />

              <View style={{ marginTop: spacingY._25, gap: spacingX._15 }}>
                <Button loading={isLoading} onPress={handleSumbit}>
                  <Typo fontWeight={"bold"} color={colors.black} size={20}>
                    Sign Up
                  </Typo>
                </Button>

                <View style={styles.footer}>
                  <Typo>Already have an account?</Typo>
                  <Pressable onPress={() => router.push('/(auth)/login')}>
                    <Typo fontWeight={"bold"} color={colors.primaryDark}>
                      Login
                    </Typo>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._20,
    padding: spacingX._20,
  },
  form: {
    gap: spacingY._15,
    marginTop: spacingY._20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
})