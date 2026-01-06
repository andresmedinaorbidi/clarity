"use client";
import React, { useState, useEffect } from "react";

interface SmoothTextProps {
  text: string;
  disabled?: boolean;
}

export default function SmoothText({ text, disabled }: SmoothTextProps) {
  const [displayedText, setDisplayedText] = useState(disabled ? text : "");

  useEffect(() => {
    if (disabled) {
      setDisplayedText(text);
      return;
    }

    if (text.length > displayedText.length) {
      const diff = text.length - displayedText.length;
      
      // If we are way behind (e.g., screen switch or fast stream), 
      // take bigger "bites" of text instead of one letter.
      const jumpSize = diff > 20 ? 5 : 1; 
      const nextChars = text.slice(displayedText.length, displayedText.length + jumpSize);
      
      // Speed up the timer if we are behind
      const timeout = diff > 10 ? 5 : 20;

      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + nextChars);
      }, timeout);
      return () => clearTimeout(timer);
    } 
    else if (text.length < displayedText.length) {
      setDisplayedText(text);
    }
  }, [text, displayedText, disabled]);

  return (
    <span>
        {displayedText}
        {!disabled && text.length > displayedText.length && (
        <span className="inline-block w-1.5 h-3.5 bg-brand-primary ml-1 animate-pulse" />
        )}
    </span>
    );
}