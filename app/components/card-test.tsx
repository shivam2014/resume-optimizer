import { Card, CardContent } from "@/components/ui/card";

export default function CardTest() {
  return (
    <Card className="w-[350px]">
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold">Test Card</h2>
        <p className="text-sm text-muted-foreground">
          This is a test of the card component
        </p>
      </CardContent>
    </Card>
  );
}