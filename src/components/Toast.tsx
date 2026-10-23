import { CheckCircle2, XCircle } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '../theme';
import { Text } from './Text';

type ToastKind = 'success' | 'error';
const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, kind });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: false }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => setToast(null));
      }, 2800);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 84, opacity, alignItems: 'center' }}
        >
          <View
            testID="toast"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.text,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 14,
              maxWidth: 420,
              ...shadow.raised,
            }}
          >
            {toast.kind === 'success' ? <CheckCircle2 size={18} color={colors.success} /> : <XCircle size={18} color="#FCA5A5" />}
            <Text variant="small" color={colors.white} style={{ flexShrink: 1 }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
