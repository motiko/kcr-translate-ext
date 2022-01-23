import Frame from "react-frame-component";
import React from "react";

interface IProgressIFrameProps {
  progress: number;
  error?: string;
  show: boolean;
}

const ProgressIFrame: React.FC<IProgressIFrameProps> = ({ show, progress, error = "" }) => {
  return (
    <Frame
      style={{
        border: "none",
        width: "15vw",
        height: "5vh",
        position: "fixed",
        right: "1em",
        bottom: "1em",
        zIndex: 99999,
        display: show ? "block" : "none",
      }}
    >
      <progress
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "100%",
          height: "100%",
        }}
        max="100"
        value={progress}
      >
        {progress}%
      </progress>
      <p
        style={{
          backgroundColor: "transparent",
          color: "red",
        }}
        hidden={!error}
      >
        {error}
      </p>
    </Frame>
  );
};

export default ProgressIFrame;
