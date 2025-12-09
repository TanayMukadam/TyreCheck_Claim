import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import BgImage from "../assets/bg.png";
import "./Summary.css";

const Summary = () => {
  const navigate = useNavigate();

  // filters
  const [leadId, setLeadId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");

  // mode & tab
  const [mode, setMode] = useState("claim"); // warranty | claim
  const [aiTab, setAiTab] = useState("aiResult"); // aiResult | aiSummary
  const [loading] = useState(false);

  // sample summary (replace with real API data)
  const [summary] = useState({
    overallPercent: 100,
    totalCount: 31606,
    typeStats: [
      { type: "Defect - Outside", imageCount: 30783, avgAccuracy: 100 },
      { type: "Gauge Depth", imageCount: 30514, avgAccuracy: 100 },
      { type: "Defect - Inside", imageCount: 30801, avgAccuracy: 100 },
    ],
  });

  const dealers = useMemo(() => ["PANCHSHEELA TYRE...", "JM TYRES", "BALAJI WHEELS"], []);

  const goToDashboard = () => navigate("/dashboard");
  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  const onSearch = (e) => {
    e && e.preventDefault();
    // wire API here if needed
  };

  return (
    <div className="summary-page">
      <header className="topbar">
        <div className="topbar-logo">
          <img src={Logo} alt="logo" className="logo-img" />
        </div>

        <div className="topbar-title">Tyre Check Claim - Summary</div>

        <div className="topbar-right">
          <button className="logout-btn" onClick={goToDashboard} style={{ marginRight: 8 }}>
            Dashboard
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Filter card */}
      <div className="search-card">
        <form className="search-card-inner search-form" onSubmit={onSearch}>
          <div className="form-row summary-form-row">
            <div className="form-group">
              <label className="form-label">Lead ID</label>
              <input
                className="lead-input"
                placeholder="Enter Lead ID"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                className="date-input"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                className="date-input"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dealer</label>
              <select
                className="select-input"
                value={dealerFilter}
                onChange={(e) => setDealerFilter(e.target.value)}
              >
                <option value="">All Dealers</option>
                {dealers.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-button-wrap">
              <label className="form-label" style={{ visibility: "hidden" }}>
                search
              </label>
              <button className="search-action-btn" type="submit">
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Centered big Warranty/Claim segmented control */}
      <div className="mode-center-wrap">
        <div className="segmented center-big">
          <button
            className={`seg-btn ${mode === "warranty" ? "active" : ""}`}
            onClick={() => setMode("warranty")}
            aria-pressed={mode === "warranty"}
          >
            Warranty
          </button>
          <button
            className={`seg-btn ${mode === "claim" ? "active" : ""}`}
            onClick={() => setMode("claim")}
            aria-pressed={mode === "claim"}
          >
            Claim
          </button>
        </div>
      </div>

      {/* AI segmented control (small, right-aligned) */}
      <div className="ai-control-row">
        <div style={{ flex: 1 }} />
        <div className="segmented ai-segmented small">
          <button
            className={`seg-btn ${aiTab === "aiResult" ? "active" : ""}`}
            onClick={() => setAiTab("aiResult")}
            aria-pressed={aiTab === "aiResult"}
          >
            AI Result
          </button>
          <button
            className={`seg-btn ${aiTab === "aiSummary" ? "active" : ""}`}
            onClick={() => setAiTab("aiSummary")}
            aria-pressed={aiTab === "aiSummary"}
          >
            AI Summary
          </button>
        </div>
      </div>

      {/* Content */}
      <section className="table-section" style={{ backgroundImage: `url(${BgImage})` }}>
        <div className="table-card">
          <h3 style={{ textAlign: "center", marginBottom: 12 }}>
            Summary — Mode: {mode} • Tab: {aiTab === "aiResult" ? "AI Result" : "AI Summary"}
          </h3>

          {/* Warranty empty view */}
          {mode === "warranty" && <div className="empty-state">No Warranty data to show.</div>}

          {/* Claim / AI Result content */}
          {mode === "claim" && aiTab === "aiResult" && (
            <div className="summary-content no-donut">
              {/* Left: overall (now only table) */}
              <div className="overall-card overall-card-no-donut">
                <h4>Overall Claim AI Output %</h4>
                <div className="overall-body overall-body-no-donut">
                  <div className="overall-stats overall-stats-large">
                    <table className="summary-stat-table large bordered">
                      <thead>
                        <tr>
                          <th>Overall %</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{summary.overallPercent}</td>
                          <td>{summary.totalCount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* vertical partition */}
              <div className="partition" />

              {/* Right: type wise (bordered table) */}
              <div className="typewise-card">
                <h4>Type wise AI output %</h4>
                <div className="widget">
                  <table className="summary-stat-table full-width bordered">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Image Count</th>
                        <th>Avg. Accuracy</th>
                        <th>100%</th>
                        <th>90%</th>
                        <th>50%</th>
                        <th>0% / Not processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.typeStats.map((t) => (
                        <tr key={t.type}>
                          <td>{t.type}</td>
                          <td>{t.imageCount}</td>
                          <td>{t.avgAccuracy}</td>
                          <td>{Math.round(t.imageCount * 0.8)}</td>
                          <td>{Math.round(t.imageCount * 0.12)}</td>
                          <td>{Math.round(t.imageCount * 0.06)}</td>
                          <td>{Math.round(t.imageCount * 0.02)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI Summary empty view */}
          {mode === "claim" && aiTab === "aiSummary" && (
            <div className="empty-state">AI Summary view intentionally left empty.</div>
          )}

          {loading && <div style={{ marginTop: 12 }}>Loading...</div>}
        </div>
      </section>
    </div>
  );
};

export default Summary;
