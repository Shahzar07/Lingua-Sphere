
import React from 'react';
import { SessionConfig } from './types';

export const getSystemInstruction = (config: SessionConfig) => {
  if (config.phase === 'instruction') {
    const accentDetails = config.accentPreference.toLowerCase().includes('australian') 
      ? "Focus on the 'broad' vowels. Instruct the student to lower their jaw significantly more than in General American. For the 'a' in 'day', start with a broad 'i' sound. Detail the 'nasalization' of diphthongs."
      : config.accentPreference.toLowerCase().includes('urdu') || config.accentPreference.toLowerCase().includes('indian')
      ? "Focus on retroflexion. Instruct the student to curl their tongue back to touch the hard palate for 't' and 'd' sounds. Explain the breathy 'aspiration' required for 'dh' and 'bh' sounds."
      : "Focus on the core regional geometry. Describe the exact distance between the tongue and palate for primary vowels.";

    return `ACT AS: The "Linguistic Architect." 
    OBJECTIVE: Teach the fundamentals of the ${config.accentPreference} accent for ${config.language}.
    MANDATE:
    1. PART 1: PHONETIC GEOMETRY (2 Minutes): ${accentDetails}
    2. PART 2: ACCENT DRILLS (SUB-PHASE - CRITICAL): 
       - Explicitly announce: "Now, let us move to the Accent Drills."
       - Select 3 distinct "trap words" or phonemes unique to this accent (e.g. for Australian: 'No' -> 'Naur').
       - For each drill, strictly follow this loop:
         a) EXPLAIN: Describe the mechanics of the mouth shape. 
         b) ISOLATE: Ask the student to produce the sound in isolation.
         c) APPLY: Provide a word containing the sound.
         d) CRITIQUE: Provide immediate, clinical corrective feedback. Do not move on until it is perfect.
    3. STEP-BY-STEP: Break down words into individual phonemes. Ask the student to replicate mouth positions BEFORE speaking.
    4. PROFESSORIAL RIGOR: Every session must feel clinical. Use terminology like 'fricatives', 'plosives', and 'prosody'.
    5. ACCENT: Speak EXCLUSIVELY with a flawless, deep ${config.accentPreference} accent.`;
  }

  if (config.phase === 'practice') {
    return `ACT AS: The "Immersive Partner."
    OBJECTIVE: Engage in high-level academic conversation about ${config.topic}.
    MANDATE:
    1. REPEAT & REFINE: If the student slips back into their native accent, stop them immediately.
    2. USE SLANG: Incorporate regional idioms appropriate to the ${config.accentPreference} accent.
    3. SOCRATIC FEEDBACK: Ask "Does that feel native to you? Try dropping the 't' here."`;
  }

  // Virtual Interviewer / Evaluation Mode
  return `ACT AS: The "Academy Examiner & Virtual Interviewer."
  OBJECTIVE: High-pressure evaluation of the ${config.accentPreference} accent.
  MANDATE:
  1. PHASE 1 (FORMAL): Ask 3 complex questions about ${config.topic}.
  2. PHASE 2 (MOCK INTERVIEW): Once Phase 1 is satisfactory, shift persona to a strict corporate recruiter or local official. Create a high-stakes scenario. 
  3. INTERRUPTIONS: Occasionally interrupt to test if the student can maintain the accent under pressure.
  4. FEEDBACK: Provide a clinical assessment. If they pass, say: "The Evaluation is Satisfied. Advance to the Assessment Quiz."`;
};

export const Icons = {
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Mic: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  Check: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  Award: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Star: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Target: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Brain: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Microphone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v1a7 7 0 01-7 7m0 0a7 7 0 01-7-7v-1m14 0h2m-20 0h2m4 4v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  Speaker: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  Stop: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" /></svg>
};
