import React, { useState, useMemo, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { RiFileExcel2Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { IoIosSearch } from "react-icons/io";
import "./Dashboard.css";
import tyrecheck_url from "../constants/tyrecheck.constants";

/* ---------------------------
   Helpers
   ---------------------------*/



   
// Convert backend CreatedDate "dd/MM/yyyy HH:mm" -> ISO date "yyyy-mm-dd"
const createdDateToISO = (createdDate) => {
  if (!createdDate) return null;
  const parts = createdDate.split(" ");
  const dmy = parts[0].split("/");
  if (dmy.length !== 3) return null;
  const [dd, mm, yyyy] = dmy;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

// Convert input date yyyy-mm-dd -> SQL DATETIME "yyyy-mm-dd HH:MM:SS"
// if endOfDay === true returns "yyyy-mm-dd 23:59:59", otherwise "yyyy-mm-dd 00:00:00"
const isoToSqlDatetime = (iso, endOfDay = false) => {
  if (!iso) return null;
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")} ${endOfDay ? "23:59:59" : "00:00:00"}`;
};

// Format processed time
const formatProcessedTime = (str) => {
  if (!str) return "";
  const regex = /(\d+)\s*minutes?\s*(\d+)\s*seconds?/i;
  const m = str.match(regex);
  if (m) return `${m[1]} minutes ${m[2]} seconds`;
  return str;
};

/* ---------------------------
   Dashboard component
   ---------------------------*/

const Dashboard = () => {
  const navigate = useNavigate();

  // Filters (UI)
  const [leadId, setLeadId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Dealer selection: keep code for queries and name for display
  const [dealerFilterCode, setDealerFilterCode] = useState("");
  const [dealerFilterName, setDealerFilterName] = useState("");

  // Data & state
  const [tableData, setTableData] = useState([]);
  const [dealerData, setDealerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [backendTotalRows, setBackendTotalRows] = useState(0);

  // Page window
  const PAGE_WINDOW_SIZE = 10;
  const [windowStart, setWindowStart] = useState(1);

  // Trigger fetch when user clicks Search (keeps fetch from firing on every filter change)
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const token = localStorage.getItem("access_token");

  /* ---------------------------
     Fetch dealers (once)
     ---------------------------*/
  useEffect(() => {
    let isMounted = true;
    const loadDealers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${tyrecheck_url}/auth/dealers`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          throw new Error(txt || `${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (isMounted) setDealerData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load dealers:", err);
        if (isMounted) setError("Failed to load dealers");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDealers();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------
     Fetch page (when currentPage or fetchTrigger changes)
     ---------------------------*/
  useEffect(() => {
    let isMounted = true;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      const url = `${tyrecheck_url}/auth/claim/details?per_page=${rowsPerPage}`;

      const requestBody = {
        page: currentPage,
        ClaimWarrantyId: leadId || null,
        DealerId: dealerFilterCode || null, // send code (this fixes the earlier mismatch)
        Servicetype: null,
        // send SQL-compatible datetimes
        FromDate: filterStartDate ? isoToSqlDatetime(filterStartDate, false) : null,
        ToDate: filterEndDate ? isoToSqlDatetime(filterEndDate, true) : null,
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

        const normalized = (json.data || []).map((r) => ({
          id: r.Claim_Warranty_Id ?? r.ClaimWarrantyId ?? r.View ?? "",
          dealer: r.Dealer_name ?? r.DealerName ?? "",
          claimType: r.Service_type ?? r.ServiceType ?? "",
          createdDateRaw: r.CreatedDate ?? null,
          claimWarrantyDate: createdDateToISO(r.CreatedDate) || null,
          processedTime: formatProcessedTime(r.InspectionTime ?? r.TotalAVG ?? ""),
        }));

        if (isMounted) {
          setTableData(normalized);

          const tPages =
            Number(json.total_pages ?? json.totalPages ?? json.totalPagesCount ?? 1) || 1;
          const tRows =
            Number(json.total ?? json.total_rows ?? json.totalRows ?? 0) || 0;

          setBackendTotalPages(tPages);
          setBackendTotalRows(tRows);

          const currentWindowStart =
            Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
          setWindowStart(currentWindowStart);
        }
      } catch (err) {
        console.error("Fetch page error:", err);
        if (isMounted) setError(err.message || "Network error — check backend");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
    };
    // intentionally only depend on currentPage + fetchTrigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, fetchTrigger]);

  /* ---------------------------
     Dealers for dropdown (use master dealerData if available, fallback to unique dealers in table)
     ---------------------------*/
  const dealersList = useMemo(() => {
    if (Array.isArray(dealerData) && dealerData.length > 0) {
      return dealerData
        .map((d) =>
          d && (d.Dealer_code || d.DealerName || d.dealer)
            ? {
                code: d.Dealer_code ?? d.DealerCode ?? d.code ?? "",
                name: d.Dealer_name ?? d.DealerName ?? d.name ?? "",
              }
            : null
        )
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    const s = new Set();
    tableData.forEach((r) => r.dealer && s.add(r.dealer));
    return Array.from(s)
      .map((n) => ({ code: n, name: n }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dealerData, tableData]);

  /* ---------------------------
     Applied filter label
     ---------------------------*/
  const appliedRangeLabel = () => {
    if (!leadId && !filterStartDate && !filterEndDate && !dealerFilterCode) return null;
    const parts = [];
    if (leadId) parts.push(`Lead: ${leadId}`);
    if (filterStartDate && filterEndDate) parts.push(`${filterStartDate} → ${filterEndDate}`);
    else if (filterStartDate) parts.push(`From ${filterStartDate}`);
    else if (filterEndDate) parts.push(`Until ${filterEndDate}`);
    if (dealerFilterCode && dealerFilterName) parts.push(`Dealer: ${dealerFilterName}`);
    return parts.join(" • ");
  };

  /* ---------------------------
     Clear filters handler
     ---------------------------*/
  const clearFilters = () => {
    setLeadId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setDealerFilterCode("");
    setDealerFilterName("");
    setCurrentPage(1);
    setWindowStart(1);
    // trigger fetch (so results refresh to unfiltered data)
    setFetchTrigger((t) => t + 1);
  };

  /* ---------------------------
     Pagination helpers
     ---------------------------*/
  const goToPage = (n) => {
    const page = Math.min(Math.max(1, n), backendTotalPages || 1);
    setCurrentPage(page);
    const newWindowStart = Math.floor((page - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
    setWindowStart(newWindowStart);
    const tableCard = document.querySelector(".table-card");
    if (tableCard) tableCard.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handlePrev = () => goToPage(currentPage - 1);
  const handleNext = () => goToPage(currentPage + 1);

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
    const lastWindowStart =
      Math.floor((backendTotalPages - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
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

  /* ---------------------------
     Search handler (user triggers)
     ---------------------------*/
  const onSearch = (e) => {
    e && e.preventDefault();
    setCurrentPage(1);
    setWindowStart(1);
    setFetchTrigger((t) => t + 1); // triggers fetchPage effect
  };

  /* ---------------------------
     CSV export
     ---------------------------*/
  const exportToCSV = () => {
    if (!tableData || tableData.length === 0) {
      alert("No data to export");
      return;
    }

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

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

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

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  const goToSummary = () => navigate("/summary");

  /* ---------------------------
     JSX render
     ---------------------------*/
  return (
    <div
      className="dashboard-page"
      style={{
        background: "linear-gradient(to bottom, #e9efe8 0%, #c7d9b0 40%, #8eb66a 100%)",
      }}
    >
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

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
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
                value={dealerFilterCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setDealerFilterCode(code);
                  const found = dealersList.find((x) => x.code === code);
                  setDealerFilterName(found?.name || "");
                }}
              >
                <option value="">All Dealers</option>
                {dealersList.map((d) => (
                  <option key={d.code || d.name} value={d.code || d.name}>
                    {d.name}
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

          {/* applied filters badge + action buttons (kept on one row) */}
          <div className="applied-and-actions">
            {appliedRangeLabel() && (
              <div className="applied-range" role="status" aria-live="polite">
                <span className="applied-text">{appliedRangeLabel()}</span>
                <button
                  type="button"
                  className="clear-inline-btn"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                >
                  ✕
                </button>
              </div>
            )}

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
              {/* big Clear button intentionally removed */}
            </div>
          </div>
        </form>
      </div>

      <section className="table-section">
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
        <td>{row.dealer}</td>
        <td>{row.claimType}</td>
        <td>{row.claimWarrantyDate || "-"}</td>
        <td>{row.processedTime}</td>

        <td>
          <button
  className="view-action"
  onClick={() => {
    const safeId = row.id.toString().replace(/\W+/g, "_");
    const windowName = `claim_${safeId}`;

    window.open(
      `/claim/${encodeURIComponent(row.id)}`,
      windowName,
      "width=1300,height=900,left=150,top=80,resizable=yes,scrollbars=yes"
    );
  }}
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
                  <button
                    className="pg-btn"
                    onClick={goToFirstWindow}
                    disabled={windowStart === 1}
                    aria-label="First block"
                  >
                    &laquo;
                  </button>

                  <button
                    className="pg-btn"
                    onClick={goToPrevWindow}
                    disabled={windowStart === 1}
                    aria-label="Previous block"
                  >
                    &lt;
                  </button>

                  {renderPageButtons()}

                  <button
                    className="pg-btn"
                    onClick={goToNextWindow}
                    disabled={windowStart + PAGE_WINDOW_SIZE > backendTotalPages}
                    aria-label="Next block"
                  >
                    &gt;
                  </button>

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
