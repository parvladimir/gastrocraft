import { siteConfig } from "@/lib/site-config";

export function OpenGraphCard() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#0F172A",
        color: "#FAFAF8",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%"
      }}
    >
      <div
        style={{
          border: "1px solid rgba(201, 162, 39, 0.36)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          width: "100%"
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: "24px" }}>
          <div
            style={{
              alignItems: "center",
              background: "#111D31",
              border: "1px solid rgba(201, 162, 39, 0.45)",
              display: "flex",
              height: "92px",
              justifyContent: "center",
              width: "92px"
            }}
          >
            <span
              style={{
                color: "#C9A227",
                fontSize: "52px",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-2px"
              }}
            >
              DV
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "50px", fontWeight: 800, lineHeight: 1 }}>
              {siteConfig.name}
            </span>
            <span
              style={{
                color: "#C9A227",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "6px",
                marginTop: "12px",
                textTransform: "uppercase"
              }}
            >
              {siteConfig.descriptor}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "100%" }}>
          <span
            style={{
              color: "#FAFAF8",
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-1px",
              lineHeight: 1.08
            }}
          >
            Ihre Gäste suchen online.
          </span>
          <span
            style={{
              color: "#C9A227",
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-1px",
              lineHeight: 1.08,
              marginTop: "10px"
            }}
          >
            Wir sorgen dafür, dass sie Sie finden.
          </span>
        </div>

        <div
          style={{
            alignItems: "center",
            color: "#94A3B8",
            display: "flex",
            fontSize: "24px",
            gap: "18px"
          }}
        >
          <span
            style={{
              background: "#C9A227",
              display: "flex",
              height: "1px",
              width: "80px"
            }}
          />
          <span>Modern. Persönlich. Für die Gastronomie entwickelt.</span>
        </div>
      </div>
    </div>
  );
}
