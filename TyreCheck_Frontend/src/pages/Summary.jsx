import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import BgImage from "../assets/bg.png";
import "./Summary.css";
import tyrecheck_url from "../constants/tyrecheck.constants.js";
import { IoIosSearch } from "react-icons/io";

const Summary = () => {
  const navigate = useNavigate();

  // filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");

  const [overallreportData, setOverallReportData] = useState(null);
  const [summarydata, setSummaryData] = useState(null);

  // mode & tab
  const [mode, setMode] = useState("claim"); 
  const [aiTab, setAiTab] = useState("aiResult"); 
  const [loading, setLoading] = useState(false);
  const [dealerData, setDealerData] = useState([]);

  const fetchDealerData = async() => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${tyrecheck_url}/auth/dealers`, {
        method: "GET",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
      })

      const result = await response.json()
      // console.log("Get Dealers -->", result)
      setDealerData(result)
      setLoading(false)
    }
    catch (err) {
      console.log(err)
      setLoading(false);
    }
    
  }

  const goToDashboard = () => navigate("/dashboard");
  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  // API CALL
  const fetchSummaryData = async (bodyData = null) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${tyrecheck_url}/auth/summary/summary_report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(bodyData || {}),
        }
      );

      if (!response.ok) {
        throw new Error("API error " + response.status);
      }

      const result = await response.json();

      // console.log("SUMMARY REPORT:", result);

      setSummaryData(result.percentage_report || []);
      setOverallReportData(result.overall_summary || []);
      setLoading(false);
    } catch (err) {
      console.error("API fetch error:", err);
      setLoading(false);
    }
  };

  // Load default report without filters
  useEffect(() => {
    fetchDealerData();
    fetchSummaryData({});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();

    fetchSummaryData({
      servicetype: "claim",
      dealer_code: dealerFilter || null,
      from_date: filterStartDate || null,
      to_date: filterEndDate || null,
    });
  };

  return (
    <div className="summary-page" style={{background: "linear-gradient(to bottom, #e9efe8 0%, #c7d9b0 40%, #8eb66a 100%)",}}>
      {/* HEADER */}
      <header className="topbar">
        <div className="topbar-logo">
          <img src={Logo} alt="logo" className="logo-img" />
        </div>

        <div className="topbar-title">Tyre Check Claim - Summary</div>

        <div className="topbar-right">
          <button
            className="logout-btn"
            onClick={goToDashboard}
            style={{ marginRight: 8 }}
          >
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
            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                className="date-input"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                className="date-input"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>

            {/* Dealer */}
            <div className="form-group">
              <label className="form-label">Dealer</label>
              <select
                className="select-input"
                value={dealerFilter}
                onChange={(e) => setDealerFilter(e.target.value)}
              >
                <option value="">All Dealers</option>
                {dealerData.map((item) => (
                <option key={item.ID} value={item.Dealer_code}>
                  {item.Dealer_name}
                </option>
              ))}
              </select>
            </div>

            {/* SEARCH BUTTON */}
            <div className="search-button-wrap">
              {/* <label className="form-label" style={{ visibility: "hidden" }}>
                
              </label> */}
              <div className="search-button-wrap">
                <button className="search-action-btn" type="submit">
                  <IoIosSearch className="search-icon" />
                  <span style={{fontSize:"17px"}}>Search</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* MODE SWITCH */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <div className="segmented center-big">
          <button
            className={`seg-btn ${mode === "warranty" ? "active" : ""}`}
            onClick={() => setMode("warranty")}
          >
            Warranty
          </button>
          <button
            className={`seg-btn ${mode === "claim" ? "active" : ""}`}
            onClick={() => setMode("claim")}
          >
            Claim
          </button>
        </div>
      </div>

      {/* AI TABS */}
      <div className="ai-control-row">
        <div style={{ flex: 1 }} />
        <div className="segmented ai-segmented small">
          <button
            className={`seg-btn ${aiTab === "aiResult" ? "active" : ""}`}
            onClick={() => setAiTab("aiResult")}
          >
            AI Result
          </button>
          <button
            className={`seg-btn ${aiTab === "aiSummary" ? "active" : ""}`}
            onClick={() => setAiTab("aiSummary")}
          >
            AI Summary
          </button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <section
        className="table-section"
        // style={{ backgroundImage: `url(${BgImage})` }}
      >
        <div className="table-card">
          {/* WARRANTY EMPTY */}
          {mode === "warranty" && (
            <div className="empty-state">No Warranty data to show.</div>
          )}

          {/* CLAIM - AI RESULT */}
          {mode === "claim" && aiTab === "aiResult" && (
            <div className="summary-content no-donut">
              {/* Overall Section */}
              <div className="overall-card overall-card-no-donut">
                <h3>Overall Claim AI Output %</h3>
                <div className="overall-body overall-body-no-donut">
                  <div className="overall-stats overall-stats-large">
                    <table className="summary-stat-table large bordered">
                      <thead style={{backgroundColor:"#f0f0f0"}}>
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

              {/* Type wise table */}
              <div className="typewise-card">
                <h3>Type wise AI output %</h3>
                <div className="widget">
                  <table className="summary-stat-table full-width bordered">
                    <thead style={{backgroundColor:"#f0f0f0"}}>
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

          {/* AI SUMMARY EMPTY */}
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
