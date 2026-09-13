import { describe, expect, it } from "vitest";
import { classifyReply, createProposal, safeGoogleMapsUrl } from "@/lib/sales/outreach/proposal";

describe("DINEVIO outreach", () => {
  it("builds a personalized offer with verified reference links and escapes restaurant names", () => {
    const proposal = createProposal({ restaurantName: '<Cafe & Bar>', googleMapsUrl: "https://www.google.com/maps/place/Cafe" });
    expect(proposal.subject).toContain("<Cafe & Bar>");
    expect(proposal.html).toContain("&lt;Cafe &amp; Bar&gt;");
    expect(proposal.html).toContain("http://schnellundlecker.dinevio.de/");
    expect(proposal.text).toContain("https://www.dinevio.de/");
    expect(proposal.text).toContain("Google Maps");
    expect(proposal.text).toContain("eigenes Demo");
  });
  it("excludes unsafe map links", () => {
    expect(safeGoogleMapsUrl("javascript:alert(1)")).toBeNull();
    expect(safeGoogleMapsUrl("https://evil.example/maps")).toBeNull();
    expect(safeGoogleMapsUrl("https://www.google.com/maps/place/Cafe")).not.toBeNull();
  });
  it("classifies an explicit demo request but not a quoted or negative reply", () => {
    expect(classifyReply("Bitte schicken Sie uns ein Demo.").wantsDemo).toBe(true);
    expect(classifyReply("Danke, kein Interesse.\nOn Monday wrote: Bitte schicken Sie uns ein Demo.").wantsDemo).toBe(false);
    expect(classifyReply("Bitte keine E-Mails mehr. Wir möchten ein Demo nicht.").optedOut).toBe(true);
    expect(classifyReply("Bitte keine E-Mails mehr. Wir möchten ein Demo nicht.").wantsDemo).toBe(false);
  });
});
