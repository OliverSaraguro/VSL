import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/config/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  icon,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // JS driver para interpolación de color
  const focusAnim = useRef(new Animated.Value(0)).current;
  // Native driver para escala del label
  const labelScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();

    Animated.spring(labelScale, {
      toValue: focused ? 0.95 : 1,
      useNativeDriver: true,
      tension: 220,
      friction: 10,
    }).start();
  }, [focused, focusAnim, labelScale]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: error
      ? [colors.error, colors.error]
      : [colors.border, colors.secondary],
  });

  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: labelScale }], alignSelf: 'flex-start' }}>
        <Text style={[styles.label, focused && styles.labelFocused, !!error && styles.labelError]}>
          {label}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            isPassword ? styles.inputWithEye : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          accessibilityLabel={label}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={focused ? colors.secondary : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  labelFocused: {
    color: colors.secondary,
  },
  labelError: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    paddingVertical: 14,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithEye: {
    paddingRight: spacing.xs,
  },
  eyeBtn: {
    paddingLeft: spacing.sm,
    paddingVertical: 6,
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: 4,
  },
});
