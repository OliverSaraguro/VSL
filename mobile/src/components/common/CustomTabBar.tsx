import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/config/theme';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface TabItemCfg {
  icon: MIName;
  label: string;
}

function TabItem({
  icon,
  label,
  focused,
  onPress,
}: {
  icon: MIName;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const circleScale   = useRef(new Animated.Value(focused ? 1 : 0.3)).current;
  const circleOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const lift          = useRef(new Animated.Value(focused ? -10 : 0)).current;
  const iconSc        = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(circleScale,   { toValue: focused ? 1 : 0.3, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(circleOpacity, { toValue: focused ? 1 : 0,   useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(lift,          { toValue: focused ? -10 : 0, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(iconSc,        { toValue: focused ? 1.1 : 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  }, [focused, circleScale, circleOpacity, lift, iconSc]);

  return (
    <TouchableOpacity style={tabS.tab} onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[tabS.group, { transform: [{ translateY: lift }] }]}>
        <View style={tabS.iconWrap}>
          <Animated.View
            style={[
              tabS.circle,
              { opacity: circleOpacity, transform: [{ scale: circleScale }] },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: iconSc }] }}>
            <MaterialIcons
              name={icon}
              size={22}
              color={focused ? '#FFFFFF' : colors.textSecondary}
            />
          </Animated.View>
        </View>
        <Text style={[tabS.label, focused && tabS.labelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function buildCustomTabBar(tabConfig: Record<string, TabItemCfg>) {
  return function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
    const pb = Math.max(insets.bottom, 6);

    return (
      <View style={[tabS.bar, { paddingBottom: pb }]}>
        {state.routes.map((route, i) => {
          const cfg: TabItemCfg = tabConfig[route.name] ?? {
            icon: 'circle' as MIName,
            label: route.name,
          };
          const focused = state.index === i;

          const onPress = () => {
            const ev = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !ev.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.name}
              icon={cfg.icon}
              label={cfg.label}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    );
  };
}

const CIRCLE = 46;

const tabS = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
  },
  group: {
    alignItems: 'center',
  },
  iconWrap: {
    width: CIRCLE,
    height: CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  labelActive: {
    color: colors.secondary,
    fontWeight: '700',
  },
});
