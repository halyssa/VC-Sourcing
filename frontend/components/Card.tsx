interface CardProps {
  children: React.ReactNode;
}

export default function Card({ children }: CardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
      {children}
    </div>
  );
}
