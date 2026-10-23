import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { colors } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

/** Full-screen QR scanner. Calls onScanned once with the QR text, then closes. */
export function QrScanner({ visible, onClose, onScanned }: { visible: boolean; onClose: () => void; onScanned: (value: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => (handled.current = false)}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (handled.current) return;
              handled.current = true;
              onScanned(data);
            }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
            <Text color={colors.white} center>
              Camera access is needed to scan the venue QR code.
            </Text>
            <Button title="Allow camera" onPress={requestPermission} />
          </View>
        )}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: colors.white, opacity: 0.8 }} />
          <Text color={colors.white} style={{ marginTop: 16 }}>
            Point at the QR code at the venue
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Close scanner" style={{ position: 'absolute', top: 56, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <X size={24} color={colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}
