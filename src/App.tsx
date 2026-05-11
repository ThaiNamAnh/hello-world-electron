import { useState, useRef, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import "./App.css";
import { CaptureScreen } from "./capture/CaptureScreen";

const isSubWindow = window.location.hash === "#sub";
const isCaptureWindow = window.location.hash === "#capture";

const ITEMS_PER_PAGE = 6; // 6 mã chứng khoán/trang (3 cột x 2 hàng)
const GRID_COLS = 3; // 3 cột
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
        id: "5",
        name: "Dầu khí",
        codes: ["BSR", "OIL", "PLX", "PVD", "PVS"],
    },
    {
        id: "13",
        name: "Hóa chất",
        codes: [
            "AAA",
            "BFC",
            "CSV",
            "DCM",
            "DDV",
            "DGC",
            "DPM",
            "DPR",
            "DRI",
            "GVR",
            "HII",
            "LAS",
            "PHR",
            "PLP",
            "VTZ",
        ],
    },
    {
        id: "17",
        name: "Tài nguyên cơ bản",
        codes: [
            "AAH",
            "DHC",
            "HHP",
            "HPG",
            "HSG",
            "MSR",
            "MZG",
            "NKG",
            "SMC",
            "TLH",
            "TTF",
            "TVN",
            "VGS",
        ],
    },
    {
        id: "23",
        name: "Vật liệu xây dựng",
        codes: [
            "CDC",
            "CII",
            "CRC",
            "CTD",
            "CTR",
            "DC4",
            "DLG",
            "DPG",
            "EVG",
            "FCN",
            "G36",
            "GEL",
            "HBC",
            "HHV",
            "HID",
            "HT1",
            "HVH",
            "KSB",
            "LCG",
            "MST",
            "PC1",
            "TLD",
            "VCG",
            "VGC",
            "VNE",
        ],
    },
    {
        id: "27",
        name: "Hàng và dịch vụ công nghiệp",
        codes: [
            "ACV",
            "GEE",
            "GEX",
            "GMD",
            "HAH",
            "PAC",
            "PVP",
            "PVT",
            "TV2",
            "VOS",
            "VSC",
            "VTO",
            "VTP",
        ],
    },
    {
        id: "33",
        name: "Ô tô và phụ tùng",
        codes: ["CSM", "HAX", "HHS", "HUT"],
    },
    {
        id: "35",
        name: "Thực phẩm và đồ uống",
        codes: [
            "ANV",
            "ASM",
            "BAF",
            "BIG",
            "DBC",
            "HAG",
            "HNG",
            "HSL",
            "IDI",
            "MSN",
            "NAF",
            "PAN",
            "SAB",
            "SBT",
            "TCO",
            "VHC",
            "VNM",
        ],
    },
    {
        id: "37",
        name: "Hàng cá nhân và gia dụng",
        codes: ["MSH", "PNJ", "TCM", "TNG", "VGT"],
    },
    {
        id: "45",
        name: "Y tế",
        codes: ["DCL", "FIT", "JVC"],
    },
    {
        id: "53",
        name: "Bán lẻ",
        codes: ["DGW", "MWG", "PET"],
    },
    {
        id: "55",
        name: "Truyền thông",
        codes: ["YEG"],
    },
    {
        id: "57",
        name: "Du lịch và giải trí",
        codes: ["HVN", "SCS", "VJC", "VPL"],
    },
    {
        id: "65",
        name: "Viễn thông",
        codes: ["VGI"],
    },
    {
        id: "75",
        name: "Điện, nước, xăng dầu, khí đốt",
        codes: ["ASP", "BWE", "GAS", "GEG", "NT2", "POW", "PPC", "REE", "TTA"],
    },
    {
        id: "83",
        name: "Ngân hàng",
        codes: [
            "ABB",
            "ACB",
            "BID",
            "CTG",
            "EIB",
            "HDB",
            "KLB",
            "LPB",
            "MBB",
            "MSB",
            "NAB",
            "OCB",
            "SHB",
            "SSB",
            "STB",
            "TCB",
            "TPB",
            "VAB",
            "VCB",
            "VIB",
            "VPB",
        ],
    },
    {
        id: "85",
        name: "Bảo hiểm",
        codes: ["BVH"],
    },
    {
        id: "86",
        name: "Bất động sản",
        codes: [
            "AAV",
            "AGG",
            "BCM",
            "CEO",
            "DIG",
            "DRH",
            "DXG",
            "DXS",
            "FIR",
            "HDC",
            "HDG",
            "HPX",
            "HQC",
            "HTN",
            "IDC",
            "IJC",
            "ITC",
            "KBC",
            "KDH",
            "KHG",
            "LDG",
            "NLG",
            "NTL",
            "NVL",
            "PDR",
            "PIV",
            "QCG",
            "SCR",
            "SIP",
            "SZC",
            "TAL",
            "TCH",
            "TDH",
            "VHM",
            "VIC",
            "VPI",
            "VRE",
        ],
    },
    {
        id: "87",
        name: "Dịch vụ tài chính",
        codes: [
            "AAS",
            "AGR",
            "BSI",
            "CTS",
            "DSE",
            "EVF",
            "FTS",
            "HCM",
            "MBS",
            "OGC",
            "ORS",
            "SBS",
            "SHS",
            "SSI",
            "TCX",
            "VCI",
            "VCK",
            "VDS",
            "VIX",
            "VND",
            "VPX",
        ],
    },
    {
        id: "95",
        name: "Công nghệ thông tin",
        codes: ["CMG", "ELC", "FPT"],
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

// const FIREANT_FOCUS_CSS = `
//   #root { display: none !important; }
//   .bp5-overlay-backdrop { display: none !important; }
//   .bp5-dialog-container {
//     padding: 0 !important;
//     background-color: #131722 !important;
//   }
//   .bp5-dialog {
//     transform: none !important; /* Xóa transform để position: fixed hđ chuẩn */
//   }

//   /* Thẻ được chỉ định sẽ đè lên toàn màn hình webview */
//   /*.sc-gZnPbQ.borLEM {*/
//   div.rounded-lg.bg-card.text-card-foreground {
//     position: fixed !important;
//     top: 0 !important;
//     left: 0 !important;
//     width: 100vw !important;
//     height: 100vh !important;
//     z-index: 2147483647 !important;
//     background-color: #131722 !important;
//     margin: 0 !important;
//     padding: 5px !important;
//     box-sizing: border-box !important;
//   }
// `;

const FIREANT_FOCUS_CSS = `
  /* Ẩn scrollbar của body */
  body { 
    overflow: hidden !important; 
  }

  /* Cấu hình cho Dialog cũ */
  .bp5-overlay-backdrop { display: none !important; }
  .bp5-dialog-container {
    padding: 0 !important;
    background-color: #131722 !important;
  }
  .bp5-dialog {
    transform: none !important; 
  }
  
  /* 1. THẺ BIỂU ĐỒ CHÍNH */
  div.bg-card[class*="flex-[2]"] > div:first-child > div:first-child {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    
    /* Giảm z-index xuống một chút để chừa chỗ cho popup */
    z-index: 9999 !important; 
    
    background-color: #131722 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }

  /* 2. FIX LỖI MENU DROP-DOWN (Nút fx, cài đặt...) */
  /* Bắt các thẻ sinh ra bởi Radix UI Popper (dựa trên data attribute) */
  [data-radix-popper-content-wrapper] {
    /* Ép z-index cao hơn biểu đồ để nó nổi lên trên */
    z-index: 10000 !important; 
  }
`;

// Component for a single webview card - creates webview via DOM API
function WebviewCard({
    code,
    mode,
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
    mode: "24h" | "fa";
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

        container.style.display = "flex";
        container.style.flexDirection = "column";

        let webview24h: any = null;
        let webviewFA: any = null;

        if (mode === "24h") {
            // Create 24hMoney webview
            webview24h = document.createElement("webview") as any;
            webview24h.src = `https://24hmoney.vn/stock/${code}`;
            webview24h.style.flex = "1";
            webview24h.style.height = "100%";
            webview24h.setAttribute("allowpopups", "true");
            container.appendChild(webview24h);

            webviewMapRef.current.set(code, webview24h);

            webview24h.addEventListener("dom-ready", () => {
                try {
                    webview24h.insertCSS(CHART_FOCUS_CSS);
                } catch (e) {
                    console.error(e);
                }
                try {
                    webview24h.executeJavaScript(CHART_FOCUS_JS);
                } catch (e) {
                    console.error(e);
                }
                setLoading(false);

                // Inject sync scripts
                try {
                    webview24h.executeJavaScript(`
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

            webview24h.addEventListener("console-message", (event: any) => {
                const msg = event.message;
                if (!msg || !msg.startsWith("__SYNC__")) return;
                if (!syncEnabledRef.current || isSyncingRef.current) return;

                try {
                    const data = JSON.parse(msg.substring(8));
                    isSyncingRef.current = true;

                    if (data.type === "click") {
                        webviewMapRef.current.forEach(
                            (otherWv: any, otherCode: string) => {
                                if (
                                    otherCode !== data.code &&
                                    !otherCode.endsWith("_FA")
                                ) {
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
                                if (
                                    otherCode !== data.code &&
                                    !otherCode.endsWith("_FA")
                                ) {
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
        } // end of 24h block

        if (mode === "fa") {
            // Create Fireant webview
            webviewFA = document.createElement("webview") as any;
            webviewFA.src = `https://fireant.vn/ma-chung-khoan/${code}`;
            webviewFA.style.flex = "1";
            webviewFA.style.height = "100%";
            webviewFA.style.borderLeft = "1px solid #2a2e39";
            webviewFA.setAttribute("allowpopups", "true");
            container.appendChild(webviewFA);

            webviewFA.addEventListener("dom-ready", () => {
                setLoading(false);
                try {
                    webviewFA.insertCSS(FIREANT_FOCUS_CSS);
                } catch (e) {
                    console.error(e);
                }

                // Inject sync scripts for Fireant
                try {
                    webviewFA.executeJavaScript(`
          (function() {
            if (window.__syncSetupFA) return;
            window.__syncSetupFA = true;

            var types = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'];
            types.forEach(function(type) {
                document.addEventListener(type, function(e) {
                  if (window.__isSyncedActionFA) return;
                  var relX = e.clientX / window.innerWidth;
                  var relY = e.clientY / window.innerHeight;
                  console.log('__SYNC_FA__' + JSON.stringify({
                    type: type, code: '${code}', relX: relX, relY: relY, buttons: e.buttons
                  }));
                }, true);
            });

            var lastMouseMove = 0;
            document.addEventListener('mousemove', function(e) {
              if (window.__isSyncedActionFA) return;
              var now = Date.now();
              if (now - lastMouseMove < 15) return; // ~60 FPS
              lastMouseMove = now;
              
              var relX = e.clientX / window.innerWidth;
              var relY = e.clientY / window.innerHeight;
              console.log('__SYNC_FA__' + JSON.stringify({
                type: 'mousemove', code: '${code}', relX: relX, relY: relY, buttons: e.buttons
              }));
            }, true);

            document.addEventListener('wheel', function(e) {
              if (window.__isSyncedActionFA) return;
              var relX = e.clientX / window.innerWidth;
              var relY = e.clientY / window.innerHeight;
              console.log('__SYNC_FA__' + JSON.stringify({
                type: 'wheel', code: '${code}', relX: relX, relY: relY, 
                deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode
              }));
            }, {passive: true, capture: true});

            var scrollTimer = null;
            window.addEventListener('scroll', function() {
              if (window.__isSyncedActionFA) return;
              if (scrollTimer) return;
              scrollTimer = setTimeout(function() {
                scrollTimer = null;
                var el = document.scrollingElement || document.documentElement;
                console.log('__SYNC_FA__' + JSON.stringify({
                  type: 'scroll', code: '${code}',
                  scrollTop: el.scrollTop, scrollLeft: el.scrollLeft
                }));
              }, 40);
            }, true);
          })();
        `);
                } catch (e) {
                    console.error(e);
                }
            });

            webviewFA.addEventListener("console-message", (event: any) => {
                const msg = event.message;
                if (!msg || !msg.startsWith("__SYNC_FA__")) return;
                if (!syncEnabledRef.current) return;

                try {
                    const data = JSON.parse(msg.substring(11));

                    webviewMapRef.current.forEach(
                        (otherWv: any, otherCode: string) => {
                            if (
                                otherCode.endsWith("_FA") &&
                                otherCode !== `${data.code}_FA`
                            ) {
                                if (data.type === "scroll") {
                                    try {
                                        otherWv.executeJavaScript(`
                  (function() {
                    window.__isSyncedActionFA = true;
                    var el = document.scrollingElement || document.documentElement;
                    el.scrollTop = ${data.scrollTop};
                    el.scrollLeft = ${data.scrollLeft};
                    setTimeout(function() { window.__isSyncedActionFA = false; }, 20);
                  })();
                `);
                                    } catch (e) { }
                                } else if (data.type === "wheel") {
                                    try {
                                        otherWv.executeJavaScript(`
                  (function() {
                    window.__isSyncedActionFA = true;
                    var x = ${data.relX} * window.innerWidth;
                    var y = ${data.relY} * window.innerHeight;
                    var el = document.elementFromPoint(x, y) || document.body;
                    
                    var ev = new WheelEvent('wheel', {
                        view: window, bubbles: true, cancelable: true,
                        clientX: x, clientY: y,
                        deltaX: ${data.deltaX}, deltaY: ${data.deltaY}, deltaMode: ${data.deltaMode}
                    });
                    el.dispatchEvent(ev);
                    window.__isSyncedActionFA = false;
                  })();
                `);
                                    } catch (e) { }
                                } else {
                                    try {
                                        otherWv.executeJavaScript(`
                  (function() {
                    window.__isSyncedActionFA = true;
                    var x = ${data.relX} * window.innerWidth;
                    var y = ${data.relY} * window.innerHeight;
                    var el = document.elementFromPoint(x, y) || document.body;
                    
                    // THỦ THUẬT QUAN TRỌNG: Nếu element là hình ảnh/svg bên trong button, tự động dịch chuyển target lên button
                    var targetEl = el.closest('button, [role="button"], [role="menuitem"], [role="tab"]') || el;
                    
                    if ('${data.type}' === 'click') {
                        if (typeof targetEl.click === 'function') targetEl.click();
                        else targetEl.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true, clientX: x, clientY: y }));
                        setTimeout(function() { window.__isSyncedActionFA = false; }, 20);
                    } else if ('${data.type}'.includes('pointer')) {
                        // Dispatch chuẩn cho sự kiện Pointer (pointerdown, pointerup)
                        if (typeof PointerEvent === 'function') {
                            var evInit = { view: window, bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: ${data.buttons || 0}, pointerId: 1, pointerType: 'mouse' };
                            targetEl.dispatchEvent(new PointerEvent('${data.type}', evInit));
                        }
                        window.__isSyncedActionFA = false;
                    } else {
                        // Dispatch cho mousedown, mouseup thông thường
                        var evInit = { view: window, bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: ${data.buttons || 0} };
                        targetEl.dispatchEvent(new MouseEvent('${data.type}', evInit));
                        window.__isSyncedActionFA = false;
                    }
                  })();
                `);
                                    } catch (e) { }
                                }
                            }
                        },
                    );
                } catch (err) { }
            });

            webviewMapRef.current.set(`${code}_FA`, webviewFA);
        } // end form fa block

        return () => {
            // Cleanup on unmount
            webviewMapRef.current.delete(code);
            webviewMapRef.current.delete(`${code}_FA`);
            if (webview24h && container.contains(webview24h)) {
                container.removeChild(webview24h);
            }
            if (webviewFA && container.contains(webviewFA)) {
                container.removeChild(webviewFA);
            }
        };
    }, [code, mode]);

    function handleReload() {
        if (mode === "24h") {
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
        if (mode === "fa") {
            const wvFA = webviewMapRef.current.get(`${code}_FA`);
            if (wvFA) {
                try {
                    wvFA.reload();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    return (
        <div className="webview-card" data-code={code}>
            <div className="webview-card-header">
                <div
                    className="stock-code-label clickable"
                    onClick={() =>
                        isSubWindow ? null : onToggleFavorite(code)
                    }
                    title={
                        isFavorite && !isSubWindow
                            ? "Bỏ yêu thích"
                            : isSubWindow
                                ? ""
                                : "Thêm vào yêu thích"
                    }
                >
                    {!isSubWindow && (
                        <span
                            className={`favorite-star ${isFavorite ? "active" : ""}`}
                        >
                            {isFavorite ? "★" : "☆"}
                        </span>
                    )}
                    {code}
                    {groupName && (
                        <span className="group-name-label">({groupName})</span>
                    )}
                    {isDuplicate && !isSubWindow && (
                        <span
                            className="duplicate-warning"
                            title="Mã này bị trùng lặp ở nhóm khác"
                        >
                            ⚠️
                        </span>
                    )}
                </div>
                {!isSubWindow && (
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
                )}
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
    const [subWindowCodes, setSubWindowCodes] = useState<string[]>([]);
    useEffect(() => {
        if (isSubWindow && window.ipcRenderer) {
            window.ipcRenderer.on(
                "sync-state",
                (_event: any, state: string[]) => {
                    setSubWindowCodes(state);
                },
            );
        }
    }, []);

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
    const [showCapturePopup, setShowCapturePopup] = useState(false);

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

    useEffect(() => {
        if (!isSubWindow && window.ipcRenderer) {
            window.ipcRenderer.send("sync-state", currentCodes);
        }
    }, [currentCodes]);

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
        webviewMapRef.current.delete(`${code}_FA`);
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
            { label: "3M", folder: "3 months chart" },
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

    async function handleCaptureIndividual(
        mode: "multi" | "default" = "multi",
    ) {
        // 1. Ask user for save folder
        const saveFolder = await (window as any).ipcRenderer.invoke(
            "select-save-folder",
        );
        if (!saveFolder) return;

        setIsCapturing(true);
        const uniqueCodes = [...stockCodes]; // Respect current filters
        const pages = Math.ceil(uniqueCodes.length / ITEMS_PER_PAGE);
        const pdfDocs: { [key: string]: jsPDF } = {};
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;

        const periods =
            mode === "multi"
                ? [
                    { label: "3M", fileSuffix: "3 tháng" },
                    { label: "6M", fileSuffix: "6 tháng" },
                    { label: "1Y", fileSuffix: "1 năm" },
                    { label: "5Y", fileSuffix: "5 năm" },
                ]
                : [{ label: "1D", fileSuffix: dateStr }];

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
                                if (mode !== "default") {
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
                                            rect.width > rect.height
                                                ? "l"
                                                : "p",
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
                }

                // Save PDFs for codes on this page after all timeframes are done
                if (mode !== "default") {
                    for (const code of pageCodes) {
                        if (pdfDocs[code]) {
                            setCaptureStatus(
                                `Đang xuất file PDF cho [${code}]...`,
                            );
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

    if (isCaptureWindow) {
        return <CaptureScreen />;
    }

    if (isSubWindow) {
        const activeCodes = subWindowCodes;
        const subGridRows = Math.ceil(activeCodes.length / GRID_COLS);
        return (
            <div className="app">
                <div className="content" style={{ padding: 0 }}>
                    {activeCodes.length > 0 ? (
                        <div
                            className={`webview-grid cols-${GRID_COLS}`}
                            style={{
                                gridTemplateRows: `repeat(${subGridRows}, 1fr)`,
                                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                            }}
                        >
                            {activeCodes.map((code) => (
                                <WebviewCard
                                    key={code}
                                    code={code}
                                    mode="fa"
                                    syncEnabledRef={syncEnabledRef}
                                    webviewMapRef={webviewMapRef}
                                    isSyncingRef={isSyncingRef}
                                    isFavorite={false}
                                    onToggleFavorite={() => { }}
                                    onDelete={() => { }}
                                    isDuplicate={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                color: "white",
                                padding: 20,
                                textAlign: "center",
                            }}
                        >
                            Đang chờ mở mã từ Màn hình chính...
                        </div>
                    )}
                </div>
            </div>
        );
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
                            {["3M", "6M", "1Y", "5Y"].map((period) => (
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
                                onClick={() => setShowCapturePopup(true)}
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
                        className="btn btn-primary"
                        style={{ marginLeft: "auto", marginRight: 8 }}
                        onClick={() => {
                            // Tính toán danh sách mã để gửi sang capture window
                            const allCodes = groups.flatMap((g) => g.codes);
                            let uniqueCodes = [...new Set(allCodes)];
                            if (filterMode === "favorites") {
                                uniqueCodes = uniqueCodes.filter((code) =>
                                    favoriteCodes.includes(code),
                                );
                            }
                            window.ipcRenderer?.send(
                                "open-capture-window",
                                uniqueCodes,
                            );
                        }}
                        title="Mở màn hình chụp ảnh riêng (3 cột, có KL + GD Khối ngoại)"
                    >
                        📷 Màn chụp ảnh
                    </button>

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
                        style={{
                            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                        }}
                    >
                        {currentCodes.map((code) => (
                            <WebviewCard
                                key={`${currentPage}-${code}`}
                                code={code}
                                mode="24h"
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

            {/* Capture Options Popup */}
            {showCapturePopup && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCapturePopup(false)}
                >
                    <div
                        className="modal-content capture-options-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Lựa chọn chụp ảnh</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowCapturePopup(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Chọn phương thức chụp ảnh cho từng mã:</p>
                            <div className="capture-options-grid">
                                <button
                                    className="capture-option-card"
                                    onClick={() => {
                                        setShowCapturePopup(false);
                                        handleCaptureIndividual("multi");
                                    }}
                                >
                                    <div className="option-icon">📅</div>
                                    <div className="option-info">
                                        <div className="option-title">
                                            Theo chu kì
                                        </div>
                                        <div className="option-desc">
                                            Chụp 4 mốc: 3M, 6M, 1Y, 5Y
                                        </div>
                                    </div>
                                </button>
                                <button
                                    className="capture-option-card"
                                    onClick={() => {
                                        setShowCapturePopup(false);
                                        handleCaptureIndividual("default");
                                    }}
                                >
                                    <div className="option-icon">🖥️</div>
                                    <div className="option-info">
                                        <div className="option-title">
                                            Màn mặc định
                                        </div>
                                        <div className="option-desc">
                                            Chụp mốc mặc định (1D)
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
