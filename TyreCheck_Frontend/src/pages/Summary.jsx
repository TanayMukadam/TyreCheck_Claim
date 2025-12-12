import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import BgImage from "../assets/bg.png";
import "./Summary.css";
import tyrecheck_url from "../constants/tyrecheck.constants.js"; // keep as your project expects
import { IoIosSearch } from "react-icons/io";
import { FiPlus, FiMinus } from "react-icons/fi";

const DUMMY_DEALER_DATA = [
  {
    Dealer_code: "D001",
    Dealer_name: "GUPTA TYRES HOUSE",
    defects: [
      { defectName: "Shoulder Cut", defectCount: 58 },
      { defectName: "Sidewall Cut", defectCount: 34 },
      { defectName: "Runflat", defectCount: 22 },
      { defectName: "Tread Cut", defectCount: 15 },
      { defectName: "CBU", defectCount: 6 },
    ],
  },
  {
    Dealer_code: "D002",
    Dealer_name: "SHIVDHARA TYRE WORLD",
    defects: [
      { defectName: "Shoulder Cut", defectCount: 12 },
      { defectName: "Sidewall Cut", defectCount: 8 },
    ],
  },
  {
    Dealer_code: "D003",
    Dealer_name: "R.K WHEELS",
    defects: [
      { defectName: "Runflat", defectCount: 9 },
      { defectName: "Tread Cut", defectCount: 4 },
    ],
  },
  
];

const Summary = () => {
  const navigate = useNavigate();

  // filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");

  const [overallreportData, setOverallReportData] = useState(null);
  const [summarydata, setSummaryData] = useState(null);

  // dealer-wise report data
  const [dealerReportData, setDealerReportData] = useState([]);
  const [expandedDealers, setExpandedDealers] = useState(new Set());

  // mode & tab
  const [mode, setMode] = useState("claim");
  const [aiTab, setAiTab] = useState("aiResult");
  const [loading, setLoading] = useState(false);
  const [dealerData, setDealerData] = useState([]);

  // fetch dealer list (dropdown)
  const fetchDealerData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${tyrecheck_url}/auth/dealers`, {
        method: "GET",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) return;
      const result = await response.json();
      setDealerData(result || []);
    } catch (err) {
      console.error(err);
    }
  };

  // fetch summary
  const fetchSummaryData = async (bodyData = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${tyrecheck_url}/auth/summary/summary_report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyData || {}),
      });
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const result = await response.json();
      setSummaryData(result.percentage_report || []);
      setOverallReportData(result.overall_summary || []);
      // if API included dealer_summary use it
      if (result.dealer_summary && Array.isArray(result.dealer_summary)) {
        setDealerReportData(result.dealer_summary);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // fetch dealer report (expandable)
  const fetchDealerReport = async (bodyData = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${tyrecheck_url}/auth/summary/dealer_report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyData || {}),
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const result = await response.json();
      setDealerReportData(result.dealer_report || result || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    (async () => {
      await fetchDealerData();
      await fetchSummaryData({});
      await fetchDealerReport({});

      // fallback to dummy data so you can see UI immediately
      setTimeout(() => {
        setDealerReportData((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : DUMMY_DEALER_DATA));
      }, 250);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e && e.preventDefault();
    const body = {
      servicetype: mode,
      dealer_code: dealerFilter || null,
      from_date: filterStartDate || null,
      to_date: filterEndDate || null,
    };
    fetchSummaryData(body);
    fetchDealerReport(body);
  };

  const toggleDealer = (dealerKey) => {
    const copy = new Set(expandedDealers);
    if (copy.has(dealerKey)) copy.delete(dealerKey);
    else copy.add(dealerKey);
    setExpandedDealers(copy);
  };

  const goToDashboard = () => navigate("/dashboard");
  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  // Normalizers
  const getDealerName = (d, idx) => d.Dealer_name || d.dealerName || d.name || `Dealer ${idx + 1}`;
  const getDealerCode = (d, idx) => d.Dealer_code || d.dealerCode || d.code || idx;
  const getDefects = (d) => d.defects || d.defect_counts || d.defectList || d.details || d.defects_list || [];

  return (
    <div
      className="summary-page"
      style={{
        background:
          "linear-gradient(to bottom, #e9efe8 0%, #c7d9b0 40%, #8eb66a 100%)",
      }}
    >
      {/* HEADER */}
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

      {/* FILTER CARD */}
      <div className="search-card">
        <form className="search-card-inner search-form" onSubmit={onSearch}>
          <div className="form-row summary-form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="date-input" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="date-input" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Dealer</label>
              <select className="select-input" value={dealerFilter} onChange={(e) => setDealerFilter(e.target.value)}>
                <option value="">All Dealers</option>
                {dealerData.map((item) => (
                  <option key={item.ID || item.Dealer_code || item.dealerCode || item.id} value={item.Dealer_code || item.dealerCode || item.code || ""}>
                    {item.Dealer_name || item.dealerName || item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-button-wrap">
              <button className="search-action-btn" type="submit">
                <IoIosSearch className="search-icon" />
                <span style={{ fontSize: "17px" }}>Search</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODE SWITCH */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <div className="segmented center-big">
          <button className={`seg-btn ${mode === "warranty" ? "active" : ""}`} onClick={() => setMode("warranty")}>Warranty</button>
          <button className={`seg-btn ${mode === "claim" ? "active" : ""}`} onClick={() => setMode("claim")}>Claim</button>
        </div>
      </div>

      {/* AI TABS */}
      <div className="ai-control-row">
        <div style={{ flex: 1 }} />
        <div className="segmented ai-segmented small">
          <button className={`seg-btn ${aiTab === "aiResult" ? "active" : ""}`} onClick={() => setAiTab("aiResult")}>AI Result</button>
          <button className={`seg-btn ${aiTab === "aiSummary" ? "active" : ""}`} onClick={() => setAiTab("aiSummary")}>AI Summary</button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <section className="table-section">
        <div className="table-card">
          {/* CLAIM - AI RESULT */}
          {mode === "claim" && aiTab === "aiResult" && (
            <div className="summary-content no-donut">
              <div className="overall-card overall-card-no-donut">
                <h3>Overall Claim AI Output %</h3>
                <div className="overall-body overall-body-no-donut">
                  <div className="overall-stats overall-stats-large">
                    <table className="summary-stat-table large bordered">
                      <thead style={{ backgroundColor: "#f0f0f0" }}>
                        <tr>
                          <th>Overall %</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overallreportData && overallreportData.length > 0 ? (
                          overallreportData.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.Overall}</td>
                              <td>{item.WarrantyCount}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" style={{ textAlign: "center" }}>
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="partition" />

              <div className="typewise-card">
                <h3>Type wise AI output %</h3>
                <div className="widget">
                  <table className="summary-stat-table full-width bordered">
                    <thead style={{ backgroundColor: "#f0f0f0" }}>
                      <tr>
                        <th>Type</th>
                        <th>Image Count</th>
                        <th>Avg. Accuracy</th>
                        <th>100%</th>
                        <th>90%</th>
                        <th>50%</th>
                        <th>Not processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summarydata && summarydata.length > 0 ? (
                        summarydata.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.Type}</td>
                            <td>{item.TypeCount}</td>
                            <td>{item.average}%</td>
                            <td>{item.H100}</td>
                            <td>{item.H90}</td>
                            <td>{item.H50}</td>
                            <td>{item.AINotProcess}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center" }}>
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI SUMMARY (expandable dealer table) */}
          {mode === "claim" && aiTab === "aiSummary" && (
            <div className="ai-summary-section">
              <h3 style={{ textAlign: "center", marginBottom: 12 }}>
                Dealer-wise Defect Summary
              </h3>

              <div className="widget">
                <table className="dealer-table full-width bordered">
                  <thead style={{ backgroundColor: "#f0f0f0" }}>
                    <tr>
                      <th style={{ width: 60 }}></th>
                      <th style={{ textAlign: "left" }}>Dealer Name</th>
                      <th style={{ width: 140, textAlign: "center" }}>
                        Total Defects
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dealerReportData && dealerReportData.length > 0 ? (
                      dealerReportData.map((dealer, idx) => {
                        const dealerName = getDealerName(dealer, idx);
                        const dealerCode = getDealerCode(dealer, idx);
                        const defects = getDefects(dealer);
                        const totalDefects = Array.isArray(defects)
                          ? defects.reduce((s, d) => s + (d.defectCount ?? d.count ?? d.DefectCount ?? 0), 0)
                          : 0;
                        const isOpen = expandedDealers.has(dealerCode);

                        return (
                          <React.Fragment key={`${dealerCode}-${idx}`}>
                            <tr className="dealer-row">
                              <td className="expand-cell">
                                <button className="expand-btn" onClick={() => toggleDealer(dealerCode)}>
                                  {isOpen ? <FiMinus /> : <FiPlus />}
                                </button>
                              </td>
                              <td className="dealer-name-cell" style={{ textAlign: "left" }}>{dealerName}</td>
                              <td style={{ textAlign: "center" }}>{totalDefects}</td>
                            </tr>

                            {isOpen && (
                              <tr className="dealer-expanded-row">
                                <td colSpan="3" style={{ padding: 0 }}>
                                  <div className="expanded-inner">
                                    <table className="inner-defect-table full-width">
                                      <thead>
                                        <tr>
                                          <th style={{ textAlign: "left" }}>Defect Name</th>
                                          <th style={{ width: 120, textAlign: "center" }}>Defect Count</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Array.isArray(defects) && defects.length > 0 ? (
                                          defects.map((d, di) => (
                                            <tr key={di}>
                                              <td style={{ textAlign: "left" }}>{d.defectName ?? d.DefectName ?? d.name ?? `Defect ${di + 1}`}</td>
                                              <td style={{ textAlign: "center" }}>{d.defectCount ?? d.count ?? d.DefectCount ?? 0}</td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan="2" style={{ textAlign: "center" }}>No defect data for this dealer.</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center", padding: 18 }}>
                          No dealer summary available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && <div style={{ marginTop: 12 }}>Loading...</div>}
        </div>
      </section>
    </div>
  );
};

export default Summary;
