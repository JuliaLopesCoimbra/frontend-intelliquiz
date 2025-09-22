import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quiz } from "@/lib/types";

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  return (
    <Link href={`/quiz/${quiz.slug}`}>
      <Card className="group h-full border-neutral-800 hover:border-amber-400/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{quiz.title}</span>
            <Badge
              variant="outline"
              className="border-amber-400/40 text-amber-200"
            >
              {quiz.category}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="mb-3 h-36 w-full rounded-lg bg-neutral-900"
            style={{
              backgroundImage: `url(${quiz.cover || ""})`,
              backgroundSize: "cover",
            }}
          />
          <p className="text-sm text-neutral-400">{quiz.plays} jogadas</p>
        </CardContent>
      </Card>
    </Link>
  );
}
