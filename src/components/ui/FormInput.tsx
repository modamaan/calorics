import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface FormInputProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  containerStyle,
  isPassword = false,
  leftIcon,
  ...textInputProps
}: FormInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control });

  const hasError = Boolean(error);

  const borderColor = hasError
    ? Colors.error
    : isFocused
    ? Colors.borderFocus
    : Colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, { borderColor }]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
          value={value as string}
          onChangeText={onChange}
          onBlur={() => {
            setIsFocused(false);
            onBlur();
          }}
          onFocus={() => setIsFocused(true)}
          secureTextEntry={isPassword && !isVisible}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsVisible((v) => !v)}
            accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeText}>{isVisible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasError && (
        <Text style={styles.errorText}>{error?.message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    height: '100%',
  },
  inputWithIcon: {
    // no extra padding needed when icon is present
  },
  eyeButton: {
    paddingLeft: Spacing.sm,
    height: '100%',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: FontSize.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
