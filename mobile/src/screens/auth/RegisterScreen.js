import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  RadioButton,
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student fields
    university: '',
    major: '',
    year: '',
    age: '',
    // Counsellor fields
    specialization: '',
    experience: '',
    qualifications: '',
    languages: ['English'],
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert(t('common.error'), 'Please enter your full name');
      return false;
    }
    
    if (!formData.email.trim()) {
      Alert.alert(t('common.error'), 'Please enter your email address');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      Alert.alert(t('common.error'), 'Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return false;
    }

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.university.trim()) {
        Alert.alert(t('common.error'), 'Please enter your university');
        return false;
      }
    } else if (formData.role === 'counsellor') {
      if (!formData.specialization.trim()) {
        Alert.alert(t('common.error'), 'Please enter your specialization');
        return false;
      }
      if (!formData.experience.trim()) {
        Alert.alert(t('common.error'), 'Please enter your experience');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        ...formData,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(q => q),
      };

      await register(formData.email.trim(), formData.password, userData);
      
      if (formData.role === 'counsellor') {
        Alert.alert(
          'Registration Successful',
          'Your counsellor account has been created and is pending approval. You will be notified once approved.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert(
          'Registration Successful',
          'Your student account has been created successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addLanguage = (language) => {
    if (!formData.languages.includes(language)) {
      updateFormData('languages', [...formData.languages, language]);
    }
  };

  const removeLanguage = (language) => {
    updateFormData('languages', formData.languages.filter(l => l !== language));
  };

  const availableLanguages = ['English', 'Spanish', 'French', 'German', 'Telugu', 'Hindi', 'Tamil'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌸</Text>
          <Title style={[styles.title, { color: theme.colors.primary }]}>
            Join ZenCare
          </Title>
          <Paragraph style={[styles.subtitle, { color: theme.colors.text }]}>
            Create your wellness account
          </Paragraph>
        </View>

        {/* Registration Form */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: theme.colors.primary, textAlign: 'center', marginBottom: 20 }}>
              {t('auth.register')}
            </Title>

            {/* Role Selection */}
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {t('auth.selectRole')}
            </Text>
            <View style={styles.roleContainer}>
              <View style={styles.roleOption}>
                <RadioButton
                  value="student"
                  status={formData.role === 'student' ? 'checked' : 'unchecked'}
                  onPress={() => updateFormData('role', 'student')}
                  color={theme.colors.primary}
                />
                <Text style={{ color: theme.colors.text }}>{t('auth.student')}</Text>
              </View>
              <View style={styles.roleOption}>
                <RadioButton
                  value="counsellor"
                  status={formData.role === 'counsellor' ? 'checked' : 'unchecked'}
                  onPress={() => updateFormData('role', 'counsellor')}
                  color={theme.colors.primary}
                />
                <Text style={{ color: theme.colors.text }}>{t('auth.counsellor')}</Text>
              </View>
            </View>

            <Divider style={{ marginVertical: 16 }} />

            {/* Basic Information */}
            <TextInput
              label={t('auth.fullName')}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label={t('auth.email')}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label={t('auth.password')}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label={t('auth.confirmPassword')}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            {/* Role-specific fields */}
            {formData.role === 'student' && (
              <>
                <Divider style={{ marginVertical: 16 }} />
                <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                  Student Information
                </Text>
                
                <TextInput
                  label="University/College"
                  value={formData.university}
                  onChangeText={(value) => updateFormData('university', value)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="school" />}
                />

                <TextInput
                  label="Major/Field of Study"
                  value={formData.major}
                  onChangeText={(value) => updateFormData('major', value)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="book-open" />}
                />

                <TextInput
                  label="Year of Study"
                  value={formData.year}
                  onChangeText={(value) => updateFormData('year', value)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="calendar" />}
                />

                <TextInput
                  label="Age"
                  value={formData.age}
                  onChangeText={(value) => updateFormData('age', value)}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  left={<TextInput.Icon icon="account-clock" />}
                />
              </>
            )}

            {formData.role === 'counsellor' && (
              <>
                <Divider style={{ marginVertical: 16 }} />
                <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                  Professional Information
                </Text>
                
                <TextInput
                  label="Specialization"
                  value={formData.specialization}
                  onChangeText={(value) => updateFormData('specialization', value)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="brain" />}
                  placeholder="e.g., Clinical Psychology, Counseling Psychology"
                />

                <TextInput
                  label="Years of Experience"
                  value={formData.experience}
                  onChangeText={(value) => updateFormData('experience', value)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="clock-outline" />}
                  placeholder="e.g., 5 years"
                />

                <TextInput
                  label="Qualifications (comma-separated)"
                  value={formData.qualifications}
                  onChangeText={(value) => updateFormData('qualifications', value)}
                  mode="outlined"
                  multiline
                  style={styles.input}
                  left={<TextInput.Icon icon="certificate" />}
                  placeholder="e.g., PhD in Psychology, Licensed Therapist"
                />

                <Text style={[styles.label, { color: theme.colors.text, marginTop: 16 }]}>
                  Languages Spoken
                </Text>
                <View style={styles.languageContainer}>
                  {formData.languages.map((language) => (
                    <Chip
                      key={language}
                      onClose={() => removeLanguage(language)}
                      style={styles.languageChip}
                    >
                      {language}
                    </Chip>
                  ))}
                </View>
                <View style={styles.availableLanguages}>
                  {availableLanguages
                    .filter(lang => !formData.languages.includes(lang))
                    .map((language) => (
                      <Chip
                        key={language}
                        onPress={() => addLanguage(language)}
                        mode="outlined"
                        style={styles.availableLanguageChip}
                      >
                        + {language}
                      </Chip>
                    ))}
                </View>

                <View style={styles.approvalNotice}>
                  <MaterialCommunityIcons
                    name="information"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.approvalText, { color: theme.colors.text }]}>
                    Counsellor accounts require admin approval before activation.
                  </Text>
                </View>
              </>
            )}

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              {t('auth.signUp')}
            </Button>

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Text style={{ color: theme.colors.text }}>
                {t('auth.alreadyHaveAccount')}
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                compact
              >
                {t('auth.signIn')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  languageChip: {
    margin: 2,
  },
  availableLanguages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  availableLanguageChip: {
    margin: 2,
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  approvalText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});