import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Logo from "../assets/Logo.png";
import BgImage from "../assets/bg.png"; // same background used on Dashboard
import SampleImage from "../assets/image.png"; // put your image here
import "./ViewClaim.css";

const ViewClaim = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // claim metadata (passed from Dashboard or fallback)
  const claimMeta = location.state?.claim || {
    id: id || "DEL/25/045865",
    dealer: "PANCHSHEELA TYRE...",
  };

  // SAMPLE rows: each row has only one image (src is an imported asset)
  const [rows, setRows] = useState([
    {
      rowId: `${claimMeta.id}-1`,
      image: { type: "Defect", src: SampleImage },
      aiResult:
        "Unable to extract tyre defect. The image appears blurry or rotated. Kindly upload a clear, properly aligned image.",
      editAiResult: "",
      requestDate: "03/12/2025 12:33",
      remark: "",
      address: "Mumbai - Service Center 1",
      aiStatusJson: { confidence: 0.92, detected: false, reason: "blurry" },
      aiPercentage: "0"
    },
    {
      rowId: `${claimMeta.id}-2`,
      image: { type: "Gauge", src: SampleImage },
      aiResult:
        "Unable to extract gauge reading. The image appears rotated or unclear. Kindly re-send a clear, properly aligned image.",
      editAiResult: "",
      requestDate: "03/12/2025 12:33",
      remark: "",
      address: "Mumbai - Service Center 1",
      aiStatusJson: { confidence: 0.78, detected: false, reason: "angle" },
      aiPercentage: "25"
    },
    {
      rowId: `${claimMeta.id}-1`,
      image: { type: "Defect", src: SampleImage },
      aiResult:
        "Unable to extract tyre defect. The image appears blurry or rotated. Kindly upload a clear, properly aligned image.",
      editAiResult: "",
      requestDate: "03/12/2025 12:33",
      remark: "",
      address: "Mumbai - Service Center 1",
      aiStatusJson: { confidence: 0.92, detected: false, reason: "blurry" },
      aiPercentage: "0"
    }
  ]);

  // modal state
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [imageModalLabel, setImageModalLabel] = useState("");
  const [imageZoomed, setImageZoomed] = useState(false); // click-to-toggle zoom

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
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
    setImageZoomed(false); // reset zoom on open
  };

  const openJsonModal = (payload) => {
    setJsonPayload(payload);
    setJsonModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setImageModalSrc(null);
    setImageZoomed(false);
  };

  const toggleImageZoom = () => setImageZoomed(z => !z);

    const handleSubmit = () => {
    console.log("Submit rows:", rows);

    navigate("/dashboard");  // ⬅ Redirect to Dashboard
    };


  return (
    <div className="view-page">
      {/* Top Bar (same as dashboard) */}
      <header className="topbar" role="banner">
        <div className="topbar-logo">
          <img src={Logo} alt="Company logo" className="logo-img" />
        </div>

        <div className="topbar-title">Tyre Check Claim</div>

        <div className="topbar-right">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Table Section — uses same background as dashboard */}
      <section
        className="table-section"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <div className="table-card">
          <h3 style={{ textAlign: "center", margin: "8px 0 12px" }}>
            Warranty/Claim No. <strong>{claimMeta.id}</strong>
          </h3>

          <table className="claims-table" role="table" aria-label="View claim details">
            <thead>
              <tr>
                <th>Image</th>
                <th>AI Result</th>
                <th>Edited AI Result</th>
                <th>Request Date</th>
                <th>Remark</th>
                <th>Address</th>
                <th>AI Status</th>
                <th>AI Result (%)</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan="8">No data available</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.rowId}>
                    {/* single image column */}
                    <td>
                      <div className="single-image-wrap">
                        <div className="image-label">{r.image.type}</div>
                        <div
                          className="image-thumb-large"
                          role="button"
                          tabIndex={0}
                          onClick={() => openImagePreview(r.image)}
                          onKeyDown={(e) => { if (e.key === "Enter") openImagePreview(r.image); }}
                          title={`Open ${r.image.type} preview`}
                        >
                          {r.image.src ? (
                            <img src={r.image.src} alt={r.image.type} />
                          ) : (
                            <div className="image-box">No image</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ whiteSpace: "normal", maxWidth: 320 }}>{r.aiResult}</td>

                    <td>
                      <textarea
                        className="edit-ai-box"
                        value={r.editAiResult}
                        onChange={(e) => updateEditAi(idx, e.target.value)}
                        placeholder="Edit AI result..."
                      />
                    </td>

                    <td>{r.requestDate}</td>

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

                    <td style={{ whiteSpace: "normal", maxWidth: 220 }}>{r.address}</td>

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

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <button className="search-action-btn" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      </section>

      {/* Image preview modal */}
      {imageModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={closeImageModal}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{imageModalLabel}</h3>

            <div className="modal-image-wrap">
              {/* click image to toggle zoom */}
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
              <button className="modal-btn" onClick={() => setImageZoomed(z => !z)}>
                {imageZoomed ? "Zoom Out" : "Zoom In"}
              </button>
              <button className="modal-btn primary" onClick={closeImageModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* JSON modal */}
      {jsonModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setJsonModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>AI Status JSON</h3>
            <pre style={{ maxHeight: 360, overflow: "auto", textAlign: "left", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>

            <div style={{ marginTop: 12 }}>
              <button className="modal-btn close" onClick={() => setJsonModalOpen(false)} style={{ width: "100%" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewClaim;
