import os
import json
from pathlib import Path

from types import SimpleNamespace
from typing import List, Dict, Optional
import logging
from datetime import datetime

"""
Enhanced batch transcription utility with error recovery and speaker diarization.

Features:
- Processes audio files with speaker diarization (identifies who is speaking)
- Tracks progress and recovers from failures
- Maintains a processing log to resume from where it left off
- Formats output with speaker labels and timestamps

Environment variables:
  MISTRAL_API_KEY       Required. API key for Mistral AI.
  TRANSCRIBE_SOURCE_DIR Input directory (default: .../language_transfer_spanish/test)
  TRANSCRIBE_OUTPUT_DIR Output directory (default: .../language_transfer_spanish/transcriptions)
  TRANSCRIBE_LANGUAGE   ISO language code (default: en)

MISTRAL was chosen over Google due to the lack of diarize feature and excessive
-costs - Mistral 0.004 versus Google 0.013
"""

logger = logging.getLogger(__name__)

# Configuration defaults — override via env vars
model = "voxtral-mini-latest"
source_file_directory: Path = Path(
    os.environ.get("TRANSCRIBE_SOURCE_DIR", "/Users/anton.plesner/IdeaProjects/data/language_transfer_spanish/test")
)
transcription_file_directory: Path = Path(
    os.environ.get("TRANSCRIBE_OUTPUT_DIR", "/Users/anton.plesner/IdeaProjects/data/language_transfer_spanish/transcriptions")
)
progress_file: Path = transcription_file_directory / ".progress.json"

class ProcessingState:
    """Track processing state for error recovery"""
    def __init__(self):
        self.processed_files: List[str] = []
        self.failed_files: List[str] = []
        self.start_time = datetime.now().isoformat()
        
    def save(self):
        """Save progress to file"""
        with open(progress_file, 'w') as f:
            json.dump({
                'processed_files': self.processed_files,
                'failed_files': self.failed_files,
                'start_time': self.start_time,
                'last_updated': datetime.now().isoformat()
            }, f, indent=2)
    
    def load(self):
        """Load progress from file if it exists"""
        if progress_file.exists():
            with open(progress_file, 'r') as f:
                data = json.load(f)
                self.processed_files = data.get('processed_files', [])
                self.failed_files = data.get('failed_files', [])
                logger.info(f"Resuming from previous state: {len(self.processed_files)} files processed, {len(self.failed_files)} failed")
    
    def mark_processed(self, filename: str):
        """Mark a file as successfully processed"""
        self.processed_files.append(filename)
        self.save()
        
    def mark_failed(self, filename: str):
        """Mark a file as failed"""
        self.failed_files.append(filename)
        self.save()

def extract_name(filename: str) -> Path:
    """Extract a clean name from the filename"""
    name_elements = filename.split()
    if len(name_elements) > 2:
        name_ending = "".join(name_elements[-2:])
        name_ending = name_ending.replace(".mp3", "")
    else:
        name_ending = filename.replace(".mp3", "")
    return Path(name_ending).with_suffix(".txt")

def format_transcription_with_speakers(transcription_response) -> str:
    """Format transcription with speaker labels and timestamps"""
    if not transcription_response.segments:
        return transcription_response.text
    
    formatted_lines = []
    current_speaker = None
    
    for segment in transcription_response.segments:
        speaker_id = segment.speaker_id if segment.speaker_id else "Unknown"
        start_time = f"{segment.start:.1f}s"
        end_time = f"{segment.end:.1f}s"
        
        # Format speaker change
        if speaker_id != current_speaker:
            if current_speaker is not None:
                formatted_lines.append("")  # Add blank line between speakers
            formatted_lines.append(f"[{start_time}-{end_time}] Speaker {speaker_id}:")
            current_speaker = speaker_id
        
        # Add the text
        formatted_lines.append(f"  {segment.text.strip()}")
    
    return "\n".join(formatted_lines)

def write_to_file(transcription_response, filename: str):
    """Write transcription to file with proper formatting"""
    target_filename = extract_name(filename)
    target_file = transcription_file_directory.joinpath(target_filename)
    
    formatted_text = format_transcription_with_speakers(transcription_response)
    
    try:
        with open(target_file, 'w') as output_file:
            output_file.write(formatted_text)
        logger.info(f"Successfully wrote transcription to {target_file}")
        return True
    except Exception as e:
        logger.error(f"Failed to write to {target_file}: {e}")
        return False

def produce_transcription(
    client, filename: Path, *, language: str = "en"
) -> Optional[object]:
    """Produce transcription with error handling and speaker diarization."""
    try:
        with open(filename, "rb") as f:
            transcription_response = client.audio.transcriptions.complete(
                model=model,
                file={
                    "content": f,
                    "file_name": filename.name,
                },
                language=language,
                diarize=True,  # Enable speaker diarization
                timestamp_granularities=["segment"],  # Get segment-level timestamps
            )
        logger.info(f"Successfully transcribed {filename.name} ({language})")
        return transcription_response
    except Exception as e:
        logger.error(f"Failed to transcribe {filename.name}: {e}")
        return None

def get_audio_files(directory: Path) -> List[str]:
    """Get list of audio files to process"""
    audio_extensions = ['.mp3', '.wav', '.ogg', '.m4a']
    return [
        f for f in os.listdir(directory)
        if any(f.lower().endswith(ext) for ext in audio_extensions)
    ]

def main():
    """Main processing loop with error recovery"""
    logging.basicConfig(level=logging.INFO)

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        logger.error("MISTRAL_API_KEY environment variable is required")
        raise SystemExit(1)

    transcription_file_directory.mkdir(parents=True, exist_ok=True)

    from mistralai import Mistral
    client = Mistral(api_key=api_key)

    language = os.environ.get("TRANSCRIBE_LANGUAGE", "en")

    state = ProcessingState()
    state.load()

    audio_files = get_audio_files(source_file_directory)
    total_files = len(audio_files)

    logger.info(f"Found {total_files} audio files to process")
    logger.info(f"Already processed: {len(state.processed_files)}")
    logger.info(f"Previously failed: {len(state.failed_files)}")
    logger.info(f"Transcription language: {language}")

    processed_count = 0
    failed_count = 0

    for filename in audio_files:
        if filename in state.processed_files:
            logger.info(f"Skipping already processed file: {filename}")
            continue

        if filename in state.failed_files:
            logger.warning(f"Retrying previously failed file: {filename}")
            state.failed_files.remove(filename)

        logger.info(f"Processing {filename} ({processed_count + 1}/{total_files})...")

        try:
            transcription = produce_transcription(
                client, source_file_directory.joinpath(filename), language=language
            )

            if transcription:
                success = write_to_file(transcription, filename)
                if success:
                    state.mark_processed(filename)
                    processed_count += 1
                    logger.info(f"Progress: {processed_count}/{total_files} files processed successfully")
                else:
                    state.mark_failed(filename)
                    failed_count += 1
                    logger.error(f"Failed to write transcription for {filename}")
            else:
                state.mark_failed(filename)
                failed_count += 1

        except Exception as e:
            state.mark_failed(filename)
            failed_count += 1
            logger.error(f"Unexpected error processing {filename}: {e}")

    # Summary
    logger.info("\n" + "="*50)
    logger.info("PROCESSING COMPLETE")
    logger.info("="*50)
    logger.info(f"Total files: {total_files}")
    logger.info(f"Successfully processed: {processed_count}")
    logger.info(f"Failed: {failed_count}")
    logger.info(f"Already processed: {len(state.processed_files) - processed_count}")
    logger.info(f"Total processed in this run: {processed_count}")

    if failed_count > 0:
        logger.warning(f"Failed files: {', '.join(state.failed_files[-failed_count:])}")
        logger.info("You can retry failed files by running this script again.")

if __name__ == "__main__":
    main()
