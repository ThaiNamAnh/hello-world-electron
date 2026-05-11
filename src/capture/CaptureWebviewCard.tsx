import { useState, useRef, useEffect } from "react";
import { CAPTURE_FOCUS_CSS, CAPTURE_FOCUS_JS } from "./capture-css";

/**
 * CaptureWebviewCard - Component hiển thị 1 mã cổ phiếu trong chế độ chụp ảnh.
 * Chỉ dùng nguồn 24hmoney, hiển thị: Detail Box + Chart + Volume + Foreign Transactions.
 */
export function CaptureWebviewCard({ code }: { code: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.style.display = "flex";
        container.style.flexDirection = "column";

        const webview = document.createElement("webview") as any;
        webview.src = `https://24hmoney.vn/stock/${code}`;
        webview.style.flex = "1";
        webview.style.height = "100%";
        webview.setAttribute("allowpopups", "true");
        container.appendChild(webview);

        webview.addEventListener("dom-ready", () => {
            try {
                webview.insertCSS(CAPTURE_FOCUS_CSS);
            } catch (e) {
                console.error("Error inserting CSS for", code, e);
            }
            try {
                webview.executeJavaScript(CAPTURE_FOCUS_JS);
            } catch (e) {
                console.error("Error executing JS for", code, e);
            }
            setLoading(false);
        });

        return () => {
            if (container.contains(webview)) {
                container.removeChild(webview);
            }
        };
    }, [code]);

    return (
        <div className="capture-card" data-code={code}>
            <div className="capture-card-header">
                <span className="capture-code-label">{code}</span>
            </div>
            <div className="capture-card-body" ref={containerRef}>
                {loading && (
                    <div className="webview-loading">
                        <div className="loading-spinner" />
                        <span className="loading-text">
                            Đang tải {code}...
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
