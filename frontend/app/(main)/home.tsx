import { ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import Button from '@/components/Button'
import { getConversations, GetConversationsResponse, onRefreshConversations, onConversationDeleted, ConversationDeletedResponse } from '@/socket/socketEvents'
import { verticalScale } from '@/utils/styling'
import * as Icons from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import ConversationItem from '@/components/ConversationItem'
import Loading from '@/components/Loading'

const Home = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])

  const fetchConversations = React.useCallback(() => {
    setLoading(true)
    getConversations()
  }, [])

  useEffect(() => {
    fetchConversations()

    const handleGetConversations = (res: GetConversationsResponse) => {
      setLoading(false)
      if (res.success && res.data) {
        setConversations(res.data)
      }
    }
    
    getConversations(handleGetConversations)
    
    let offRefresh = false;
    const handleRefresh = () => {
      if (!offRefresh) fetchConversations();
    };
    onRefreshConversations(handleRefresh)

    const handleConversationDeleted = (res: ConversationDeletedResponse) => {
       setConversations(prev => prev.filter(c => (c._id !== res.conversationId) && (c.id !== res.conversationId)))
    }
    onConversationDeleted(handleConversationDeleted)

    return () => {
      offRefresh = true;
      getConversations(handleGetConversations, true)
      onRefreshConversations(handleRefresh, true)
      onConversationDeleted(handleConversationDeleted, true)
    }
  }, [fetchConversations])

  const handleLogout = async () => {
    await signOut();
  }

  const currentUserId = user?.id || (user as any)?._id;

  const formattedConversations = conversations.map(conv => {
    if (conv.type === 'direct' && conv.participants) {
      const otherParticipant = conv.participants.find((p: any) => p._id !== currentUserId && p.id !== currentUserId);
      if (otherParticipant) {
        return {
          ...conv,
          name: otherParticipant.name,
          avatar: otherParticipant.avatar
        }
      }
    }
    return conv;
  });

  let directConversations = formattedConversations
  .filter((item: any)=> item.type == "direct")
  .sort((a: any, b: any)=> {
    const aDate = a?.lastMessage?.createdAt || a.updatedAt || a.createdAt;
    const bDate = b?.lastMessage?.createdAt || b.updatedAt || b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

  let groupConversations = formattedConversations
  .filter((item: any)=> item.type == "group")
  .sort((a: any, b: any)=> {
    const aDate = a?.lastMessage?.createdAt || a.updatedAt || a.createdAt;
    const bDate = b?.lastMessage?.createdAt || b.updatedAt || b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

 
  
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
          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingVertical: spacingY._20}}>
              <View style={styles.navBar}>
                <View style={styles.tabs}>
                  <TouchableOpacity
                  onPress={()=> setSelectedTab(0)}
                  style={[styles.tabStyle, 
                  selectedTab == 0 && styles.activeTabStyle]}
                  >
                    <Typo>Direct Messages</Typo>
                  </TouchableOpacity>
                   <TouchableOpacity
                  onPress={()=> setSelectedTab(1)}
                  style={[styles.tabStyle, 
                  selectedTab == 1 && styles.activeTabStyle]}
                  >
                    <Typo>Group</Typo>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.conversationList}>
                  {
                    selectedTab == 0 && directConversations.map((item: any, index)=>{
                      return (
                        <ConversationItem 
                        item={item}
                        key={index}
                        router={router}
                        showDivider={directConversations.length != index + 1}/>
                      )
                    })
                  }
                   {
                    selectedTab == 1 && groupConversations.map((item: any, index)=>{
                      return (
                        <ConversationItem 
                        item={item}
                        key={index}
                        router={router}
                        showDivider={directConversations.length != index + 1}/>
                      )
                    })
                  }
              </View>

                  {
                    !loading && selectedTab == 0 && directConversations.length == 0 && (
                      <Typo style={{textAlign: 'center'}}>
                          You don&apos;t have any messagess
                      </Typo>
                    )
                  }
                  {
                    !loading && selectedTab == 1 && groupConversations.length == 0 && (
                      <Typo style={{textAlign: 'center'}}>
                          You haven&apos;t joined any groups yet
                      </Typo>
                    )
                  }

              {
                loading && <Loading />
              }
          </ScrollView>
        </View>
      </View>
      
      <Button 
      style={styles.floatingButton}
      onPress={()=> router.push({
        pathname: "/(main)/newConersationModal",
        params: {isGroup: selectedTab}
      })}>

        <Icons.Plus
        color={colors.black}
        weight='bold'
        size={verticalScale(24)}
        />
      </Button>
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
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: 'absolute',
    bottom: verticalScale(30),
    right: verticalScale(30),
  }
})
