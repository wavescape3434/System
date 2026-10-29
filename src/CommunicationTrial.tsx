import { useEffect, useRef, useState } from "react";
export default function CommunicationTrial({
  seconds,
  criteria,
}: {
  seconds: number;
  criteria: string[];
}) {
  const [left, setLeft] = useState(seconds),
    [running, setRunning] = useState(false),
    [recording, setRecording] = useState(false),
    [url, setUrl] = useState(""),
    [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    audioUrl = useRef(""),
    alive = useRef(true);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () =>
        setLeft((n) => {
          if (n <= 1) {
            setRunning(false);
            return 0;
          }
          return n - 1;
        }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!recording) return;
    const limit = window.setTimeout(
      () => {
        if (recorder.current?.state === "recording") recorder.current.stop();
        setRecording(false);
      },
      (seconds + 30) * 1000,
    );
    return () => window.clearTimeout(limit);
  }, [recording, seconds]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    };
  }, []);
  const record = async () => {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const next = new MediaRecorder(media),
        chunks: BlobPart[] = [];
      next.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      next.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        if (!alive.current) return;
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = URL.createObjectURL(
          new Blob(chunks, { type: next.mimeType }),
        );
        setUrl(audioUrl.current);
      };
      recorder.current = next;
      next.start();
      setRecording(true);
      setError("");
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(
        "Microphone unavailable. Practice aloud and review the criteria without recording.",
      );
    }
  };
  return (
    <div className="communication-trial">
      <ul>
        {criteria.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p>
        Practice timer: {Math.floor(left / 60)}:
        {String(left % 60).padStart(2, "0")}
      </p>
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          if (!left) setLeft(seconds);
          setRunning(!running);
        }}
      >
        {running ? "Pause timer" : left === 0 ? "Repeat timer" : "Start timer"}
      </button>
      {typeof MediaRecorder !== "undefined" &&
        typeof navigator.mediaDevices?.getUserMedia === "function" && (
          <button type="button" className="button secondary" onClick={record}>
            {recording ? "Stop recording" : "Record practice (optional)"}
          </button>
        )}
      {url && <audio aria-label="Practice playback" controls src={url} />}
      {error && <p role="status">{error}</p>}
      <p>Rate the exercise below after you finish.</p>
    </div>
  );
}
