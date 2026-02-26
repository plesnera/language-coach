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

import React, { useState, useEffect, useRef } from 'react';
import '../styles/RootPage.scss';
import AudioController from '../components/audio-controller/AudioController';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';

const RootPage: React.FC = () => {
  const [isTalking, setIsTalking] = useState(false);
  const { connect } = useLiveAPIContext();
  const initialConnectDone = useRef(false);

  useEffect(() => {
    if (!initialConnectDone.current) {
      initialConnectDone.current = true;
      connect();
    }
  }, [connect]);

  return (
    <div className="root-page">
      <div className="talk-button-container">
        <AudioController isTalking={isTalking} onTalkStateChange={setIsTalking} />
      </div>
    </div>
  );
};

export default RootPage;
