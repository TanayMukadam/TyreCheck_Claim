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

  const claimMeta = location.state?.claim || {
    id: id || "DEL/25/045865",
    dealer: "PANCHSHEELA TYRE...",
  };

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const claim_id = claimMeta.id;
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${tyrecheck_url}/auth/viewClaim/Claim_ID=${claim_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const result = await response.json();
        // console.log("🔵 API Response:", result);

        // map API response to table rows
        const mappedRows = (result || []).map((item, idx) => ({
  rowId: `${item.ID}-${idx}`,
  image: {
    type: item.ImageType,
    src: item.Image_name
      ? `${tyrecheck_url}/protected_claim/images/${item.folder_name}/${item.Image_name}`
      : null,
  },
  // aiResult: item.result_ai ? item.result_ai : item.Exception_Occurred,

  // aiResult: item.result_ai ? (() => {
  //         const d = item.result_ai;
  //         const [defect, finalDefect] = d.split("Final Defect:");
  //         return { defect: defect, finalDefect: finalDefect  };
  //       })() : item.Exception_Occurred,

    aiResult: item.result_ai
        ? (() => {
            const raw = item.result_ai;

            // Split on keyword
            const parts = raw.split("Final Defect:");

            // If Final Defect exists
            if (parts.length > 1) {
              const defect = parts[0].trim();
              const finalDefectValue = parts[1].trim();

              return {
                defect: defect,
                finalDefect: `Final Defect: ${finalDefectValue}`,
              };
            }

            // If no Final Defect exists
            return {
              defect: raw,
              finalDefect: "",
            };
          })()
        : {
            defect: item.Exception_Occurred,
            finalDefect: "",
          },



  editAiResult: item.CorrectedValue || "",
  // requestDate: item.Request_Date
  //   ? new Date(item.Request_Date).toLocaleString()
  //   : "",
  requestDate: item.Request_Date
      ? (() => {
          const d = new Date(item.Request_Date).toLocaleString();
          const [date, time] = d.split(",");
          return { date: date.trim(), time: time.trim() };
        })()
      : { date: "", time: "" },

  remark: item.Remark || "",
  address: item.Address || "",
  aiStatusJson: item.ai_api_output
    ? JSON.parse(item.ai_api_output.replace(/'/g, '"'))
    : {},
  aiPercentage: item.Result_percentage?.toString() || "0",
}));

// console.log("--- Mapped Rows:", mappedRows);
setRows(mappedRows);
      } catch (err) {
        console.error("❌ API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [claimMeta.id]);
  
  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  };

  const handleBack = () => {
    navigate("/dashboard", { replace: true });
  };

  const updateEditAi = (index, text) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], editAiResult: text };
      return next;
    });
  };

  const updateAiPercent = (index, percent) => {
    setRows(prev => {
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

  const toggleImageZoom = () => setImageZoomed(z => !z);

  const openJsonModal = (payload) => {
    setJsonPayload(payload);
    setJsonModalOpen(true);
  };

  const handleSubmit = () => {
    // console.log("Submit rows:", rows);
    navigate("/dashboard");
  };

  return (
    <div className="view-page" style={{background: "linear-gradient(to bottom, #e9efe8 0%, #c7d9b0 40%, #8eb66a 100%)",}}>
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-logo">
          <img src={Logo} alt="Company logo" className="logo-img" />
        </div>
        <div className="topbar-title">Tyre Check Claim</div>
        <div className="topbar-right">
          <button className="logout-btn" onClick={handleBack}>Back</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <h3 style={{ textAlign: "center" }}>
            Warranty/Claim No. <strong style={{ textAlign: "center", margin: "8px 0 12px",backgroundColor:"#f0f000" }}>{claimMeta.id}</strong>
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
                          <div className="image-label">{r.image.type}</div>
                          <div
                            className="image-thumb-large"
                            role="button"
                            tabIndex={0}
                            onClick={() => r.image.src && openImagePreview(r.image)}
                          >
                            {r.image.src ? <img src={r.image.src} alt={r.image.type} /> : <div className="image-box">No image</div>}
                          </div>
                        </div>
                      </td>
                      {/* <td style={{ whiteSpace: "normal", maxWidth: 320 }}>{r.aiResult}</td> */}
                      <td className="wrap-date">
                        <div>{r.aiResult.defect}</div>
                        <div style={{width:"100%",color:"#000",marginTop:"5%"}}>
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
                      {/* <td>{r.requestDate}</td> */}
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
                            setRows(prev => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], remark: val };
                              return next;
                            });
                          }}
                          placeholder="Remark"
                        />
                      </td>
                      {/* <td style={{ whiteSpace: "normal", maxWidth: 220 }}>{r.address}</td> */}
                      <td >
                        <button className="view-action"  onClick={() => openJsonModal(r.aiStatusJson)}>View</button>
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
            <button className="search-action-btn" onClick={handleSubmit}>Submit</button>
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
              <button className="modal-btn" onClick={toggleImageZoom}>{imageZoomed ? "Zoom Out" : "Zoom In"}</button>
              <button className="modal-btn primary" onClick={closeImageModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {jsonModalOpen && (
        <div className="modal-backdrop" onClick={() => setJsonModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>AI Status JSON</h3>
            <pre style={{ maxHeight: "90%", overflow: "auto", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
            <button className="modal-btn close" onClick={() => setJsonModalOpen(false)} style={{ width: "30%", alignSelf:'center',backgroundColor: "#FF0000",color: "#FFF"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewClaim;
