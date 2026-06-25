import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useSignUp, useSSO } from '@clerk/expo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppLogo } from '@/components/ui/AppLogo';
import { FormInput } from '@/components/ui/FormInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { SocialButton } from '@/components/ui/SocialButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { saveUserProfile } from '@/lib/api/firestore';

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(60),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── OTP Verification Step ─────────────────────────────────────────────────────
interface VerifyStepProps {
  onVerify: (code: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  email: string;
}

function VerifyStep({ onVerify, isLoading, error, email }: VerifyStepProps) {
  const [code, setCode] = useState('');

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.verifyContainer}>
      <View style={styles.verifyIconBadge}>
        <Text style={styles.verifyIcon}>📧</Text>
      </View>
      <Text style={styles.verifyTitle}>Check your email</Text>
      <Text style={styles.verifySubtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={styles.verifyEmail}>{email}</Text>
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <View style={styles.otpWrapper}>
        <TextInput
          style={styles.otpInput}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.textMuted}
          textAlign="center"
          accessibilityLabel="Verification code input"
        />
      </View>

      <GradientButton
        label="Verify Email"
        onPress={() => onVerify(code)}
        isLoading={isLoading}
        disabled={code.length < 6 || isLoading}
      />
    </Animated.View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const firstFormError =
    errors.fullName?.message ??
    errors.email?.message ??
    errors.password?.message ??
    errors.confirmPassword?.message ??
    null;

  // ── Email/Password Sign-Up (Clerk v3 SignUpFutureResource API) ───────────────
  const onSubmit = useCallback(
    async (values: SignUpFormValues) => {
      if (!signUp) {
        setGlobalError('Auth not ready. Please wait a moment and try again.');
        return;
      }
      setGlobalError(null);

      try {
        // Step 1: Create account with email + password
        // In Clerk v3, use signUp.password() for email+password flows
        const { error: createError } = await signUp.password({
          emailAddress: values.email,
          password: values.password,
          firstName: values.fullName.split(' ')[0],
          lastName: values.fullName.split(' ').slice(1).join(' ') || undefined,
        });

        if (createError) {
          setGlobalError(createError.longMessage ?? createError.message ?? 'Sign up failed. Please try again.');
          return;
        }

        // Step 2: Send OTP verification email
        // In Clerk v3, use signUp.verifications.sendEmailCode()
        const { error: sendError } = await signUp.verifications.sendEmailCode();

        if (sendError) {
          setGlobalError(sendError.message ?? 'Could not send verification email. Please try again.');
          return;
        }

        setStep('verify');
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };
        setGlobalError(
          clerkError?.errors?.[0]?.longMessage ??
          clerkError?.errors?.[0]?.message ??
          (err instanceof Error ? err.message : 'Sign up failed. Please try again.')
        );
      }
    },
    [signUp],
  );

  // ── OTP Verification (Clerk v3 API) ────────────────────────────────────────
  const onVerify = useCallback(
    async (code: string) => {
      if (!signUp) return;
      setVerifyLoading(true);
      setGlobalError(null);

      try {
        // Step 3: Verify OTP code
        const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });

        if (verifyError) {
          setGlobalError(verifyError.message ?? 'Invalid code. Please try again.');
          return;
        }

        // Step 4: Finalize — creates the session (replaces setActive in v3)
        const { error: finalizeError } = await signUp.finalize();

        if (finalizeError) {
          setGlobalError(finalizeError.message ?? 'Could not complete sign-up.');
          return;
        }

        // Save Firestore profile after verification is complete
        if (signUp.createdUserId) {
          const formValues = getValues();
          await saveUserProfile(signUp.createdUserId, {
            email: formValues.email,
            displayName: formValues.fullName,
            photoURL: null,
            provider: 'email',
          });
        }

        // AuthGate in _layout.tsx handles navigation to home
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        setGlobalError(
          clerkError?.errors?.[0]?.message ?? 'Invalid code. Please try again.',
        );
      } finally {
        setVerifyLoading(false);
      }
    },
    [signUp, getValues],
  );

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const onGooglePress = useCallback(async () => {
    setGoogleLoading(true);
    setGlobalError(null);

    try {
      const redirectUrl = Linking.createURL('/');
      const { createdSessionId, setActive: setActiveSession } =
        await startSSOFlow({ strategy: 'oauth_google', redirectUrl });

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: unknown) {
      console.log('[SignUp.Google] caught error:', JSON.stringify(err, null, 2));
      console.log('[SignUp.Google] error type:', typeof err, err instanceof Error ? err.message : '');

      const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
      const message =
        clerkError?.errors?.[0]?.longMessage ??
        clerkError?.errors?.[0]?.message ??
        (err instanceof Error ? err.message : JSON.stringify(err));
        
      setGlobalError(message);
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow]);

  const currentEmail = getValues('email');

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeInDown.duration(600).delay(100)}
              style={styles.logoSection}
            >
              <AppLogo size="sm" showTagline={false} />
            </Animated.View>

            {step === 'verify' ? (
              <VerifyStep
                onVerify={onVerify}
                isLoading={verifyLoading}
                error={globalError}
                email={currentEmail}
              />
            ) : (
              <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.card}>
                <Text style={styles.heading}>Create account</Text>
                <Text style={styles.subheading}>Start your calorie tracking journey</Text>

                {(globalError ?? firstFormError) ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>
                      ⚠️ {globalError ?? firstFormError}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.form}>
                  <FormInput
                    name="fullName"
                    control={control}
                    label="Full name"
                    placeholder="Jane Doe"
                    returnKeyType="next"
                    textContentType="name"
                    autoComplete="name"
                    autoCapitalize="words"
                  />
                  <FormInput
                    name="email"
                    control={control}
                    label="Email address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    returnKeyType="next"
                    textContentType="emailAddress"
                    autoComplete="email"
                  />
                  <FormInput
                    name="password"
                    control={control}
                    label="Password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    isPassword
                    returnKeyType="next"
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />
                  <FormInput
                    name="confirmPassword"
                    control={control}
                    label="Confirm password"
                    placeholder="Re-enter your password"
                    isPassword
                    returnKeyType="done"
                    textContentType="newPassword"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                </View>

                <Text style={styles.hintText}>
                  🔒 At least 8 characters, 1 uppercase, 1 number
                </Text>

                <GradientButton
                  label="Create Account"
                  onPress={handleSubmit(onSubmit)}
                  isLoading={isSubmitting}
                  disabled={isSubmitting || googleLoading}
                />

                <OrDivider />

                <SocialButton
                  provider="google"
                  onPress={onGooglePress}
                  isLoading={googleLoading}
                  disabled={isSubmitting || googleLoading}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/sign-in')}
                    accessibilityRole="link"
                  >
                    <Text style={styles.footerLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  logoSection: { alignItems: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  form: { gap: 0 },
  hintText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -Spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerLink: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: { color: Colors.accent },
  verifyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  verifyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  verifyIcon: { fontSize: 32 },
  verifyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  verifySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  verifyEmail: { color: Colors.accent, fontWeight: FontWeight.semibold },
  otpWrapper: { width: '100%', marginVertical: Spacing.md },
  otpInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 64,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
});
