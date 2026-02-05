import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  fontSizes,
  spacing,
  borderRadius,
  touchTargetMin,
  shadows,
} from '../../theme';

const InputBox = ({
  value,
  setValue,
  placeholder,
  secureTextEntry,
  inputType,
  autoComplete,
  leftIcon,
  ...rest
}) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputType === 'password' || secureTextEntry;

  return (
    <View
      pointerEvents="box-none"
      collapsable={Platform.OS !== 'android'}
      style={[
        styles.wrapper,
        {
          borderColor: focused ? colors.primary : colors.border,
          backgroundColor: colors.surface,
        },
        focused && styles.wrapperFocused,
      ]}
    >
      {leftIcon && (
        <View style={styles.leftIconWrap}>
          <Feather name={leftIcon} size={20} color={colors.textSecondary} />
        </View>
      )}
      <TextInput
        editable
        style={[
          styles.input,
          { color: colors.text },
          isPassword && styles.inputPassword,
          leftIcon && styles.inputWithLeftIcon,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        secureTextEntry={isPassword && !showPassword}
        value={value}
        onChangeText={(text) => setValue(text)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        {...rest}
      />
      {isPassword && (
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Feather
            name={showPassword ? 'eye' : 'eye-off'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: Math.max(touchTargetMin, 48),
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  wrapperFocused: {
    borderWidth: 2,
    ...shadows.sm,
  },
  leftIconWrap: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: Math.max(touchTargetMin, 48),
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    fontSize: fontSizes.base,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputPassword: {
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default InputBox;
