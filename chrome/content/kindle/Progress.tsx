import React from "react";

interface IProgressProps {
  progress: number;
  error?: string;
  show: boolean;
}

const Progress: React.FC<IProgressProps> = ({ show, progress, error = "" }) => {
  return (
    <div
      data-cy="kcrt-progress-container"
      style={{
        border: "none",
        width: "15vw",
        height: "5vh",
        position: "fixed",
        right: "1em",
        bottom: "1em",
        zIndex: 99999,
      }}
      hidden={!show}
    >
      <progress
        data-cy="kcrt-progress"
        style={{
          width: "100%",
          height: "100%",
        }}
        max="100"
        value={progress}
        hidden={!!error}
      >
        {progress}%
      </progress>
      <p
        data-cy="kcrt-progress-error"
        style={{
          backgroundColor: "transparent",
          color: "red",
        }}
        hidden={!error}
      >
        {error}
      </p>
    </div>
  );
};

export default React.memo(Progress);
