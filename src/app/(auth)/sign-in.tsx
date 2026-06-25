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
import { useSignIn, useSSO } from '@clerk/expo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppLogo } from '@/components/ui/AppLogo';
import { FormInput } from '@/components/ui/FormInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { SocialButton } from '@/components/ui/SocialButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

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
        <Text style={styles.verifyIcon}>🔐</Text>
      </View>
      <Text style={styles.verifyTitle}>Device Verification</Text>
      <Text style={styles.verifySubtitle}>
        For your security, please enter the 6-digit code sent to{'\n'}
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
        label="Verify & Sign In"
        onPress={() => onVerify(code)}
        isLoading={isLoading}
        disabled={code.length < 6 || isLoading}
      />
    </Animated.View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Email/Password Sign-In (Clerk v3 SignInFutureResource API) ───────────
  const onSubmit = useCallback(
    async (values: SignInFormValues) => {
      if (!signIn) {
        setGlobalError('Auth not ready. Please wait a moment and try again.');
        return;
      }
      setGlobalError(null);

      try {
        // Step 1: Attempt to sign in with password
        const { error: passwordError } = await signIn.password({
          identifier: values.email,
          password: values.password,
        });

        if (passwordError) {
          setGlobalError(passwordError.longMessage ?? passwordError.message ?? 'Sign in failed.');
          return;
        }

        // Step 2: Handle Client Trust / MFA
        if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
          // Send the verification code
          const { error: sendError } = await signIn.mfa.sendEmailCode();

          if (sendError) {
            setGlobalError(sendError.longMessage ?? sendError.message ?? 'Could not send verification code.');
            return;
          }

          setStep('verify');
          return;
        }

        if (signIn.status !== 'complete') {
          setGlobalError(`Sign in incomplete. Status: ${signIn.status}`);
          return;
        }

        // Step 3: Finalize if already complete
        const { error: finalizeError } = await signIn.finalize();

        if (finalizeError) {
          setGlobalError(finalizeError.longMessage ?? finalizeError.message ?? 'Could not complete sign-in.');
          return;
        }
      } catch (err: unknown) {
        console.log('[SignIn] caught error:', JSON.stringify(err, null, 2));
        const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
        const message =
          clerkError?.errors?.[0]?.longMessage ??
          clerkError?.errors?.[0]?.message ??
          (err instanceof Error ? err.message : JSON.stringify(err));
        setGlobalError(message);
      }
    },
    [signIn],
  );

  // ── OTP Verification for MFA / Client Trust ──────────────────────────────
  const onVerify = useCallback(
    async (code: string) => {
      if (!signIn) return;
      setVerifyLoading(true);
      setGlobalError(null);

      try {
        // Verify the code
        const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code });

        if (verifyError) {
          setGlobalError(verifyError.longMessage ?? verifyError.message ?? 'Invalid code. Please try again.');
          return;
        }

        if (signIn.status !== 'complete') {
          setGlobalError(`Still incomplete. Status: ${signIn.status}`);
          return;
        }

        // Finalize session
        const { error: finalizeError } = await signIn.finalize();

        if (finalizeError) {
          setGlobalError(finalizeError.longMessage ?? finalizeError.message ?? 'Could not complete sign-in.');
          return;
        }
      } catch (err: unknown) {
        console.log('[SignIn.Verify] caught error:', JSON.stringify(err, null, 2));
        const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
        const message =
          clerkError?.errors?.[0]?.longMessage ??
          clerkError?.errors?.[0]?.message ??
          'Invalid code. Please try again.';
        setGlobalError(message);
      } finally {
        setVerifyLoading(false);
      }
    },
    [signIn],
  );

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const onGooglePress = useCallback(async () => {
    setGoogleLoading(true);
    setGlobalError(null);

    try {
      const redirectUrl = Linking.createURL('/');
      const { createdSessionId, setActive: setActiveSession } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: unknown) {
      console.log('[SignIn.Google] caught error:', JSON.stringify(err, null, 2));
      console.log('[SignIn.Google] error type:', typeof err, err instanceof Error ? err.message : '');

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
              <AppLogo size="md" showTagline />
            </Animated.View>

            {step === 'verify' ? (
              <VerifyStep
                onVerify={onVerify}
                isLoading={verifyLoading}
                error={globalError}
                email={getValues('email')}
              />
            ) : (
              <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.card}>
                <Text style={styles.heading}>Welcome back</Text>
                <Text style={styles.subheading}>Sign in to continue tracking</Text>

                {globalError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>⚠️ {globalError}</Text>
                  </View>
                ) : null}

                <View style={styles.form}>
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
                    placeholder="Enter your password"
                    isPassword
                    returnKeyType="done"
                    textContentType="password"
                    autoComplete="current-password"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                  <TouchableOpacity style={styles.forgotRow} accessibilityRole="link">
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <GradientButton
                  label="Sign In"
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
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/sign-up')}
                    accessibilityRole="link"
                  >
                    <Text style={styles.footerLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
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
    paddingVertical: Spacing.xxl,
    gap: Spacing.xl,
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerLink: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
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
