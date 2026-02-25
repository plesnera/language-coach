/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Routes, Route } from "react-router-dom";
import RootPage from "./pages/RootPage";
import DebugPage from "./pages/DebugPage";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";

const isDevelopment = process.env.NODE_ENV === 'development';
// In development mode (frontend on :8501), connect to backend on :8000
const defaultHost = isDevelopment ? `${window.location.hostname}:8000` : window.location.host;
const defaultUri = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${defaultHost}/`;

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={
          <LiveAPIProvider url={defaultUri} userId="user1">
            <RootPage />
          </LiveAPIProvider>
        } />
        {isDevelopment && <Route path="/debug" element={<DebugPage />} />}
      </Routes>
    </>
  );
}

export default App;
