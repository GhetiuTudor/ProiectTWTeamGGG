import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeDisplay = ({ value, label }) => {
    return (
        <div className="qr-container">
            <QRCodeCanvas value={value} size={200} />
            {label && <div className="access-code-display">{label}</div>}
        </div>
    );
};

export default QRCodeDisplay;
