import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { fonts, useAppTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const icon = (name: IconName, focusedName: IconName) =>
    function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
      return <Ionicons name={focused ? focusedName : name} color={color} size={size} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="groups" options={{ title: 'Groups', tabBarIcon: icon('chatbubbles-outline', 'chatbubbles') }} />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarAccessibilityLabel: 'Share a prayer request',
          tabBarIcon: ({ size }) => (
            <View style={[styles.post, { backgroundColor: colors.accent }]}>
              <Ionicons name="add" size={size} color={colors.accentText} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/compose');
          },
        }}
      />
      <Tabs.Screen name="world" options={{ title: 'World', tabBarIcon: icon('globe-outline', 'globe') }} />
      <Tabs.Screen name="grow" options={{ title: 'Grow', tabBarIcon: icon('leaf-outline', 'leaf') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  post: { width: 40, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
