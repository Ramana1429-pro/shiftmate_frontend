import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Text } from './Text';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn>(async () => false);

/** Promise-based confirm dialog that looks the same on every platform (Alert.alert does nothing on web). */
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (o) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOptions(o);
      }),
    [],
  );

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <BottomSheet visible={!!options} onClose={() => close(false)} title={options?.title ?? ''}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <Text muted>{options?.message}</Text>
          <Button
            testID="confirm-yes"
            title={options?.confirmLabel ?? 'Confirm'}
            variant={options?.destructive ? 'danger' : 'primary'}
            onPress={() => close(true)}
          />
          <Button testID="confirm-no" title={options?.cancelLabel ?? 'Keep it'} variant="outline" onPress={() => close(false)} />
        </View>
      </BottomSheet>
    </ConfirmContext.Provider>
  );
}
