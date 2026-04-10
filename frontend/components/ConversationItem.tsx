import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import Avatar from './Avatar'
import Typo from './Typo'
import moment from 'moment'

const ConversationItem = ({ item, showDivider, router }: any) => {
  const openConversation = () => {
    // router.push(...) here later
  }

  const lastMessage: any = item?.lastMessage
  const isDirect = item?.type === 'direct'

  const getLastMessageContent = () => {
    if (!lastMessage) return 'Say hi 👋'
    return lastMessage?.attachment ? 'Image' : lastMessage?.content || 'Say hi 👋'
  }

  const getLastMessageDate = () => {
    const rawDate =
      lastMessage?.createdAt ||
      item?.updatedAt ||
      item?.createdAt

    if (!rawDate) return ''

    const messageDate = moment(rawDate)

    if (!messageDate.isValid()) return ''

    const today = moment()

    if (messageDate.isSame(today, 'day')) {
      return messageDate.format('h:mm A')
    }

    if (messageDate.isSame(today, 'year')) {
      return messageDate.format('MMM D')
    }

    return messageDate.format('MMM D, YYYY')
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={openConversation}
      >
        <View>
          <Avatar
            uri={item?.avatar || null}
            size={47}
            isGroup={item?.type === 'group'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Typo size={17} fontWeight={'600'}>
              {item?.name || (isDirect ? 'Direct Chat' : 'Group Chat')}
            </Typo>

            {!!getLastMessageDate() && (
              <Typo size={15}>{getLastMessageDate()}</Typo>
            )}
          </View>

          <Typo
            size={15}
            color={colors.neutral600}
            textProps={{ numberOfLines: 1 }}
          >
            {getLastMessageContent()}
          </Typo>
        </View>
      </TouchableOpacity>

      {showDivider && <View style={styles.divider} />}
    </View>
  )
}

export default ConversationItem

const styles = StyleSheet.create({
  conversationItem: {
    gap: spacingX._10,
    marginVertical: spacingY._12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
})