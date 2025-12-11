import React, { useState, useMemo, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { RiFileExcel2Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { IoIosSearch } from "react-icons/io";
import "./Dashboard.css";
import tyrecheck_url from "../constants/tyrecheck.constants";

/**
 * Helpers
 */

// Convert backend CreatedDate "dd/MM/yyyy HH:mm" -> ISO date "yyyy-mm-dd" (suitable for <input type="date">)
const createdDateToISO = (createdDate) => {
  if (!createdDate) return null;
  // expected "03/12/2025 12:33" or "03/12/2025"
  const parts = createdDate.split(" ");
  const dmy = parts[0].split("/");
  if (dmy.length !== 3) return null;
  const [dd, mm, yyyy] = dmy;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

// Convert input date yyyy-mm-dd -> dd/MM/yyyy (for backend if it expects dd/MM/yyyy)
const isoToBackendDate = (iso) => {
  if (!iso) return null;
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) return null;
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
};

const Dashboard = () => {
  const navigate = useNavigate();

  // filters
  const [leadId, setLeadId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");

  // data & loading / error
  const [tableData, setTableData] = useState([]); // holds current page data from backend
  const [dealerData, setDealerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // will be sent as per_page query param
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [backendTotalRows, setBackendTotalRows] = useState(0);

  // windowed pagination (pages shown at once)
  const PAGE_WINDOW_SIZE = 10;
  // windowStart is the first page number of the current visible window (1, 11, 21, ...)
  const [windowStart, setWindowStart] = useState(1);

  // trigger fetch when Search is clicked
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // token from localStorage
  const token = localStorage.getItem("access_token");

  // Fetch page from backend (server-side)

  useEffect(() => {
  const fetch_Data = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${tyrecheck_url}/auth/dealers`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      setDealerData(result);
      console.log("Dealer Data:", result);
    } catch (error) {
      console.log(error);
      setError("Failed to load dealers");
    } finally {
      setLoading(false);
    }
  };

  fetch_Data();
}, []);



  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      // Ensure tyrecheck_url includes protocol + port (e.g. "http://127.0.0.1:8000")
      const url = `${tyrecheck_url}/auth/claim/details?per_page=${rowsPerPage}`;
      const requestBody = {
        page: currentPage,
        ClaimWarrantyId: leadId ? leadId : null,
        DealerId: dealerFilter ? dealerFilter : null,
        Servicetype: null,
        // convert to dd/MM/yyyy because backend sample uses dd/MM/yyyy in CreatedDate
        FromDate: filterStartDate ? filterStartDate : null,
        ToDate: filterEndDate ? filterEndDate : null,
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        });

        if (res.status === 401) {
          // unauthorized — clear local credentials and redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("isAuth");
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        // normalize fields to UI shape
        const normalized = (json.data || []).map((r) => ({
          id: r.Claim_Warranty_Id ?? r.ClaimWarrantyId ?? r.View,
          dealer: r.Dealer_name ?? r.DealerName ?? "",
          claimType: r.Service_type ?? r.ServiceType ?? "",
          // keep both raw and ISO converted date (ISO used for showing and for comparing if needed)
          createdDateRaw: r.CreatedDate ?? null,
          claimWarrantyDate: createdDateToISO(r.CreatedDate) || null,
          processedTime: formatProcessedTime(r.InspectionTime ?? r.TotalAVG ?? ""),
        }));

        setTableData(normalized);

        // backend may return total_pages and total; fallback to sensible defaults
        const tPages = Number(json.total_pages ?? json.totalPages ?? json.totalPagesCount ?? 1) || 1;
        const tRows = Number(json.total ?? json.total_rows ?? json.totalRows ?? 0) || 0;

        setBackendTotalPages(tPages);
        setBackendTotalRows(tRows);

        // adjust windowStart if current page outside it
        const currentWindowStart = Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
        setWindowStart(currentWindowStart);
      } catch (err) {
        console.error("Fetch page error:", err);
        setError(err.message || "Network error — check backend is running");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, fetchTrigger]);

  // Convert "0 days 0 hours 0 minutes 5 seconds" → "0m 5s"
  const formatProcessedTime = (str) => {
    if (!str) return "";

    const regex = /(\d+)\s*days\s*(\d+)\s*hours\s*(\d+)\s*minutes\s*(\d+)\s*seconds/i;
    const match = str.match(regex);

    if (!match) return str; // fallback

    const [, , , minutes, seconds] = match;
    return `${minutes} minutes ${seconds} seconds`;
  };

  // unique dealers for dropdown (populated from current page; consider a dedicated endpoint for full dealer list)
  const dealers = useMemo(() => {
    const s = new Set();
    tableData.forEach((r) => r.dealer && s.add(r.dealer));
    return Array.from(s).sort();
  }, [tableData]);

  // applied filter label
  const appliedRangeLabel = () => {
    if (!leadId && !filterStartDate && !filterEndDate && !dealerFilter) return null;
    const parts = [];
    if (leadId) parts.push(`Lead: ${leadId}`);
    if (filterStartDate && filterEndDate) parts.push(`${filterStartDate} → ${filterEndDate}`);
    else if (filterStartDate) parts.push(`From ${filterStartDate}`);
    else if (filterEndDate) parts.push(`Until ${filterEndDate}`);
    if (dealerFilter) parts.push(`Dealer: ${dealerFilter}`);
    return parts.join(" • ");
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  // redirect to summary page
  const goToSummary = () => {
    navigate("/summary");
  };

  // pagination handlers using backendTotalPages
  const goToPage = (n) => {
    const page = Math.min(Math.max(1, n), backendTotalPages || 1);
    setCurrentPage(page);

    // ensure windowStart contains the page
    const newWindowStart = Math.floor((page - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
    setWindowStart(newWindowStart);

    const tableCard = document.querySelector(".table-card");
    if (tableCard) tableCard.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handlePrev = () => goToPage(currentPage - 1);
  const handleNext = () => goToPage(currentPage + 1);

  // Window controls:
  const goToFirstWindow = () => {
    setWindowStart(1);
    setCurrentPage(1);
  };

  const goToPrevWindow = () => {
    const prevStart = Math.max(1, windowStart - PAGE_WINDOW_SIZE);
    setWindowStart(prevStart);
    setCurrentPage(prevStart);
  };

  const goToNextWindow = () => {
    const nextStart = windowStart + PAGE_WINDOW_SIZE;
    // if nextStart exceeds total pages, clamp to last window start
    const lastWindowStart = Math.floor((backendTotalPages - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
    const newStart = nextStart <= lastWindowStart ? nextStart : lastWindowStart;
    setWindowStart(newStart);
    setCurrentPage(newStart);
  };

  const goToLastPage = () => {
    const lastPage = backendTotalPages || 1;
    const lastWindowStart = Math.floor((lastPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
    setWindowStart(lastWindowStart);
    setCurrentPage(lastPage);
  };

  // Render page buttons for current window
  const renderPageButtons = () => {
    const pages = [];
    const start = windowStart;
    const end = Math.min(windowStart + PAGE_WINDOW_SIZE - 1, backendTotalPages);

    for (let p = start; p <= end; p++) pages.push(p);

    return pages.map((p) => (
      <button
        key={p}
        className={`pg-btn ${p === currentPage ? "active" : ""}`}
        onClick={() => goToPage(p)}
        aria-current={p === currentPage ? "page" : undefined}
      >
        {p}
      </button>
    ));
  };

  // Search button handler: reset page to 1 and trigger fetch
  const onSearch = (e) => {
    e && e.preventDefault();
    setCurrentPage(1);
    setFetchTrigger((t) => t + 1);
    setWindowStart(1);
  };

  // Export the currently displayed rows to CSV
  const exportToCSV = () => {
    if (!tableData || tableData.length === 0) {
      alert("No data to export");
      return;
    }

    // define headers matching the table columns
    const headers = [
      "ClaimWarrantyId",
      "DealerName",
      "ClaimType",
      "ClaimWarrantyDate",
      "ProcessedTime",
    ];

    const rows = tableData.map((r) => [
      r.id ?? "",
      r.dealer ?? "",
      r.claimType ?? "",
      r.claimWarrantyDate ?? r.createdDateRaw ?? "",
      r.processedTime ?? "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const ts = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `claims_export_page${currentPage}_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-page" style={{background: "linear-gradient(to bottom, #e9efe8 0%, #c7d9b0 40%, #8eb66a 100%)",}}>
      <header className="topbar">
        <div className="topbar-logo">
          <img src={Logo} alt="Company logo" className="logo-img" />
        </div>

        <div className="topbar-title">Tyre Check Claim</div>

        <div className="topbar-right">
          <button
            className="logout-btn"
            onClick={goToSummary}
            aria-label="Go to summary page"
            style={{ marginRight: 8 }}
          >
            Summary
          </button>

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="search-card">
        <form className="search-card-inner search-form" onSubmit={onSearch}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Warranty/Claim ID</label>
              <input
                type="text"
                className="lead-input"
                placeholder="Enter Lead ID"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
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

    {dealerData.map((d, idx) => (
      <option key={d.Dealer_code} value={d.Dealer_code}>
        {d.Dealer_name}
      </option>
    ))}
  </select>
</div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="date-input"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="date-input"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            </div>

            <div className="applied-row">
            {appliedRangeLabel() && <div className="applied-range">{appliedRangeLabel()}</div>}
          </div>

            <div className="btn-group action-buttons">
              <button type="submit" className="search-action-btn search-btn">
                <IoIosSearch className="search-icon" />
                <span>Search</span>
              </button>

              <button
                type="button"
                className="search-action-btn export-btn"
                onClick={exportToCSV}
              >
                <RiFileExcel2Line className="export-icon" />
                <span>Export</span>
              </button>
            </div>

          
        </form>
      </div>

      <section className="table-section" >
        <div className="table-card">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <>
              <table className="claims-table">
                <thead>
                  <tr>
                    <th>Claim Warranty ID</th>
                    <th>Dealer Name</th>
                    <th>Claim Type</th>
                    <th>Claim Warranty Date</th>
                    <th>Processed Time</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tableData.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan="7">No Data Available</td>
                    </tr>
                  ) : (
                    tableData.map((row, i) => (
                      <tr key={`${row.id}-${(currentPage - 1) * rowsPerPage + i}`}>

                        <td>{row.id}</td>
                        <td >{row.dealer}</td>
                        <td>{row.claimType}</td>
                        <td>{row.claimWarrantyDate || "-"}</td>
                        <td>{row.processedTime}</td>
                        <td>
                          <button
                            className="view-action"
                            onClick={() => navigate(`/claim/${encodeURIComponent(row.id)}`)}
                          >
                            <FaEye className="eye" />
                            <span className="view-text">View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="table-footer">
                <div className="table-info">
                  Showing page {currentPage} of {backendTotalPages} — {backendTotalRows} items
                </div>

                <div className="table-pagination" role="navigation" aria-label="Table pagination">
                  {/* First window / First page */}
                  <button
                    className="pg-btn"
                    onClick={goToFirstWindow}
                    disabled={windowStart === 1}
                    aria-label="First block"
                  >
                    &laquo;
                  </button>

                  {/* Prev window */}
                  <button
                    className="pg-btn"
                    onClick={goToPrevWindow}
                    disabled={windowStart === 1}
                    aria-label="Previous block"
                  >
                    &lt;
                  </button>

                  {/* page numbers */}
                  {renderPageButtons()}

                  {/* Next window */}
                  <button
                    className="pg-btn"
                    onClick={goToNextWindow}
                    disabled={windowStart + PAGE_WINDOW_SIZE > backendTotalPages}
                    aria-label="Next block"
                  >
                    &gt;
                  </button>

                  {/* Last page */}
                  <button
                    className="pg-btn"
                    onClick={goToLastPage}
                    disabled={currentPage === backendTotalPages}
                    aria-label="Last page"
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
