import { StyleSheet, View } from 'react-native'
import React from 'react'
import { AvatarProps } from '@/types'
import { verticalScale } from '@/utils/styling'
import { colors, radius } from '@/constants/theme'
import { Image } from 'expo-image'
import { getAvatarPath } from '@/service/imageService'

const Avatar = ({ uri, size = 40, style, isGroup = false }: AvatarProps) => {
  const avatarSize = verticalScale(size)

  return (
    <View
      style={[
        styles.avatar,
        {
          height: avatarSize,
          width: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      <Image
        style={{
          flex: 1,
          borderRadius: avatarSize / 2,
        }}
        source={getAvatarPath(uri, isGroup)}
        contentFit="cover"
        transition={100}
      />
    </View>
  )
}

export default Avatar

const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'center',
    backgroundColor: colors.neutral200,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: 'hidden',
  },
})