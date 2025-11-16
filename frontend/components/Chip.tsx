interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function Chip({ label, selected = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition 
      ${selected ? "bg-black text-white" : "bg-white text-black border-gray-400"}`}
    >
      {label}
    </button>
  );
}
