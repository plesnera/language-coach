import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import AudioController from "../audio-controller/AudioController";
import "./SessionPage.scss";

export interface SessionPageProps {
  /** Title shown in the header bar */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Extra content rendered above the audio controls (e.g. lesson info, topic card) */
  children?: React.ReactNode;
}

const SessionPage: React.FC<SessionPageProps> = ({
  title,
  subtitle,
  children,
}) => {
  const [isTalking, setIsTalking] = useState(false);
  const { connect } = useLiveAPIContext();
  const navigate = useNavigate();
  const initialConnectDone = useRef(false);

  useEffect(() => {
    if (!initialConnectDone.current) {
      initialConnectDone.current = true;
      connect();
    }
  }, [connect]);

  return (
    <div className="session-page">
      <header className="session-header">
        <button className="back-button" onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="session-header-text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      {children && <div className="session-content">{children}</div>}

      <div className="session-controls">
        <AudioController isTalking={isTalking} onTalkStateChange={setIsTalking} />
      </div>
    </div>
  );
};

export default SessionPage;
