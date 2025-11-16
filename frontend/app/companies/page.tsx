import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchBar from "@/components/SearchBar";
import Chip from "@/components/Chip";
import Card from "@/components/Card";

export default function CompaniesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', paddingTop: "20px" }}>
      <h1>Companies Page Placeholder</h1>

      <h1 className="text-2xl font-bold">Test Components:</h1>

      <Button>Button</Button>

      <Input placeholder="Input here..." />

      <div className="w-full flex justify-center mt-0">
        <SearchBar className="mt-0"/>
      </div>

      <div className="w-full flex justify-center mt-0">
      <Chip label="Series A" selected />
      </div>

      <Card>
        <p>Inside a card</p>
      </Card>
    </div>
  );
}