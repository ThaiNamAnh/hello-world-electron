import { useState, useEffect } from "react";
import { CaptureWebviewCard } from "./CaptureWebviewCard";

const CODES_PER_PAGE = 3; // 3 mã / trang (3 cột x 1 hàng)

/**
 * CaptureScreen - Màn hình chuyên dụng cho việc chụp ảnh từng mã cổ phiếu.
 * Layout: 3 cột, mỗi cột 1 mã.
 * Thông tin: Detail Box + Chart chính + Volume + GD Khối ngoại (từ 24hmoney).
 */
export function CaptureScreen() {
    const [codes, setCodes] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureStatus, setCaptureStatus] = useState("");

    // Nhận danh sách mã từ main window qua IPC
    useEffect(() => {
        async function init() {
            if (window.ipcRenderer) {
                try {
                    const state = await window.ipcRenderer.invoke(
                        "get-capture-state",
                    );
                    if (Array.isArray(state) && state.length > 0) {
                        setCodes(state);
                    }
                } catch (e) {
                    console.error("Error getting capture state:", e);
                }

                // Lắng nghe cập nhật từ main window
                window.ipcRenderer.on(
                    "sync-capture-state",
                    (_event: any, state: string[]) => {
                        setCodes(state);
                        setCurrentPage(1);
                    },
                );
            }
        }
        init();
    }, []);

    const totalPages = Math.ceil(codes.length / CODES_PER_PAGE);
    const startIndex = (currentPage - 1) * CODES_PER_PAGE;
    const currentCodes = codes.slice(startIndex, startIndex + CODES_PER_PAGE);

    const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    // ── Chụp ảnh từng mã ──
    async function handleCapture() {
        const saveFolder = await (window as any).ipcRenderer.invoke(
            "select-save-folder",
        );
        if (!saveFolder) return;

        setIsCapturing(true);
        const allCodes = [...codes];
        const pages = Math.ceil(allCodes.length / CODES_PER_PAGE);
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;

        try {
            for (let page = 1; page <= pages; page++) {
                // Chuyển trang
                setCaptureStatus(
                    `Đang chuyển sang trang ${page}/${pages}...`,
                );
                setCurrentPage(page);
                // Chờ webview load
                await delay(6000);

                const pageCodes = allCodes.slice(
                    (page - 1) * CODES_PER_PAGE,
                    page * CODES_PER_PAGE,
                );

                // Chụp từng mã trên trang
                for (const code of pageCodes) {
                    setCaptureStatus(
                        `Trang ${page}/${pages} - Đang chụp [${code}]...`,
                    );

                    const cardEl = document.querySelector(
                        `.capture-card[data-code="${code}"]`,
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
                            const fileName = `${code}_${dateStr}.png`;
                            const filePath = `${saveFolder}\\${code}\\${fileName}`;
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
            setCaptureStatus("Lỗi khi chụp ❌");
            await delay(2000);
        } finally {
            setIsCapturing(false);
            setCaptureStatus("");
        }
    }

    // ── Click time period button in all webviews ──
    function handleTimeFilter(period: string) {
        const webviews = document.querySelectorAll(
            ".capture-card webview",
        ) as NodeListOf<any>;
        webviews.forEach((wv: any) => {
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
    }

    return (
        <div className="capture-screen">
            {/* Header */}
            <div className="capture-header">
                <div className="capture-header-left">
                    <button
                        className="btn btn-secondary"
                        onClick={() => window.close()}
                        title="Quay lại màn hình chính"
                        style={{ marginRight: 8 }}
                    >
                        ◀ Quay lại
                    </button>
                    <div className="capture-logo">
                        <span className="capture-logo-icon">📷</span>
                        <h1>Chụp ảnh mã CK</h1>
                    </div>
                    <span className="capture-stock-count">
                        <span>{codes.length}</span> mã
                    </span>
                </div>

                <div className="capture-header-center">
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={currentPage <= 1 || isCapturing}
                                onClick={() =>
                                    setCurrentPage((p) => p - 1)
                                }
                            >
                                ◀
                            </button>
                            <span className="page-info">
                                {currentPage}/{totalPages}
                            </span>
                            <button
                                className="page-btn"
                                disabled={
                                    currentPage >= totalPages || isCapturing
                                }
                                onClick={() =>
                                    setCurrentPage((p) => p + 1)
                                }
                            >
                                ▶
                            </button>
                        </div>
                    )}

                    {/* Time filters */}
                    <div className="time-filter-btns">
                        {["1D", "3M", "6M", "1Y", "5Y"].map((period) => (
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

                <div className="capture-header-right">
                    {isCapturing && (
                        <span className="capture-status">{captureStatus}</span>
                    )}
                    <button
                        className="btn btn-capture"
                        onClick={handleCapture}
                        disabled={isCapturing || codes.length === 0}
                        title={
                            isCapturing ? captureStatus : "Chụp ảnh từng mã"
                        }
                    >
                        {isCapturing ? "⏳ Đang chụp..." : "📸 Chụp ảnh"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="capture-content">
                {codes.length === 0 ? (
                    <div className="capture-empty">
                        <span className="capture-empty-icon">📭</span>
                        <p>Đang chờ nhận danh sách mã từ màn hình chính...</p>
                    </div>
                ) : (
                    <div className="capture-grid">
                        {currentCodes.map((code) => (
                            <CaptureWebviewCard
                                key={`${currentPage}-${code}`}
                                code={code}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
