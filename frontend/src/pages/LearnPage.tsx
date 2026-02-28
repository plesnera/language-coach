import React from "react";
import SessionPage from "../components/session/SessionPage";

const LearnPage: React.FC = () => (
  <SessionPage
    title="Beginner Track"
    subtitle="Structured lessons — just follow along and speak"
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
