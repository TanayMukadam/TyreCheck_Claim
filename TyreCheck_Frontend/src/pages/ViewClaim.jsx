import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Logo from "../assets/Logo.png";
import BgImage from "../assets/bg.png";
import "./ViewClaim.css";
import tyrecheck_url from "../constants/tyrecheck.constants.js";

const ViewClaim = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal states
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [imageModalLabel, setImageModalLabel] = useState("");
  const [imageZoomed, setImageZoomed] = useState(false);

  // claim metadata (prefer nav state, fallback to param)
  const claimMeta = location.state?.claim || {
    id: id || "DEL/25/045865",
    dealer: "PANCHSHEELA TYRE...",
  };

  // set dynamic document title based on claim id (so opened tabs show proper title)
  useEffect(() => {
    const titleId = claimMeta?.id || id || "Claim Details";
    document.title = `Claim ${titleId}`;
    return () => {
      // optional: revert title if you want; commented out to keep context
      // document.title = "TyreCheck Claim";
    };
  }, [claimMeta.id, id]);

  useEffect(() => {
    let mounted = true;

    const fetchClaim = async () => {
      setLoading(true);
      setError(null);
      try {
        const claim_id = claimMeta.id;
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${tyrecheck_url}/auth/viewClaim/Claim_ID=${encodeURIComponent(claim_id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) {
          const txt = await response.text().catch(() => null);
          throw new Error(txt || `${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // map API response to table rows
        const mappedRows = (result || []).map((item, idx) => {
          // safe parse ai_api_output
          let aiStatusJson = {};
          if (item.ai_api_output) {
            try {
              aiStatusJson = JSON.parse(String(item.ai_api_output).replace(/'/g, '"'));
            } catch (e) {
              aiStatusJson = { parseError: true, raw: item.ai_api_output };
            }
          }

          // normalize request date (split date/time)
          let requestDate = { date: "", time: "" };
          if (item.Request_Date) {
            try {
              const d = new Date(item.Request_Date);
              if (!isNaN(d)) {
                const locale = d.toLocaleString();
                const [datePart, timePart] = locale.split(",");
                requestDate = {
                  date: (datePart || "").trim(),
                  time: (timePart || "").trim(),
                };
              } else {
                // fallback: string split if DB returned a dd/mm/yyyy string
                const s = String(item.Request_Date);
                requestDate = { date: s, time: "" };
              }
            } catch {
              requestDate = { date: String(item.Request_Date), time: "" };
            }
          }

          // parse AI result into defect / finalDefect
          const rawAi = item.result_ai ?? item.Exception_Occurred ?? "";
          let aiResult;
          if (rawAi && typeof rawAi === "string") {
            const parts = rawAi.split("Final Defect:");
            if (parts.length > 1) {
              aiResult = {
                defect: parts[0].trim(),
                finalDefect: `Final Defect: ${parts[1].trim()}`,
              };
            } else {
              aiResult = { defect: rawAi.trim(), finalDefect: "" };
            }
          } else {
            aiResult = { defect: String(rawAi), finalDefect: "" };
          }

          return {
            rowId: `${item.ID ?? idx}-${idx}`,
            image: {
              type: item.ImageType ?? "",
              src:
                item.Image_name && item.folder_name
                  ? `${tyrecheck_url}/protected_claim/images/${item.folder_name}/${item.Image_name}`
                  : null,
            },
            aiResult,
            editAiResult: item.CorrectedValue ?? "",
            requestDate,
            remark: item.Remark ?? "",
            address: item.Address ?? "",
            aiStatusJson,
            aiPercentage: item.Result_percentage != null ? String(item.Result_percentage) : "0",
          };
        });

        if (mounted) {
          setRows(mappedRows);
        }
      } catch (err) {
        console.error("❌ API Error:", err);
        if (mounted) setError(err.message || "Failed to load claim");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchClaim();

    return () => {
      mounted = false;
    };
  }, [claimMeta.id]);

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  const handleBack = () => {
    // navigate("/dashboard", { replace: true });
    window.close()
  };

  const updateEditAi = (index, text) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], editAiResult: text };
      return next;
    });
  };

  const updateAiPercent = (index, percent) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], aiPercentage: percent };
      return next;
    });
  };

  const openImagePreview = (img) => {
    setImageModalSrc(img.src);
    setImageModalLabel(img.type);
    setImageModalOpen(true);
    setImageZoomed(false);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setImageModalSrc(null);
    setImageZoomed(false);
  };

  const toggleImageZoom = () => setImageZoomed((z) => !z);

  const openJsonModal = (payload) => {
    setJsonPayload(payload);
    setJsonModalOpen(true);
  };

  const handleSubmit = () => {
    // Currently the original behavior navigated back to dashboard.
    // You can extend this to send rows back to backend before navigating.
    navigate("/dashboard");
  };

  return (
    <div
      className="view-page"
      style={{
        background: "linear-gradient(to bottom, #e9efe8 0%, #c7d9b0 40%, #8eb66a 100%)",
      }}
    >
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-logo">
          <img src={Logo} alt="Company logo" className="logo-img" />
        </div>
        <div className="topbar-title">Tyre Check Claim</div>
        <div className="topbar-right">
          <button className="logout-btn" onClick={handleBack}>
            Close X
          </button>
          {/* <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button> */}
        </div>
      </header>

      <h3 style={{ textAlign: "center" }}>
        Warranty/Claim No.{" "}
        <strong
          style={{
            textAlign: "center",
            margin: "8px 0 12px",
            backgroundColor: "#f0f000",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {claimMeta.id}
        </strong>
      </h3>

      {/* Table Section */}
      <section className="table-section">
        <div className="table-card">
          {loading ? (
            <p style={{ textAlign: "center" }}>Loading...</p>
          ) : error ? (
            <p style={{ textAlign: "center", color: "red" }}>Error: {error}</p>
          ) : (
            <table className="claims-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Image-Type</th>
                  <th>AI Result</th>
                  <th>Edited AI Result</th>
                  <th>Request Date</th>
                  <th>Remark</th>
                  <th>AI Status</th>
                  <th>AI Result (%)</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="8">No data available</td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.rowId}>
                      <td>
                        <div className="single-image-wrap">
                          
                          <div
                            className="image-thumb-large"
                            role="button"
                            tabIndex={0}
                            onClick={() => r.image.src && openImagePreview(r.image)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                r.image.src && openImagePreview(r.image);
                              }
                            }}
                          >
                            {r.image.src ? (
                              <img src={r.image.src} alt={r.image.type} />
                            ) : (
                              <div className="image-box">No image</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="wrap-image-type">
                          {r.image.type}
                      </td>
                      <td className="wrap-date">
                        <div>{r.aiResult.defect}</div>
                        <div style={{ width: "100%", color: "#000", marginTop: "5%" }}>
                          <strong>{r.aiResult.finalDefect}</strong>
                        </div>
                      </td>

                      <td>
                        <textarea
                          className="edit-ai-box"
                          value={r.editAiResult}
                          onChange={(e) => updateEditAi(idx, e.target.value)}
                          placeholder="Edit AI result..."
                        />
                      </td>

                      <td className="wrap-date">
                        <div>{r.requestDate.date}</div>
                        <div>{r.requestDate.time}</div>
                      </td>

                      <td>
                        <input
                          className="lead-input"
                          value={r.remark}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], remark: val };
                              return next;
                            });
                          }}
                          placeholder="Remark"
                        />
                      </td>

                      <td>
                        <button className="view-action" onClick={() => openJsonModal(r.aiStatusJson)}>
                          View
                        </button>
                      </td>

                      <td>
                        <select
                          className="select-input"
                          value={r.aiPercentage}
                          onChange={(e) => updateAiPercent(idx, e.target.value)}
                        >
                          <option value="0">0%</option>
                          <option value="25">25%</option>
                          <option value="50">50%</option>
                          <option value="75">75%</option>
                          <option value="100">100%</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <button className="search-action-btn" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="modal-backdrop" onClick={closeImageModal}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>{imageModalLabel}</h3>
            <div className="modal-image-wrap">
              {imageModalSrc ? (
                <img
                  src={imageModalSrc}
                  alt={imageModalLabel}
                  className={imageZoomed ? "zoomed" : ""}
                  onClick={toggleImageZoom}
                  style={{ cursor: imageZoomed ? "zoom-out" : "zoom-in" }}
                />
              ) : (
                <div style={{ padding: 40, background: "#f4f4f4", borderRadius: 8 }}>No image</div>
              )}
            </div>
            <div className="modal-controls">
              <button className="modal-btn" onClick={toggleImageZoom}>
                {imageZoomed ? "Zoom Out" : "Zoom In"}
              </button>
              <button className="modal-btn primary" onClick={closeImageModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {jsonModalOpen && (
        <div className="modal-backdrop" onClick={() => setJsonModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>AI Status JSON</h3>
            <pre
              style={{
                maxHeight: "70vh",
                overflow: "auto",
                background: "#f6f6f6",
                padding: 12,
                borderRadius: 8,
              }}
            >
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
            <button
              className="modal-btn close"
              onClick={() => setJsonModalOpen(false)}
              style={{ width: "30%", alignSelf: "center", backgroundColor: "#FF0000", color: "#FFF" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewClaim;
