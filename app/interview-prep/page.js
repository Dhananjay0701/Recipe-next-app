"use client";

import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';

export default function InterviewPrep() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { role: 'coach', content: 'Hello! I\'m your interview coach. To get started, please upload your resume and click the microphone button to begin answering questions.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeFilePath, setResumeFilePath] = useState('');
  const [resumeBase64, setResumeBase64] = useState('');
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && !navigator.mediaDevices) {
      setError('Your browser doesn\'t support audio recording capabilities.');
    }
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (err) {
      setError('Please enable microphone access to continue.');
      return null;
    }
  };

  const handleRecordClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const stream = await requestMicrophonePermission();
      if (!stream) return;
      
      setError('');
      setIsRecording(true);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      console.log('Media Recorder started');
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio Blob created:', audioBlob);
        console.log('Audio Blob size:', audioBlob.size);

        // Optionally, offer a download link for debugging
        // const url = URL.createObjectURL(audioBlob);
        // const a = document.createElement('a');
        // a.style.display = 'none';
        // a.href = url;
        // a.download = 'recorded_audio.webm';
        // document.body.appendChild(a);
        // a.click();
        // window.URL.revokeObjectURL(url);
        
        if (audioBlob.size === 0) {
          setError('Recording failed: No audio data captured.');
          setIsRecording(false);
          return;
        }
        
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await fetch('/api/interview-prep/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Transcription failed');
      
      const data = await response.json();
      setTranscript(data.transcript);
      
      // Add user message to chat
      const updatedMessages = [
        ...messages,
        { role: 'user', content: data.transcript }
      ];
      setMessages(updatedMessages);
      
      // Get coach response
      await getChatResponse(data.transcript, updatedMessages);
      
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const getChatResponse = async (userTranscript, updatedMessages) => {
    try {
      setLoading(true);
      
      const history = updatedMessages.map(msg => `${msg.role === 'coach' ? 'Coach' : 'You'}: ${msg.content}`).join('\n');
      
      const response = await fetch('/api/interview-prep/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: userTranscript,
          resumeFilePath,
          resumeBase64,
          history,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get coach response');
      
      const data = await response.json();
      
      // Add coach message to chat
      setMessages([
        ...updatedMessages,
        { role: 'coach', content: data.message }
      ]);
      
    } catch (err) {
      setError('Failed to get interview coach response. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type and size
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('File size should be less than 5MB.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setResume(file);
      
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/interview-prep/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Resume upload failed');
      
      const data = await response.json();
      
      // Store the file path and base64 data for later use with Gemini
      setResumeFilePath(data.filePath || '');
      setResumeBase64(data.base64Pdf || '');
      
      // Add a confirmation message
      setMessages([
        ...messages,
        { role: 'coach', content: 'Resume uploaded successfully! I\'ll use this information to tailor the interview questions. Click the microphone to begin the interview.' }
      ]);
      
    } catch (err) {
      setError('Failed to upload resume. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mock Interview Practice</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.uploadContainer}>
        <label className={styles.uploadButton}>
          {resume ? 'Resume Uploaded ✓' : 'Upload Resume (PDF)'}
          <input
            type="file"
            accept=".pdf"
            onChange={handleResumeUpload}
            style={{ display: 'none' }}
          />
        </label>
        {resume && <span className={styles.fileName}>{resume.name}</span>}
      </div>
      
      <div className={styles.chatContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.role === 'coach' ? styles.coachMessage : styles.userMessage
            }`}
          >
            {message.content}
          </div>
        ))}
        
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>
      
      <button
        className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
        onClick={handleRecordClick}
        disabled={loading}
      >
        {isRecording ? '⏹️' : '🎤'}
      </button>
    </div>
  );
}
