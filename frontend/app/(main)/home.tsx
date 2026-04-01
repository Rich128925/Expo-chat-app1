import { StyleSheet, View} from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors } from '@/constants/theme'

const Home = () => {
  return (
    <ScreenWrapper>
      <Typo color={colors.white}>Home</Typo>
      <View style={styles.container}></View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  }
})