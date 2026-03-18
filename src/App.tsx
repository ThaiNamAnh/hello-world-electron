import { useState, useRef, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

const ITEMS_PER_PAGE = 8; // 4 cột x 2 hàng = 8 biểu đồ/trang
const GRID_COLS = 4; // Giữ nguyên 4 cột
const GROUPS_KEY = "stock-groups"; // Key lưu danh sách nhóm ngành vào localStorage
const FAVORITES_KEY = "stock-favorites"; // Key lưu danh sách mã yêu thích
const FILTER_KEY = "stock-filter-mode"; // Key lưu chế độ lọc

const JSON_EXAMPLE = `[
  {
    "name": "Ngân hàng",
    "codes": ["BID", "VCB", "TCB"]
  },
  {
    "name": "Chứng khoán",
    "codes": ["SSI", "VCI", "VND"]
  }
]`;

interface StockGroup {
    id: string;
    name: string;
    codes: string[];
}

const DEFAULT_GROUPS: StockGroup[] = [
    {
        id: "1",
        name: "Ngân hàng",
        codes: [
            "VCB",
            "BID",
            "CTG",
            "TCB",
            "VPB",
            "MBB",
            "ACB",
            "SSB",
            "STB",
            "HDB",
            "VIB",
            "TPB",
            "SHB",
            "OCB",
            "MSB",
            "EIB",
            "LPB",
        ],
    },
    {
        id: "2",
        name: "Bất động sản",
        codes: [
            "VHM",
            "VIC",
            "VRE",
            "NVL",
            "KDH",
            "PDR",
            "DIG",
            "NLG",
            "DXG",
            "TCH",
            "VPI",
            "HDC",
            "KHG",
            "CRE",
            "IJC",
            "HDG",
            "AGG",
        ],
    },
    {
        id: "3",
        name: "Dịch vụ tài chính (Chứng khoán)",
        codes: [
            "SSI",
            "VND",
            "VCI",
            "HCM",
            "VIX",
            "FTS",
            "BSI",
            "CTS",
            "AGR",
            "ORS",
            "TVS",
        ],
    },
    {
        id: "4",
        name: "Tài nguyên cơ bản (Thép)",
        codes: ["HPG", "HSG", "NKG"],
    },
    {
        id: "5",
        name: "Thực phẩm và Đồ uống",
        codes: [
            "VNM",
            "MSN",
            "SAB",
            "KDC",
            "SBT",
            "PAN",
            "DBC",
            "HAG",
            "BAF",
            "ANV",
            "IDI",
            "ASM",
        ],
    },
    {
        id: "6",
        name: "Xây dựng và Vật liệu",
        codes: [
            "VCG",
            "CII",
            "CTD",
            "HT1",
            "HHV",
            "BMP",
            "LCG",
            "G36",
            "C4G",
            "KSB",
            "NTP",
        ],
    },
    {
        id: "7",
        name: "Hóa chất",
        codes: ["DGC", "DCM", "DPM", "AAA", "DPR"],
    },
    {
        id: "8",
        name: "Bán lẻ",
        codes: ["MWG", "PNJ", "FRT", "DGW"],
    },
    {
        id: "9",
        name: "Dầu khí",
        codes: ["GAS", "PLX", "PVD", "PVT", "BSR", "PVS", "OIL", "PVC"],
    },
    {
        id: "10",
        name: "Hàng và Dịch vụ công nghiệp",
        codes: ["GEX", "REE", "GMD", "HAH", "VOS", "PC1", "ACV", "PET"],
    },
    {
        id: "11",
        name: "Công nghệ thông tin",
        codes: ["FPT", "CMG", "ELC"],
    },
    {
        id: "12",
        name: "Tiện ích (Điện, Nước)",
        codes: ["POW", "NT2", "GEG", "TDM", "GEE", "GEX"],
    },
    {
        id: "13",
        name: "Bảo hiểm",
        codes: ["BVH", "BMI"],
    },
    {
        id: "14",
        name: "Du lịch và Giải trí",
        codes: ["VJC", "HVN", "VPL"],
    },
    {
        id: "15",
        name: "Viễn thông",
        codes: ["VGI"],
    },
    {
        id: "16",
        name: "Bất động sản công nghiệp",
        codes: ["IDC", "KBC", "GVR", "SIP", "SZC", "VGC", "PHR", "BCM"],
    },
];

// CSS to inject into webviews to show ONLY the chart AND the Detail Box
const CHART_FOCUS_CSS = `
  /* 1. Reset cơ bản */
  html, body {
    background-color: #131722 !important; /* Nền tối */
    overflow: hidden !important;
    margin: 0 !important;
  }

  /* 2. Ẩn các thành phần rác của trang gốc */
  /* LƯU Ý: Đã xóa .stock-overview khỏi danh sách ẩn để xử lý riêng bên dưới */
  header, footer, nav,
  [class*="ads"], [class*="banner"],
  .mess_support, .zalo-chat-widget, #chat-widget-container,
  .box-contact, .header-mobile,
  .financial-report-box, .foreign-transactions, .list-table {
    display: none !important;
    z-index: -9999 !important;
  }

  /* 3. XỬ LÝ DETAIL BOX (Header thông tin giá) */
  .stock-overview {
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 85px !important; /* Chiều cao cố định cho phần thông tin */
    background-color: #ffffffff !important;
    z-index: 2147483648 !important; /* Lớp cao nhất */
    padding: 0 !important;
    margin: 0 !important;
    border-bottom: 1px solid #2a2e39 !important;
    overflow: hidden !important;
  }

  /* Ẩn tất cả các con của stock-overview (như list-table, summary...) TRỪ detail-box */
  .stock-overview > div:not(.detail-box):not(#detail-box) {
    display: none !important;
  }

  /* Style cho detail-box để hiển thị đẹp gọn */
  .detail-box, #detail-box {
    display: flex !important;
    flex-direction: row !important;
    justify-content: start !important;
    height: 100% !important;
    background: transparent !important;
  }

  .detail-box .info-box {
    transform: scale(0.8) !important;
  }

  .detail-box .info-box .action-box {
    display: none !important;
  }

  .detail-box .price-box .price-detail {
    display: flex !important;
    flex-direction: column !important;
    transform: scale(0.8) !important;
  }

  .detail-box .extra-info-box {
    display: flex !important;
    flex-direction: column !important;
    transform: scale(0.8) !important;
  }

  /* 4. Cấu hình container chart (Đẩy xuống dưới detail-box) */
  .stock-chart {
    position: fixed !important;
    top: 85px !important; /* Đẩy xuống bằng chiều cao header */
    left: 0 !important;
    width: 100vw !important;
    height: calc(100vh - 85px) !important; /* Trừ đi phần header */
    z-index: 2147483647 !important;
    background-color: #ffffffff !important; /* Nền tối đồng bộ */
    padding: 4px !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* 5. XỬ LÝ HEADER GIÁ & NÚT THỜI GIAN (Fix lỗi mất dữ liệu khi full màn) */
  
  /* 5.1. Hiện dòng thông tin giá (được nhận diện qua style justify-content) */
  .stock-chart > div[style*="justify-content"] {
    display: flex !important;
    flex-shrink: 0 !important;
    margin-bottom: 2px !important;
  }
  .stock-chart > div[style*="justify-content"] * {
    color: #e0e3eb !important; /* Chữ màu sáng */
    font-size: 13px !important; /* Chỉnh lại font cho gọn */
  }

  /* 5.2. Hiện lại .stock-box-head nhưng chỉnh sửa để chỉ hiện nút lọc (1D, 1W...) */
  .stock-chart > .stock-box-head {
    display: flex !important; /* Bắt buộc hiện lại */
    align-items: center !important;
    justify-content: flex-end !important; /* Đẩy sang phải hoặc giữa tùy ý */
    background: transparent !important;
    padding: 0 !important;
    margin: 0 0 5px 0 !important;
    height: 30px !important;
    min-height: 0 !important;
  }

  /* Ẩn tiêu đề to (Ví dụ: VNM - Vinamilk...) bên trong header chart vì đã có Detail Box ở trên */
  .stock-chart > .stock-box-head > .title-stock, 
  .stock-chart > .stock-box-head > h2,
  .stock-chart > .stock-box-head > span {
    display: none !important;
  }

  /* CHỈ HIỆN nút lọc thời gian (class thường là .list-filter) */
  .stock-chart > .stock-box-head > .list-filter {
    display: flex !important;
    transform: scale(0.9); /* Thu nhỏ lại chút cho đẹp */
    transform-origin: right center;
  }

  /* 5.3. Fix Highcharts Container */
  #chart-sync-container {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    width: 100% !important;
    height: 100% !important;
  }

  /* Ẩn chart box thứ 2 trở đi */
  #chart-sync-container > .chart-box:nth-of-type(n+2) {
    display: none !important;
  }

  /* Ép chart box 1 và SVG bên trong bung full */
  #chart-sync-container > .chart-box:nth-of-type(1),
  .highcharts-container,
  .highcharts-root {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

// JS to scroll to chart, force resize and make it full-screen
const CHART_FOCUS_JS = `
  (function() {
    function focusChart() {
      // Logic cũ: tìm .stock-chart và ép style (đã được CSS handle phần lớn, JS chỉ hỗ trợ trigger resize)
      var chartEl = document.querySelector('.stock-chart');
      
      // Xóa quảng cáo cứng đầu
      document.querySelectorAll('.modal, .modal-backdrop, [class*="popup"], [id^="ads"]').forEach(e => e.remove());
      
      // Trigger sự kiện resize để thư viện Highcharts vẽ lại
      window.dispatchEvent(new Event('resize'));
    }

    // Chạy liên tục trong 5 giây đầu để đảm bảo bắt kịp tốc độ load
    focusChart();
    var count = 0;
    var interval = setInterval(function() {
        focusChart();
        count++;
        if (count > 10) clearInterval(interval);
    }, 500);

    // Lắng nghe sự kiện resize của window (khi user phóng to app)
    window.addEventListener('resize', function() {
        setTimeout(focusChart, 100); 
    });
  })();
`;

// Component for a single webview card - creates webview via DOM API
function WebviewCard({
    code,
    syncEnabledRef,
    webviewMapRef,
    isSyncingRef,
    isFavorite,
    onToggleFavorite,
    onDelete,
    isDuplicate,
    groupName,
}: {
    code: string;
    syncEnabledRef: React.MutableRefObject<boolean>;
    webviewMapRef: React.MutableRefObject<Map<string, any>>;
    isSyncingRef: React.MutableRefObject<boolean>;
    isFavorite: boolean;
    onToggleFavorite: (code: string) => void;
    onDelete: (code: string) => void;
    isDuplicate: boolean;
    groupName?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Create webview element programmatically
        const webview = document.createElement("webview") as any;
        webview.src = `https://24hmoney.vn/stock/${code}`;
        webview.style.width = "100%";
        webview.style.height = "100%";
        webview.setAttribute("allowpopups", "true");
        container.appendChild(webview);

        webviewMapRef.current.set(code, webview);

        webview.addEventListener("dom-ready", () => {
            try {
                webview.insertCSS(CHART_FOCUS_CSS);
            } catch (e) {
                console.error(e);
            }
            try {
                webview.executeJavaScript(CHART_FOCUS_JS);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);

            // Inject sync scripts
            try {
                webview.executeJavaScript(`
          (function() {
            if (window.__syncSetup) return;
            window.__syncSetup = true;

            document.addEventListener('click', function(e) {
              if (window.__isSyncedAction) return;
              var relX = e.clientX / window.innerWidth;
              var relY = e.clientY / window.innerHeight;
              console.log('__SYNC__' + JSON.stringify({
                type: 'click', code: '${code}', relX: relX, relY: relY
              }));
            }, true);

            var scrollTimer = null;
            window.addEventListener('scroll', function() {
              if (window.__isSyncedAction) return;
              if (scrollTimer) return;
              scrollTimer = setTimeout(function() {
                scrollTimer = null;
                var el = document.scrollingElement || document.documentElement;
                console.log('__SYNC__' + JSON.stringify({
                  type: 'scroll', code: '${code}',
                  scrollTop: el.scrollTop, scrollLeft: el.scrollLeft
                }));
              }, 80);
            }, true);
          })();
        `);
            } catch (e) {
                console.error(e);
            }
        });

        webview.addEventListener("console-message", (event: any) => {
            const msg = event.message;
            if (!msg || !msg.startsWith("__SYNC__")) return;
            if (!syncEnabledRef.current || isSyncingRef.current) return;

            try {
                const data = JSON.parse(msg.substring(8));
                isSyncingRef.current = true;

                if (data.type === "click") {
                    webviewMapRef.current.forEach(
                        (otherWv: any, otherCode: string) => {
                            if (otherCode !== data.code) {
                                try {
                                    otherWv.executeJavaScript(`
                  (function() {
                    window.__isSyncedAction = true;
                    var x = ${data.relX} * window.innerWidth;
                    var y = ${data.relY} * window.innerHeight;
                    var el = document.elementFromPoint(x, y);
                    if (el) { el.click(); }
                    setTimeout(function() { window.__isSyncedAction = false; }, 200);
                  })();
                `);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        },
                    );
                }

                if (data.type === "scroll") {
                    webviewMapRef.current.forEach(
                        (otherWv: any, otherCode: string) => {
                            if (otherCode !== data.code) {
                                try {
                                    otherWv.executeJavaScript(`
                  (function() {
                    window.__isSyncedAction = true;
                    var el = document.scrollingElement || document.documentElement;
                    el.scrollTop = ${data.scrollTop};
                    el.scrollLeft = ${data.scrollLeft};
                    setTimeout(function() { window.__isSyncedAction = false; }, 100);
                  })();
                `);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        },
                    );
                }

                setTimeout(() => {
                    isSyncingRef.current = false;
                }, 300);
            } catch (err) {
                // ignore
            }
        });

        return () => {
            // Cleanup on unmount
            webviewMapRef.current.delete(code);
            if (container.contains(webview)) {
                container.removeChild(webview);
            }
        };
    }, [code]);

    function handleReload() {
        const wv = webviewMapRef.current.get(code);
        if (wv) {
            setLoading(true);
            try {
                wv.reload();
            } catch (e) {
                console.error(e);
            }
        }
    }

    return (
        <div className="webview-card" data-code={code}>
            <div className="webview-card-header">
                <div
                    className="stock-code-label clickable"
                    onClick={() => onToggleFavorite(code)}
                    title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                    <span
                        className={`favorite-star ${isFavorite ? "active" : ""}`}
                    >
                        {isFavorite ? "★" : "☆"}
                    </span>
                    {code}
                    {groupName && (
                        <span className="group-name-label">({groupName})</span>
                    )}
                    {isDuplicate && (
                        <span
                            className="duplicate-warning"
                            title="Mã này bị trùng lặp ở nhóm khác"
                        >
                            ⚠️
                        </span>
                    )}
                </div>
                <div className="webview-actions">
                    <button
                        className="webview-action-btn"
                        title="Tải lại"
                        onClick={handleReload}
                    >
                        🔄
                    </button>
                    <button
                        className="webview-action-btn btn-delete"
                        title="Xóa mã này"
                        onClick={() => onDelete(code)}
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="webview-container" ref={containerRef}>
                {loading && (
                    <div className="webview-loading">
                        <div className="loading-spinner" />
                        <span className="loading-text">Đang tải {code}...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sector Column Component ──
function SectorColumn({
    group,
    favoriteCodes,
    onToggleFavorite,
    onUpdateName,
    onDeleteGroup,
    onAddCode,
    onDeleteCode,
    duplicateCodes,
}: {
    group: StockGroup;
    favoriteCodes: string[];
    onToggleFavorite: (code: string) => void;
    onUpdateName: (id: string, name: string) => void;
    onDeleteGroup: (id: string) => void;
    onAddCode: (id: string, code: string) => void;
    onDeleteCode: (id: string, code: string) => void;
    duplicateCodes: Set<string>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const [newCode, setNewCode] = useState("");

    function handleSaveName() {
        const trimmed = editName.trim();
        if (trimmed) onUpdateName(group.id, trimmed);
        setIsEditing(false);
    }

    function handleAddCode() {
        const code = newCode.trim().toUpperCase();
        if (code && /^[A-Z0-9]+$/.test(code)) {
            onAddCode(group.id, code);
            setNewCode("");
        }
    }

    return (
        <div className="sector-column">
            {/* Column Header */}
            <div className="sector-header">
                {isEditing ? (
                    <input
                        className="sector-name-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName();
                        }}
                        autoFocus
                    />
                ) : (
                    <span
                        className="sector-name"
                        onClick={() => {
                            setEditName(group.name);
                            setIsEditing(true);
                        }}
                    >
                        {group.name}
                    </span>
                )}
                <button
                    className="sector-delete-btn"
                    title="Xóa nhóm"
                    onClick={() => onDeleteGroup(group.id)}
                >
                    ✕
                </button>
            </div>

            {/* Code Tags */}
            <div className="sector-codes">
                {group.codes.map((code) => {
                    const isFavorite = favoriteCodes.includes(code);
                    return (
                        <div
                            key={code}
                            className={`code-tag ${isFavorite ? "is-favorite" : ""}`}
                        >
                            <div
                                className="code-tag-main clickable"
                                onClick={() => onToggleFavorite(code)}
                                title={
                                    isFavorite
                                        ? "Bỏ yêu thích"
                                        : "Thêm vào yêu thích"
                                }
                            >
                                <span
                                    className={`favorite-star ${isFavorite ? "active" : ""}`}
                                >
                                    {isFavorite ? "★" : "☆"}
                                </span>
                                <span className="code-tag-text">{code}</span>
                                {duplicateCodes.has(code) && (
                                    <span
                                        className="duplicate-warning"
                                        title="Mã này bị trùng lặp ở nhóm khác"
                                    >
                                        ⚠️
                                    </span>
                                )}
                            </div>
                            <button
                                className="code-tag-remove"
                                onClick={() => onDeleteCode(group.id, code)}
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Code Input */}
            <div className="sector-add">
                <input
                    className="sector-add-input"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCode();
                    }}
                    placeholder="Thêm mã..."
                />
                <button className="sector-add-btn" onClick={handleAddCode}>
                    +
                </button>
            </div>
        </div>
    );
}

// ── Main App ──
function App() {
    const [groups, setGroups] = useState<StockGroup[]>(() => {
        try {
            const saved = localStorage.getItem(GROUPS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {
            /* ignore */
        }
        return DEFAULT_GROUPS;
    });
    const [favoriteCodes, setFavoriteCodes] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);
            if (saved) return JSON.parse(saved);
        } catch {
            /* ignore */
        }
        return [];
    });
    const [filterMode, setFilterMode] = useState<"all" | "favorites">(() => {
        const saved = localStorage.getItem(FILTER_KEY);
        return saved === "favorites" || saved === "all" ? saved : "all";
    });
    const [stockCodes, setStockCodes] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [syncEnabled, setSyncEnabled] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureStatus, setCaptureStatus] = useState("");
    const [isImportingJson, setIsImportingJson] = useState(false);
    const [importJsonText, setImportJsonText] = useState("");

    const syncEnabledRef = useRef(false);
    const webviewMapRef = useRef<Map<string, any>>(new Map());
    const isSyncingRef = useRef(false);

    useEffect(() => {
        syncEnabledRef.current = syncEnabled;
    }, [syncEnabled]);

    // Auto-save groups to localStorage
    useEffect(() => {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    }, [groups]);

    useEffect(() => {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteCodes));
    }, [favoriteCodes]);

    useEffect(() => {
        localStorage.setItem(FILTER_KEY, filterMode);
    }, [filterMode]);

    // Reactive filtering: Update stockCodes when filterMode or favorites change while in chart view
    useEffect(() => {
        if (stockCodes.length > 0) {
            const allCodes = groups.flatMap((g) => g.codes);
            let uniqueCodes = [...new Set(allCodes)];

            if (filterMode === "favorites") {
                uniqueCodes = uniqueCodes.filter((code) =>
                    favoriteCodes.includes(code),
                );
            }

            // Update stockCodes if they've changed
            setStockCodes((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(uniqueCodes)) {
                    setCurrentPage(1);
                    return uniqueCodes;
                }
                return prev;
            });
        }
    }, [filterMode, favoriteCodes, groups, stockCodes.length]);

    const totalPages = Math.ceil(stockCodes.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentCodes = stockCodes.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
    );
    const gridRows = Math.ceil(currentCodes.length / GRID_COLS);

    const duplicateCodes = useMemo(() => {
        const counts = new Map<string, number>();
        groups.forEach((g) => {
            g.codes.forEach((c) => counts.set(c, (counts.get(c) || 0) + 1));
        });
        const duplicates = new Set<string>();
        counts.forEach((count, code) => {
            if (count > 1) duplicates.add(code);
        });
        return duplicates;
    }, [groups]);

    const codeToGroupNames = useMemo(() => {
        const mapping = new Map<string, string[]>();
        groups.forEach((g) => {
            g.codes.forEach((c) => {
                const existing = mapping.get(c) || [];
                if (!existing.includes(g.name)) {
                    mapping.set(c, [...existing, g.name]);
                }
            });
        });
        return mapping;
    }, [groups]);

    // ── Group CRUD ──
    function handleAddGroup() {
        const newGroup: StockGroup = {
            id: String(Date.now()),
            name: "Ngành mới",
            codes: [],
        };
        setGroups((prev) => [...prev, newGroup]);
    }

    function handleDeleteGroup(id: string) {
        setGroups((prev) => prev.filter((g) => g.id !== id));
    }

    function handleUpdateGroupName(id: string, name: string) {
        setGroups((prev) =>
            prev.map((g) => (g.id === id ? { ...g, name } : g)),
        );
    }

    function handleAddCodeToGroup(groupId: string, code: string) {
        setGroups((prev) =>
            prev.map((g) => {
                if (g.id !== groupId) return g;
                if (g.codes.includes(code)) return g;
                return { ...g, codes: [...g.codes, code] };
            }),
        );
    }

    function handleToggleFavorite(code: string) {
        setFavoriteCodes((prev) =>
            prev.includes(code)
                ? prev.filter((c) => c !== code)
                : [...prev, code],
        );
    }

    function handleDeleteCodeFromGroup(groupId: string, code: string) {
        setGroups((prev) =>
            prev.map((g) => {
                if (g.id !== groupId) return g;
                return { ...g, codes: g.codes.filter((c) => c !== code) };
            }),
        );
    }

    function handleImportJson() {
        try {
            const parsed = JSON.parse(importJsonText);
            if (!Array.isArray(parsed)) {
                alert("Dữ liệu phải là một mảng []");
                return;
            }

            // Basic validation
            const isValid = parsed.every(
                (item) =>
                    item &&
                    typeof item.name === "string" &&
                    Array.isArray(item.codes),
            );

            if (!isValid) {
                alert(
                    'Dữ liệu không đúng định dạng. Mỗi nhóm cần có "name" (string) và "codes" (array).',
                );
                return;
            }

            // Re-generate IDs to avoid conflicts
            const newGroups: StockGroup[] = parsed.map((g, idx) => ({
                id: String(Date.now() + idx),
                name: g.name,
                codes: g.codes.map((c: any) => String(c).toUpperCase()),
            }));

            setGroups((prev) => [...prev, ...newGroups]);
            setIsImportingJson(false);
            setImportJsonText("");
            alert("Đã nhập dữ liệu thành công!");
        } catch (err) {
            alert("JSON không hợp lệ: " + (err as Error).message);
        }
    }

    // ── Chart viewing ──
    function handleViewCharts() {
        const allCodes = groups.flatMap((g) => g.codes);
        let uniqueCodes = [...new Set(allCodes)];

        if (filterMode === "favorites") {
            uniqueCodes = uniqueCodes.filter((code) =>
                favoriteCodes.includes(code),
            );
        }

        if (uniqueCodes.length > 0) {
            webviewMapRef.current.clear();
            setStockCodes(uniqueCodes);
            setCurrentPage(1);
        }
    }

    function handleBackToEdit() {
        webviewMapRef.current.clear();
        setStockCodes([]);
        setCurrentPage(1);
    }

    function handleDeleteCode(code: string) {
        webviewMapRef.current.delete(code);
        setStockCodes((prev) => prev.filter((c) => c !== code));
    }

    // ── Time filter: click period button + "Xem giá điều chỉnh" in all webviews ──
    function handleTimeFilter(period: string) {
        webviewMapRef.current.forEach((wv: any) => {
            try {
                wv.executeJavaScript(`
          (function() {
            // 1. Click the time period button (6M, 1Y, 5Y)
            var items = document.querySelectorAll('.stock-period-list .stock-period-item');
            for (var i = 0; i < items.length; i++) {
              if (items[i].textContent.trim() === '${period}') {
                items[i].click();
                break;
              }
            }
            // 2. Click "Xem giá điều chỉnh" button
            setTimeout(function() {
              var btn = document.querySelector('.view-fixed-price .btn-view-fixed-price');
              if (btn && btn.textContent.trim() === 'Xem giá điều chỉnh') {
                btn.click();
              }
            }, 500);
          })();
        `);
            } catch (e) {
                console.error(e);
            }
        });
    }

    const totalCodesCount = groups.reduce((sum, g) => sum + g.codes.length, 0);

    // ── Utilities ──
    const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    // Apply time filter to all current webviews and wait for chart refresh
    async function applyTimeFilterAndWait(period: string) {
        webviewMapRef.current.forEach((wv: any) => {
            try {
                wv.executeJavaScript(`
          (function() {
            var items = document.querySelectorAll('.stock-period-list .stock-period-item');
            for (var i = 0; i < items.length; i++) {
              if (items[i].textContent.trim() === '${period}') {
                items[i].click();
                break;
              }
            }
            setTimeout(function() {
              var btn = document.querySelector('.view-fixed-price .btn-view-fixed-price');
              if (btn && btn.textContent.trim() === 'Xem giá điều chỉnh') {
                btn.click();
              }
            }, 500);
          })();
        `);
            } catch (e) {
                console.error(e);
            }
        });
        // Wait for charts to fully render after filter change
        await delay(3000);
    }

    // ── Screenshot capture workflow ──
    async function handleCaptureAll() {
        // 1. Ask user for save folder
        const saveFolder = await (window as any).ipcRenderer.invoke(
            "select-save-folder",
        );
        if (!saveFolder) return;

        setIsCapturing(true);
        const uniqueCodes = [...stockCodes]; // Use currently filtered codes
        const pages = Math.ceil(uniqueCodes.length / ITEMS_PER_PAGE);
        const periods = [
            { label: "6M", folder: "6 months chart" },
            { label: "1Y", folder: "1 year chart" },
            { label: "5Y", folder: "5 years chart" },
        ];

        try {
            for (let page = 1; page <= pages; page++) {
                // 2. Switch to target page
                setCaptureStatus(`Đang chuyển sang trang ${page}/${pages}...`);
                setCurrentPage(page);
                // Wait for webviews to load
                await delay(5000);

                const pageCodes = uniqueCodes.slice(
                    (page - 1) * ITEMS_PER_PAGE,
                    page * ITEMS_PER_PAGE,
                );

                for (const period of periods) {
                    // 3. Apply time filter
                    setCaptureStatus(
                        `Trang ${page}/${pages} - Đang chụp ${period.label}...`,
                    );
                    await applyTimeFilterAndWait(period.label);

                    // 4. Capture only the .content area
                    const contentEl = document.querySelector(".content");
                    if (contentEl) {
                        const rect = contentEl.getBoundingClientRect();
                        const dpr = window.devicePixelRatio || 1;
                        const captureRect = {
                            x: Math.round(rect.x * dpr),
                            y: Math.round(rect.y * dpr),
                            width: Math.round(rect.width * dpr),
                            height: Math.round(rect.height * dpr),
                        };
                        const base64 = await (window as any).ipcRenderer.invoke(
                            "capture-page",
                            captureRect,
                        );
                        if (base64) {
                            const fileName = `page${page}_${pageCodes.join("_")}.png`;
                            const filePath = `${saveFolder}\\${period.folder}\\${fileName}`;
                            await (window as any).ipcRenderer.invoke(
                                "save-screenshot",
                                filePath,
                                base64,
                            );
                        }
                    }
                }
            }
            setCaptureStatus("Hoàn thành! ✅");
            await delay(2000);
        } catch (err) {
            console.error("Capture error:", err);
            setCaptureStatus("Lỗi khi chụp ảnh ❌");
            await delay(2000);
        } finally {
            setIsCapturing(false);
            setCaptureStatus("");
        }
    }

    async function handleCaptureIndividual() {
        // 1. Ask user for save folder
        const saveFolder = await (window as any).ipcRenderer.invoke(
            "select-save-folder",
        );
        if (!saveFolder) return;

        setIsCapturing(true);
        const uniqueCodes = [...stockCodes]; // Respect current filters
        const pages = Math.ceil(uniqueCodes.length / ITEMS_PER_PAGE);
        const pdfDocs: { [key: string]: jsPDF } = {};
        const periods = [
            { label: "6M", fileSuffix: "6 tháng" },
            { label: "1Y", fileSuffix: "1 năm" },
            { label: "5Y", fileSuffix: "5 năm" },
        ];

        try {
            for (let page = 1; page <= pages; page++) {
                // Switch to target page
                setCaptureStatus(`Chuyển sang trang ${page}/${pages}...`);
                setCurrentPage(page);
                // Wait for webviews to load
                await delay(5000);

                // Codes on current page
                const startIdx = (page - 1) * ITEMS_PER_PAGE;
                const endIdx = Math.min(
                    page * ITEMS_PER_PAGE,
                    uniqueCodes.length,
                );
                const pageCodes = uniqueCodes.slice(startIdx, endIdx);

                for (const period of periods) {
                    // Apply time filter globally
                    setCaptureStatus(
                        `Trang ${page}/${pages} - Đang chuyển mốc ${period.fileSuffix}...`,
                    );
                    await applyTimeFilterAndWait(period.label);

                    // Capture each stock code individually
                    for (const code of pageCodes) {
                        setCaptureStatus(
                            `Trang ${page}/${pages} - Đang chụp [${code}] mốc ${period.fileSuffix}...`,
                        );

                        const cardEl = document.querySelector(
                            `.webview-card[data-code="${code}"]`,
                        );
                        const webviewEl = cardEl?.querySelector("webview");

                        if (webviewEl) {
                            const rect = webviewEl.getBoundingClientRect();
                            const dpr = window.devicePixelRatio || 1;
                            const captureRect = {
                                x: Math.round(rect.x * dpr),
                                y: Math.round(rect.y * dpr),
                                width: Math.round(rect.width * dpr),
                                height: Math.round(rect.height * dpr),
                            };

                            const base64 = await (
                                window as any
                            ).ipcRenderer.invoke("capture-page", captureRect);
                            if (base64) {
                                // Save individual image
                                const fileName = `${code}_${period.fileSuffix}.png`;
                                const filePath = `${saveFolder}\\${code}\\${fileName}`;
                                await (window as any).ipcRenderer.invoke(
                                    "save-screenshot",
                                    filePath,
                                    base64,
                                );

                                // Add to PDF
                                if (!pdfDocs[code]) {
                                    pdfDocs[code] = new jsPDF({
                                        orientation:
                                            rect.width > rect.height
                                                ? "l"
                                                : "p",
                                        unit: "px",
                                        format: [rect.width, rect.height],
                                    });
                                } else {
                                    pdfDocs[code].addPage(
                                        [rect.width, rect.height],
                                        rect.width > rect.height ? "l" : "p",
                                    );
                                }
                                pdfDocs[code].addImage(
                                    `data:image/png;base64,${base64}`,
                                    "PNG",
                                    0,
                                    0,
                                    rect.width,
                                    rect.height,
                                );
                            }
                        }
                    }
                }

                // Save PDFs for codes on this page after all timeframes are done
                for (const code of pageCodes) {
                    if (pdfDocs[code]) {
                        setCaptureStatus(`Đang xuất file PDF cho [${code}]...`);
                        const pdfBase64 = pdfDocs[code]
                            .output("datauristring")
                            .split(",")[1];
                        const pdfPath = `${saveFolder}\\${code}.pdf`;
                        await (window as any).ipcRenderer.invoke(
                            "save-screenshot",
                            pdfPath,
                            pdfBase64,
                        );
                        delete pdfDocs[code];
                    }
                }
            }
            setCaptureStatus("Hoàn thành! ✅");
            await delay(2000);
        } catch (err) {
            console.error("Individual capture error:", err);
            setCaptureStatus("Lỗi khi chụp ❌");
            await delay(2000);
        } finally {
            setIsCapturing(false);
            setCaptureStatus("");
        }
    }

    return (
        <div className="app">
            {/* Consolidated Header */}
            <div className="header">
                <div className="header-logo">
                    <div className="logo-icon">📈</div>
                    <h1>Stock Viewer</h1>
                </div>

                <div className="filter-pills">
                    <button
                        className={`filter-pill ${filterMode === "all" ? "active" : ""}`}
                        onClick={() => setFilterMode("all")}
                    >
                        Tất cả
                    </button>
                    <button
                        className={`filter-pill ${filterMode === "favorites" ? "active" : ""}`}
                        onClick={() => setFilterMode("favorites")}
                    >
                        Yêu thích
                    </button>
                </div>

                {stockCodes.length > 0 && (
                    <div className="header-charts-info">
                        <span className="stock-count">
                            <span>{stockCodes.length}</span> mã
                        </span>
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    ◀
                                </button>
                                <span className="page-info">
                                    {currentPage}/{totalPages}
                                </span>
                                <button
                                    className="page-btn"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    ▶
                                </button>
                            </div>
                        )}
                        <div className="time-filter-btns">
                            {["6M", "1Y", "5Y"].map((period) => (
                                <button
                                    key={period}
                                    className="btn btn-filter"
                                    onClick={() => handleTimeFilter(period)}
                                    title={`Chuyển tất cả sang ${period}`}
                                    disabled={isCapturing}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="header-actions">
                    {stockCodes.length > 0 ? (
                        <>
                            <button
                                className="btn btn-capture"
                                onClick={handleCaptureAll}
                                disabled={isCapturing}
                                title={
                                    isCapturing
                                        ? captureStatus
                                        : "Chụp ảnh tất cả"
                                }
                            >
                                {isCapturing ? "⏳" : "📸 Trang"}
                            </button>
                            <button
                                className="btn btn-capture"
                                onClick={handleCaptureIndividual}
                                disabled={isCapturing}
                                title={
                                    isCapturing
                                        ? captureStatus
                                        : "Chụp ảnh từng mã riêng biệt"
                                }
                            >
                                {isCapturing ? "⏳" : "📸 Mỗi mã"}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={handleBackToEdit}
                                title="Quản lý danh mục"
                            >
                                ✕
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="header-summary">
                                {groups.length} ngành · {totalCodesCount} mã
                            </span>
                            <button
                                className="btn btn-primary"
                                onClick={handleViewCharts}
                                disabled={totalCodesCount === 0}
                            >
                                📊 Xem biểu đồ
                            </button>
                        </>
                    )}

                    <button
                        className={`btn btn-sync-icon ${syncEnabled ? "active" : ""}`}
                        onClick={() => setSyncEnabled((prev) => !prev)}
                        title={syncEnabled ? "Sync: ON" : "Sync: OFF"}
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="content">
                {stockCodes.length === 0 ? (
                    /* ── Sector Columns Editor ── */
                    <div className="sector-editor">
                        <div className="sector-editor-actions">
                            <button
                                className={`btn btn-secondary ${isImportingJson ? "active" : ""}`}
                                onClick={() =>
                                    setIsImportingJson((prev) => !prev)
                                }
                            >
                                {isImportingJson ? "✕ Hủy" : "📥 Nhập JSON"}
                            </button>
                        </div>

                        {isImportingJson && (
                            <div className="json-import-box">
                                <div className="json-example-header">
                                    <span>Ví dụ định dạng (JSON):</span>
                                    <button
                                        className="btn btn-secondary btn-xs"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                JSON_EXAMPLE,
                                            );
                                            alert("Đã copy mẫu JSON!");
                                        }}
                                    >
                                        📋 Copy mẫu
                                    </button>
                                </div>
                                <pre className="json-example-code">
                                    {JSON_EXAMPLE}
                                </pre>

                                <textarea
                                    placeholder="Dán JSON vào đây..."
                                    value={importJsonText}
                                    onChange={(e) =>
                                        setImportJsonText(e.target.value)
                                    }
                                />
                                <div className="json-import-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleImportJson}
                                    >
                                        Xác nhận Nhập
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="sector-columns">
                            {groups.map((group) => (
                                <SectorColumn
                                    key={group.id}
                                    group={group}
                                    favoriteCodes={favoriteCodes}
                                    onToggleFavorite={handleToggleFavorite}
                                    onUpdateName={handleUpdateGroupName}
                                    onDeleteGroup={handleDeleteGroup}
                                    onAddCode={handleAddCodeToGroup}
                                    onDeleteCode={handleDeleteCodeFromGroup}
                                    duplicateCodes={duplicateCodes}
                                />
                            ))}
                            {/* Add Group Button */}
                            <button
                                className="sector-add-column"
                                onClick={handleAddGroup}
                            >
                                <span className="sector-add-column-icon">
                                    ＋
                                </span>
                                <span>Thêm ngành</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`webview-grid cols-${GRID_COLS}`}
                        style={{ gridTemplateRows: `repeat(${gridRows}, 1fr)` }}
                    >
                        {currentCodes.map((code) => (
                            <WebviewCard
                                key={`${currentPage}-${code}`}
                                code={code}
                                groupName={codeToGroupNames
                                    .get(code)
                                    ?.join(", ")}
                                syncEnabledRef={syncEnabledRef}
                                webviewMapRef={webviewMapRef}
                                isSyncingRef={isSyncingRef}
                                isFavorite={favoriteCodes.includes(code)}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDeleteCode}
                                isDuplicate={duplicateCodes.has(code)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
