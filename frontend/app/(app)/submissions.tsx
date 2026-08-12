import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEAL_SUBMISSION_ICON, RESTAURANT_SUBMISSION_ICON } from '../../assets/foodCharacters';
import { DealSubmissionForm } from '../../components/DealSubmissionForm';
import { FadeInView } from '../../components/FadeInView';
import { RestaurantSubmissionForm } from '../../components/RestaurantSubmissionForm';
import { SubmissionChoiceCard } from '../../components/SubmissionChoiceCard';
import { TopNav } from '../../components/TopNav';
import { colors, fonts, spacing } from '../../theme/theme';

type Mode = 'choose' | 'deal' | 'restaurant';

export default function Submissions() {
  const [mode, setMode] = useState<Mode>('choose');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navWrap}>
        <TopNav />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {mode === 'choose' ? (
            <>
              <FadeInView delay={40}>
                <Text style={styles.title}>Help the community</Text>
                <Text style={styles.sub}>
                  Found a deal or a spot we're missing? Add it — pick what you want to submit.
                </Text>
              </FadeInView>

              <View style={styles.choices}>
                <SubmissionChoiceCard
                  icon={DEAL_SUBMISSION_ICON}
                  title="Submit a deal"
                  subtitle="Share a deal at a restaurant on the app"
                  onPress={() => setMode('deal')}
                  delay={120}
                />
                <SubmissionChoiceCard
                  icon={RESTAURANT_SUBMISSION_ICON}
                  title="Add a restaurant"
                  subtitle="Put a new spot on the map"
                  onPress={() => setMode('restaurant')}
                  delay={200}
                />
              </View>
            </>
          ) : (
            // Keyed by mode so the form re-animates in on each switch.
            <FadeInView key={mode}>
              <Pressable
                onPress={() => setMode('choose')}
                style={styles.back}
                accessibilityRole="button"
                accessibilityLabel="Back to submission choices"
              >
                <Text style={styles.backText}>‹ Back</Text>
              </Pressable>
              <Text style={styles.formTitle}>
                {mode === 'deal' ? 'Submit a deal' : 'Add a restaurant'}
              </Text>
              {mode === 'deal' ? (
                <DealSubmissionForm onAddRestaurant={() => setMode('restaurant')} />
              ) : (
                <RestaurantSubmissionForm />
              )}
            </FadeInView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  navWrap: { paddingHorizontal: spacing.xl },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 21,
  },
  choices: { gap: spacing.lg },
  back: { marginBottom: spacing.sm },
  backText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.tomato },
  formTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginBottom: spacing.lg },
});
