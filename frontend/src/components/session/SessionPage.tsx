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
  /**
   * Context message sent to the agent after the session is established.
   * Tells the agent which mode / lesson the user selected so it can start
   * the conversation immediately instead of asking what the user wants.
   */
  systemContext?: string;
}

const SessionPage: React.FC<SessionPageProps> = ({
  title,
  subtitle,
  children,
  systemContext,
}) => {
  const [isTalking, setIsTalking] = useState(false);
  const { client, connected, connect } = useLiveAPIContext();
  const navigate = useNavigate();
  const initialConnectDone = useRef(false);
  const contextSent = useRef(false);

  useEffect(() => {
    if (!initialConnectDone.current) {
      initialConnectDone.current = true;
      connect();
    }
  }, [connect]);

  // Send context to the agent once the session is ready.
  // For async pages (e.g. TopicSessionPage) systemContext may arrive
  // after the connection is already established, so we watch both.
  useEffect(() => {
    if (connected && systemContext && !contextSent.current) {
      contextSent.current = true;
      client.send([{ text: systemContext }]);
    }
  }, [connected, systemContext, client]);

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
