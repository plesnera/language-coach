import React from "react";
import SessionPage from "../components/session/SessionPage";

const FREESTYLE_CONTEXT =
  "The user has selected Free Talk mode from the app menu. " +
  "Transfer them to the freestyle_agent immediately and start an open-ended " +
  "Spanish conversation. Do NOT ask what they want to do — they have " +
  "already chosen free talk. Jump right in.";

const TalkPage: React.FC = () => (
  <SessionPage
    title="Free Talk"
    subtitle="Open conversation — speak about anything you like"
    systemContext={FREESTYLE_CONTEXT}
  />
);

export default TalkPage;
