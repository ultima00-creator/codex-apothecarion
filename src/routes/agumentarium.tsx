import { createFileRoute } from "@tanstack/react-router";
import { WingCodex } from "@/components/wing-codex";

export const Route = createFileRoute("/agumentarium")({
  component: () => <WingCodex wing="agumentarium" />,
});
