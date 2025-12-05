interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      // You must remove the quotes around the variable
      className={`${className}`} 
      style={style}
    >
      {children}
    </div>
  );
}

