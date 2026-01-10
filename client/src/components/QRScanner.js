import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onClose }) => {
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            // Handle the scanned code as you like, for example:
            setScanResult(decodedText);
            scanner.clear();
            onScan(decodedText);
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
        }

        return () => {
            scanner.clear().catch(error => {
                // Failed to clear scanner. 
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [onScan]);

    return (
        <div className="card">
            <h3>Scan QR Code</h3>
            <div id="reader"></div>
            {scanResult && <p className="success-msg">Scanned: {scanResult}</p>}
            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '10px' }}>
                Close
            </button>
        </div>
    );
};

export default QRScanner;
