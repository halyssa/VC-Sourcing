import Input from "./Input";

export default function SearchBar({ ...props }) {
  return (
    <Input
      placeholder="Search..."
      className="w-full"
      {...props}
    />
  );
}
