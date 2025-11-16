import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 bg-black text-white rounded-md hover:opacity-90 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
