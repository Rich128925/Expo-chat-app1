import { StyleSheet, TouchableOpacity, View} from 'react-native'
import React, { useEffect } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import Button from '@/components/Button'
import { testSocket } from '@/socket/socketEvents'
import { verticalScale } from '@/utils/styling'
import * as Icons from 'phosphor-react-native'
import { useRouter } from 'expo-router'

const Home = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // useEffect(()=>{
  //   testSocket(testSocketCallbackHandler)
  //   testSocket({msg: "It's working!!!"})

  //   return()=>{
  //     testSocket(testSocketCallbackHandler, true)
  //   }
  // }, [])

  // const testSocketCallbackHandler = (data: any )=> {
  //   console.log('got response from testSocket event:', data);
    
  // }

  const handleLogout = async () => {
    await signOut();
  }

  
  return (
   
    <ScreenWrapper showPattern={true} bgOpacity={0.4}>
      <View style={styles.container}>
        <View style={styles.header}>
        <View style={{flex: 1}}>
          <Typo
          color={colors.neutral200}
          size={19}
          textProps={{ numberOfLines: 1}}
          > Welcome back {" "}
          <Typo size={20} color={colors.white} fontWeight={"800"}>
            {user?.name || "User"}
          </Typo>{" "}
          🤙
          </Typo>
        </View>

        <TouchableOpacity style={styles.settingIcon} onPress={()=> router.push("/(main)/profieModal") }>
          <Icons.GearSix 
          color={colors.white}
          weight='fill'
          size={verticalScale(22)}
          />
        </TouchableOpacity>
        </View>

        <View style={styles.content}>

        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,  
  },
  header: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    gap: spacingY._15,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._20
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: 'continuous',
    overflow: 'hidden',
    paddingHorizontal: spacingX._20
  },
  navBar: {
    flexDirection: 'row',
    gap: spacingX._15,
    alignItems: 'center',
    paddingHorizontal: spacingX._10,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacingX._10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabStyle: {
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius.full,
    backgroundColor: colors.neutral100
  },
  activeTabStyle: {
    backgroundColor: colors.primaryLight,
  },
  conversationList: {
    paddingVertical: spacingY._20,
  },
  settingIcon: {
    padding: spacingX._10,
    backgroundColor: colors.neutral700,
    borderRadius: radius.full
  },
  floattingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: 'absolute',
    bottom: verticalScale(30),
    right: verticalScale(30),
  }
})
