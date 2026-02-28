import React from "react";
import SessionPage from "../components/session/SessionPage";

const BEGINNER_CONTEXT =
  "The user has selected the Beginner Track from the app menu. " +
  "Transfer them to the beginner_agent immediately and begin a structured " +
  "beginner Spanish lesson. Do NOT ask what they want to do — they have " +
  "already chosen the beginner track. Start teaching right away.";

const LearnPage: React.FC = () => (
  <SessionPage
    title="Beginner Track"
    subtitle="Structured lessons — just follow along and speak"
    systemContext={BEGINNER_CONTEXT}
  >
    <div className="learn-info">
      <p>
        No course content has been published yet. The agent will guide you
        through a general beginner introduction. Structured lessons are coming
        soon!
      </p>
    </div>
  </SessionPage>
);

export default LearnPage;
