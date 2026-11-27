import React from "react";
import { Spinner } from "react-bootstrap";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" variant="primary" role="status" />
      <span className="mt-2 text-muted">{message}</span>
    </div>
  );
}
