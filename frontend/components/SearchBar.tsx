import Input from "./Input";

export default function SearchBar({ className = "", ...props }) {
  return (
    <Input
      placeholder="Search for companies..."
      className={`${className}`}
      {...props}
    />
  );
}
