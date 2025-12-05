import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black ${className}`}
    />
  );
}

