import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { authApi } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

export default function Verify2FAScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { signIn } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, idx: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    const updated = [...code];
    updated[idx] = clean;
    setCode(updated);
    if (clean && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Entrez le code à 6 chiffres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.verify2fa(Number(userId), fullCode);
      await signIn(token, user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Double authentification</Text>
        <Text style={styles.subtitle}>
          Un code de vérification a été envoyé à votre adresse email.
        </Text>

        {error ? <Text style={styles.errorBox}>{error}</Text> : null}

        <View style={styles.otpRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { inputs.current[idx] = r; }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(val) => handleChange(val, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Confirmer</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = '#0a7ea4';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 24,
  },
  backText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    lineHeight: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    backgroundColor: '#fafafa',
  },
  otpInputFilled: {
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}10`,
  },
  btn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#fcc',
    borderRadius: 8,
    padding: 12,
    color: '#c00',
    fontSize: 13,
    marginBottom: 16,
  },
});
