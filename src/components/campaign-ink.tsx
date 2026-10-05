export const campaignTick = { fill: "#cbb892", fontSize: 12, fontFamily: "Cinzel, serif" };

export function CampaignInk({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} patternContentUnits="objectBoundingBox" width="1" height="1">
        <image href="/relics/blood-bar.png" x="0" y="0" width="1" height="1" preserveAspectRatio="none" />
      </pattern>
    </defs>
  );
}
