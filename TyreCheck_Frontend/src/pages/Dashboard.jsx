import React, { useState, useMemo, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { RiFileExcel2Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { IoIosSearch } from "react-icons/io";
import "./Dashboard.css";
import tyrecheck_url from "../constants/tyrecheck.constants";
import LoaderGif from "../assets/black.gif";
import ExcelJS from "exceljs";
   
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
  if (m) return `${m[1]} mins ${m[2]} secs`;
  return str;
};


const Dashboard = () => {
  const navigate = useNavigate();

  // Filters (UI)
  const [leadId, setLeadId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Dealer selection: keep code for queries and name for display
  const [dealerFilterCode, setDealerFilterCode] = useState("");
  const [dealerFilterName, setDealerFilterName] = useState("");

  // 🔹 Export popup states
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [exportType, setExportType] = useState("LAST_1_MONTH");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

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

  function parseBackendDate(dateStr) {
      if (!dateStr) return null;

      const [datePart, timePart] = dateStr.split(" ");
      if (!datePart) return null;

      const [day, month, year] = datePart.split("/");
      const [hour = 0, minute = 0] = (timePart || "").split(":");

      return new Date(year, month - 1, day, hour, minute);
    }

  function formatDisplayDate(date) {
      if (!date) return "";

      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();

      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");

      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }
 
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
          // claimWarrantyDate: createdDateToISO(r.CreatedDate) || null,
          claimWarrantyDate: formatDisplayDate(parseBackendDate(r.CreatedDate)),
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

  
  const onSearch = (e) => {
    e && e.preventDefault();
    
    if ((filterStartDate && !filterEndDate) || (!filterStartDate && filterEndDate)) {
    alert("Please select BOTH Start Date and End Date.");
    return;
  }

    setCurrentPage(1);
    setWindowStart(1);
    setFetchTrigger((t) => t + 1); // triggers fetchPage effect
  };

  const exportExcel = async (fromDateParam, toDateParam) => {
  try {
    const body = {
      claim_id: leadId || null,
      fromDate: fromDateParam ?? filterStartDate ?? null,
      toDate: toDateParam ?? filterEndDate ?? null,
      dealer_code: dealerFilterCode || null,
      page: 1,
      per_page: 100000,
      is_export: true,
    };

    const token = localStorage.getItem("access_token");

    const response = await fetch(`${tyrecheck_url}/auth/claim/export_pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Export API failed");

    const data = await response.json();
    if (!data?.length) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Claims", {
      views: [{ state: "frozen", ySplit: 1 }], // ✅ FREEZE HEADER
    });

    // 🔹 Columns
    worksheet.columns = [
      { header: "ClaimWarrantyId", key: "id", width: 22 },
      { header: "DealerName", key: "dealer", width: 25 },
      { header: "DealerCode", key: "code", width: 18 },
      { header: "OutsideDamage", key: "od", width: 22 },
      { header: "InsideDamage", key: "idg", width: 22 },
      { header: "FinalDamage", key: "fd", width: 22 },
      { header: "TreadDepthGauge", key: "td", width: 20 },
      { header: "ClaimDate", key: "date", width: 22 },
      { header: "OutsideException", key: "oe", width: 22 },
      { header: "InsideException", key: "ie", width: 22 },
      { header: "FinalException", key: "fe", width: 22 },
      { header: "GaugeException", key: "ge", width: 22 },
    ];

    // 🔹 Add rows
    data.forEach((r) => {
      worksheet.addRow({
        id: r.Claim_Warranty_Id || "",
        dealer: r.Dealer_name || "",
        code: r.Dealer_Code || "",
        od: r.OutsideDamageOutput || "",
        idg: r.InsideDamageOutput || "",
        fd: r.FinalDamageOutput || "",
        td: r.TreadDepthGaugeOutput ? `${r.TreadDepthGaugeOutput} mm` : "",
        date: r.ClaimDate
          ? new Date(r.ClaimDate).toLocaleString("en-GB")
          : "",
        oe: r.OutsideException_Occurred || "",
        ie: r.InsideException_Occurred || "",
        fe: r.FinalException_Occurred || "",
        ge: r.GaugeException_Occurred || "",
      });
    });

    // 🔹 STYLE HEADER (BLUE + BOLD + WHITE)
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }, // Excel blue
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 🔹 Enable filters
    worksheet.autoFilter = {
      from: "A1",
      to: "L1",
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const from = fromDateParam || "ALL";
    const to = toDateParam || "TODAY";

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TyreCheck_Claims_${from}_to_${to}.xlsx`;
    link.click();
  } catch (err) {
    console.error(err);
    alert("Excel export failed");
  }
};

  const handleExportConfirm = () => {
  const today = new Date();
  const format = (d) => d.toISOString().slice(0, 10);

  let fromDate = null;
  let toDate = null;

  /* 🔹 LAST 1 MONTH (today - 1 month → today) */
  if (exportType === "LAST_1_MONTH") {
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    fromDate = format(lastMonth);
    toDate = format(today);
  }

  /* 🔹 FROM START (fixed start: 9 Sept 2025 → today) */
  if (exportType === "FROM_START") {
    fromDate = "2025-09-09";
    toDate = format(today);
  }

  /* 🔹 CUSTOM (both dates required) */
  if (exportType === "CUSTOM") {
    if (!exportStartDate || !exportEndDate) {
      alert("Please select BOTH Start Date and End Date");
      return;
    }

    if (exportStartDate > exportEndDate) {
      alert("Start Date cannot be greater than End Date");
      return;
    }

    fromDate = exportStartDate;
    toDate = exportEndDate;
  }

  // temporarily apply dates for export
  exportExcel(fromDate, toDate);
  setShowExportPopup(false);
};

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  const goToSummary = () => navigate("/summary");

  const [dealerOpen, setDealerOpen] = useState(false);
  const [dealerSearch, setDealerSearch] = useState("");


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

              <div 
                className="dropdown-container" 
                onClick={() => setDealerOpen(!dealerOpen)}
              >
                <div className="dropdown-selected">
                  {dealerFilterName || "All Dealers"}
                </div>

                {dealerOpen && (
                  <div className="dropdown-panel">
                    <input
                      type="text"
                      className="dropdown-search"
                      placeholder="Search dealer..."
                      value={dealerSearch}
                      onChange={(e) => setDealerSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="dropdown-list">
                      <div
                        className="dropdown-item"
                        onClick={() => {
                          setDealerFilterCode("");
                          setDealerFilterName("");
                          setDealerOpen(false);
                          setDealerSearch("");
                        }}
                      >
                        All Dealers
                      </div>

                      {dealersList
                        .filter((d) =>
                          d.name.toLowerCase().includes(dealerSearch.toLowerCase())
                        )
                        .map((d) => (
                          <div
                            key={d.code}
                            className="dropdown-item"
                            onClick={() => {
                              setDealerFilterCode(d.code);
                              setDealerFilterName(d.name);
                              setDealerOpen(false);
                              setDealerSearch("");
                            }}
                          >
                            {d.name}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="date-input"
                value={filterStartDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setFilterStartDate(newStart);

                  if (filterEndDate && newStart > filterEndDate) {
                    alert("Start date cannot be greater than End date");
                    setFilterStartDate(filterEndDate); // auto-correct
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="date-input"
                value={filterEndDate}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setFilterEndDate(newEnd);

                  if (filterStartDate && newEnd < filterStartDate) {
                    alert("End date cannot be less than Start date");
                    setFilterEndDate(filterStartDate); // auto-correct
                  }
                }}
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
                  <span>✕</span>
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
                  onClick={() => setShowExportPopup(true)}
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
            // <div style={{display:'flex',alignItems: 'center'}}>Loading...</div>
            <div className="loading-wrapper">
              <div className="loading-content">
                <img src={LoaderGif} alt="loading" className="loading-gif" />
                <div className="loading-text">Data Loading...</div>
              </div>
            </div>
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
                          <td>{row.claimWarrantyDate}</td>
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

      {showExportPopup && (
  <div className="export-overlay">
    <div className="export-modal">
      <h3>Export Options</h3>

      <label>
        <input
          type="radio"
          checked={exportType === "LAST_1_MONTH"}
          onChange={() => setExportType("LAST_1_MONTH")}
        />
        Last 1 Month
      </label>

      <label>
        <input
          type="radio"
          checked={exportType === "FROM_START"}
          onChange={() => setExportType("FROM_START")}
        />
        From Start
      </label>

      <label>
        <input
          type="radio"
          checked={exportType === "CUSTOM"}
          onChange={() => setExportType("CUSTOM")}
        />
        Custom Date
      </label>

      {exportType === "CUSTOM" && (
        <div className="custom-date">
          <input
            type="date"
            value={exportStartDate}
            onChange={(e) => setExportStartDate(e.target.value)}
          />
          <input
            type="date"
            value={exportEndDate}
            onChange={(e) => setExportEndDate(e.target.value)}
          />
        </div>
      )}

      <div className="export-actions">
        <button onClick={handleExportConfirm}>Export</button>
        <button onClick={() => setShowExportPopup(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Dashboard;
