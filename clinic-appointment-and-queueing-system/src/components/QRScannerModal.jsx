import React, { useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import { Html5QrcodeScanner } from "html5-qrcode";

/**
 * QRScannerModal Component
 * Staff camera scanner for patient check-in QR codes (FR-09).
 */
export default function QRScannerModal({ show, onHide, onScanSuccess }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onScanSuccess(decodedText);
          onHide();
        },
        (error) => {
          // Scanner read errors are standard while scanning for frames; ignore
        }
      );

      scannerRef.current = scanner;
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          // Ignore scanner cleanup errors
        }
      }
    };
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Scan Patient QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="qr-reader-container" style={{ width: "100%" }}></div>
        <p className="text-center text-muted small mt-2">
          Point the camera at the patient's appointment QR code.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
