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

import { memo, useState, useEffect } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { AudioRecorder } from "../../utils/audio-recorder";
import cn from "classnames";

export type AudioControllerProps = {
  isTalking: boolean;
  onTalkStateChange: (isTalking: boolean) => void;
};

function AudioController({ isTalking, onTalkStateChange }: AudioControllerProps) {
  const { connected, client, connect, disconnect } = useLiveAPIContext();
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted) {
      audioRecorder.on("data", onData).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData);
    };
  }, [connected, client, muted, audioRecorder]);

  const handleToggleTalk = () => {
    if (isTalking) {
      disconnect();
      setMuted(true);
      onTalkStateChange(false);
    } else {
      connect();
      setMuted(false);
      onTalkStateChange(true);
    }
  };

  return (
    <button
      className={cn("talk-button", { active: isTalking })}
      onClick={handleToggleTalk}
    >
      <span className="material-symbols-outlined filled">
        {isTalking ? "mic_off" : "mic"}
      </span>
    </button>
  );
}

export default memo(AudioController);
