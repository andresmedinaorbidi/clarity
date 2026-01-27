import { useState, useEffect, useRef } from "react";

const PLACEHOLDER_PROMPTS = [
  "A coffee shop in Barcelona with strong Instagram presence…",
  "A personal trainer with Google reviews and no website…",
  "A SaaS startup with a waitlist and Twitter following…",
  "A dentist clinic with Google Maps reviews…",
];

const TYPING_SPEED = 50; // milliseconds per character
const DELETING_SPEED = 30; // milliseconds per character
const PAUSE_DURATION = 2000; // pause at full sentence
const DELETE_PAUSE = 500; // pause before deleting

export function useTypingPlaceholder(isActive: boolean = true) {
  const [displayText, setDisplayText] = useState("");
  const currentPromptIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  const isTypingRef = useRef(true);
  const isActiveRef = useRef(isActive);

  // Update ref when isActive changes
  useEffect(() => {
    isActiveRef.current = isActive;
    if (!isActive) {
      setDisplayText("");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActiveRef.current) return;

    const currentPrompt = PLACEHOLDER_PROMPTS[currentPromptIndexRef.current];

    const type = () => {
      if (!isActiveRef.current) return;
      
      if (currentIndexRef.current < currentPrompt.length) {
        setDisplayText(currentPrompt.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        timeoutRef.current = setTimeout(type, TYPING_SPEED);
      } else {
        // Finished typing, pause then delete
        timeoutRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            isTypingRef.current = false;
            deleteText();
          }
        }, PAUSE_DURATION);
      }
    };

    const deleteText = () => {
      if (!isActiveRef.current) return;
      
      if (currentIndexRef.current > 0) {
        setDisplayText(currentPrompt.slice(0, currentIndexRef.current - 1));
        currentIndexRef.current--;
        timeoutRef.current = setTimeout(deleteText, DELETING_SPEED);
      } else {
        // Finished deleting, move to next prompt
        isTypingRef.current = true;
        currentPromptIndexRef.current = (currentPromptIndexRef.current + 1) % PLACEHOLDER_PROMPTS.length;
        timeoutRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            currentIndexRef.current = 0;
            setDisplayText("");
            type();
          }
        }, DELETE_PAUSE);
      }
    };

    // Start typing cycle
    currentIndexRef.current = 0;
    setDisplayText("");
    type();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive]); // Only depend on isActive

  return displayText;
}
