// ============================================================================
// Napar (Steepwise) — Unit Tests: QrScannerModal
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { QrScannerModal } from '../QrScannerModal';
import * as ExpoCamera from 'expo-camera';

describe('QrScannerModal Component (Zadanie N6)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('Zwraca null gdy visible jest false', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <QrScannerModal visible={false} onClose={jest.fn()} onScanRecipe={jest.fn()} />
      );
    });
    expect(tree.toJSON()).toBeNull();
    renderer.act(() => {
      tree.unmount();
    });
  });

  test('Renderuje kamerę gdy uprawnienia są przyznane i wywołuje onClose', () => {
    const onCloseMock = jest.fn();
    const onScanMock = jest.fn();

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <QrScannerModal visible={true} onClose={onCloseMock} onScanRecipe={onScanMock} />
      );
    });

    const closeBtn = tree.root.findByProps({ testID: 'qr-scanner-close-btn' });
    expect(closeBtn).toBeTruthy();

    renderer.act(() => {
      closeBtn.props.onPress();
    });
    expect(onCloseMock).toHaveBeenCalled();

    const camera = tree.root.findByProps({ testID: 'qr-camera-view' });
    expect(camera).toBeTruthy();

    // Symulacja zeskanowania kodu QR
    renderer.act(() => {
      camera.props.onBarcodeScanned({ data: 'napar://recipe?v=1&d=test' });
    });
    expect(onScanMock).toHaveBeenCalledWith('napar://recipe?v=1&d=test');

    renderer.act(() => {
      jest.runAllTimers();
    });
    renderer.act(() => {
      tree.unmount();
    });
  });

  test('Renderuje ekran prośby o uprawnienia gdy brak zgody na aparat', () => {
    const requestPermissionMock = jest.fn();
    (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: false, canAskAgain: true, status: 'undetermined' },
      requestPermissionMock,
      jest.fn(),
    ]);

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <QrScannerModal visible={true} onClose={jest.fn()} onScanRecipe={jest.fn()} />
      );
    });

    const permBtn = tree.root.findByProps({ testID: 'qr-scanner-permission-btn' });
    expect(permBtn).toBeTruthy();

    renderer.act(() => {
      permBtn.props.onPress();
    });
    expect(requestPermissionMock).toHaveBeenCalled();

    renderer.act(() => {
      tree.unmount();
    });
  });

  test('Renderuje skaner w języku angielskim z poprawnymi tekstami', () => {
    (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: false, canAskAgain: true, status: 'undetermined' },
      jest.fn(),
      jest.fn(),
    ]);

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <QrScannerModal visible={true} onClose={jest.fn()} onScanRecipe={jest.fn()} language="en" />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('QR Recipe Scanner');
    expect(str).toContain('Camera Access Required');
    expect(str).toContain('Allow Camera Access');
    expect(str).toContain('Cancel');

    renderer.act(() => {
      tree.unmount();
    });
  });

  test('TASK-P15-09-LOK: QrScannerModal używa zlokalizowanych tekstów ze słownika t', () => {
    (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true, canAskAgain: true, status: 'granted' },
      jest.fn(),
      jest.fn(),
    ]);

    const mockT = {
      brew: {
        qrScannerTitle: 'Skaner Receptur Specjalistycznych',
        scanHint: 'Wyceluj obiektyw w kod QR receptury',
      },
    };

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <QrScannerModal
          visible={true}
          onClose={jest.fn()}
          onScanRecipe={jest.fn()}
          t={mockT}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Skaner Receptur Specjalistycznych');
    expect(str).toContain('Wyceluj obiektyw w kod QR receptury');

    renderer.act(() => {
      tree.unmount();
    });
  });
});
