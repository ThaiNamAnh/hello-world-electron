import { useState, useRef, useEffect } from 'react'
import './App.css'

const ITEMS_PER_PAGE = 8  // 4 cột x 2 hàng = 8 biểu đồ/trang
const GRID_COLS = 4       // Giữ nguyên 4 cột
const GRID_ROWS = 2       // Đổi thành 2 hàng

// CSS to inject into webviews to show ONLY the chart
const CHART_FOCUS_CSS = `
  /* 1. Reset cơ bản */
  html, body {
    background-color: #131722 !important; /* Nền tối */
    overflow: hidden !important;
    margin: 0 !important;
  }

  /* 2. Ẩn các thành phần rác của trang gốc */
  header, footer, nav,
  [class*="ads"], [class*="banner"],
  .mess_support, .zalo-chat-widget, #chat-widget-container,
  .box-contact, .header-mobile,
  .stock-overview, .financial-report-box, .foreign-transactions, .list-table {
    display: none !important;
    z-index: -9999 !important;
  }

  /* 3. Cấu hình container chính */
  .stock-chart {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    background-color: #131722 !important; /* Nền tối đồng bộ */
    padding: 4px !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* 4. XỬ LÝ HEADER GIÁ & NÚT THỜI GIAN (Fix lỗi mất dữ liệu khi full màn) */
  
  /* 4.1. Hiện dòng thông tin giá (được nhận diện qua style justify-content) */
  .stock-chart > div[style*="justify-content"] {
    display: flex !important;
    flex-shrink: 0 !important;
    margin-bottom: 2px !important;
  }
  .stock-chart > div[style*="justify-content"] * {
    color: #e0e3eb !important; /* Chữ màu sáng */
    font-size: 13px !important; /* Chỉnh lại font cho gọn */
  }

  /* 4.2. Hiện lại .stock-box-head nhưng chỉnh sửa để chỉ hiện nút lọc (1D, 1W...) */
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

  /* Ẩn tiêu đề to (Ví dụ: VNM - Vinamilk...) bên trong header */
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

  /* 4.3. Fix Highcharts Container */
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
`

// JS to scroll to chart, force resize and make it full-screen
const CHART_FOCUS_JS = `
  (function() {
    function focusChart() {
      var chartEl = document.querySelector('.stock-chart');
      if (chartEl) {
         chartEl.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; background: #131722 !important; display: flex !important; flex-direction: column !important;';
         
         // QUAN TRỌNG: Trigger sự kiện resize để thư viện Highcharts vẽ lại
         window.dispatchEvent(new Event('resize'));
         
         // Trigger resize lên chính element của Highcharts (nếu có)
         var highchartsContainer = document.querySelector('.highcharts-container');
         if (highchartsContainer) {
            highchartsContainer.style.width = '100%';
            highchartsContainer.style.height = '100%';
         }
      }

      // Xóa quảng cáo cứng đầu
      document.querySelectorAll('.modal, .modal-backdrop, [class*="popup"], [id^="ads"]').forEach(e => e.remove());
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
`

// Component for a single webview card - creates webview via DOM API
function WebviewCard({
  code,
  syncEnabledRef,
  webviewMapRef,
  isSyncingRef,
}: {
  code: string
  syncEnabledRef: React.MutableRefObject<boolean>
  webviewMapRef: React.MutableRefObject<Map<string, any>>
  isSyncingRef: React.MutableRefObject<boolean>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create webview element programmatically
    const webview = document.createElement('webview') as any
    webview.src = `https://24hmoney.vn/stock/${code}`
    webview.style.width = '100%'
    webview.style.height = '100%'
    webview.setAttribute('allowpopups', 'true')
    container.appendChild(webview)

    webviewMapRef.current.set(code, webview)

    webview.addEventListener('dom-ready', () => {
      try { webview.insertCSS(CHART_FOCUS_CSS) } catch (e) { console.error(e) }
      try { webview.executeJavaScript(CHART_FOCUS_JS) } catch (e) { console.error(e) }
      setLoading(false)

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
        `)
      } catch (e) { console.error(e) }
    })

    webview.addEventListener('console-message', (event: any) => {
      const msg = event.message
      if (!msg || !msg.startsWith('__SYNC__')) return
      if (!syncEnabledRef.current || isSyncingRef.current) return

      try {
        const data = JSON.parse(msg.substring(8))
        isSyncingRef.current = true

        if (data.type === 'click') {
          webviewMapRef.current.forEach((otherWv: any, otherCode: string) => {
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
                `)
              } catch (e) { console.error(e) }
            }
          })
        }

        if (data.type === 'scroll') {
          webviewMapRef.current.forEach((otherWv: any, otherCode: string) => {
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
                `)
              } catch (e) { console.error(e) }
            }
          })
        }

        setTimeout(() => { isSyncingRef.current = false }, 300)
      } catch (err) {
        // ignore
      }
    })

    return () => {
      // Cleanup on unmount
      webviewMapRef.current.delete(code)
      if (container.contains(webview)) {
        container.removeChild(webview)
      }
    }
  }, [code])

  function handleReload() {
    const wv = webviewMapRef.current.get(code)
    if (wv) {
      setLoading(true)
      try { wv.reload() } catch (e) { console.error(e) }
    }
  }

  return (
    <div className="webview-card">
      <div className="webview-card-header">
        <span className="stock-code-label">{code}</span>
        <div className="webview-actions">
          <button className="webview-action-btn" title="Tải lại" onClick={handleReload}>
            🔄
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
  )
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [stockCodes, setStockCodes] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [syncEnabled, setSyncEnabled] = useState(false)

  const syncEnabledRef = useRef(false)
  const webviewMapRef = useRef<Map<string, any>>(new Map())
  const isSyncingRef = useRef(false)

  useEffect(() => {
    syncEnabledRef.current = syncEnabled
  }, [syncEnabled])

  const totalPages = Math.ceil(stockCodes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentCodes = stockCodes.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const gridRows = Math.ceil(currentCodes.length / GRID_COLS)

  function handleSubmit() {
    const codes = inputValue
      .toUpperCase()
      .split(/[\s,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0 && /^[A-Z0-9]+$/.test(c))

    const uniqueCodes = [...new Set(codes)]
    if (uniqueCodes.length > 0) {
      webviewMapRef.current.clear()
      setStockCodes(uniqueCodes)
      setCurrentPage(1)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-logo">
          <div className="logo-icon">📈</div>
          <h1>Stock Chart Viewer</h1>
        </div>
        <div className="input-group">
          <input
            className="stock-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập mã CK, phân cách bằng dấu phẩy (VD: BID, VCB, MWG, HPG...)"
          />
          <button className="btn btn-primary" onClick={handleSubmit}>
            📊 Xem biểu đồ
          </button>
          <button
            className={`btn btn-secondary btn-sync ${syncEnabled ? 'active' : ''}`}
            onClick={() => setSyncEnabled(prev => !prev)}
            title={syncEnabled ? 'Đồng bộ: BẬT' : 'Đồng bộ: TẮT'}
          >
            <span className="sync-dot" />
            {syncEnabled ? 'Sync ON' : 'Sync OFF'}
          </button>
        </div>
      </div>

      {/* Info Bar */}
      {stockCodes.length > 0 && (
        <div className="info-bar">
          <div className="info-left">
            <span className="stock-count">
              Tổng: <span>{stockCodes.length}</span> mã
            </span>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  ◀
                </button>
                <span className="page-info">
                  Trang <span>{currentPage}</span> / <span>{totalPages}</span>
                </span>
                <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  ▶
                </button>
              </div>
            )}
          </div>
          <div className="grid-controls">
            <span className="grid-info">{GRID_COLS}×{GRID_ROWS}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="content">
        {stockCodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h2>Theo dõi biểu đồ chứng khoán</h2>
            <p>
              Nhập các mã chứng khoán vào ô phía trên để xem biểu đồ từ 24hmoney.vn.
              Mỗi trang hiển thị tối đa {ITEMS_PER_PAGE} mã. Bật Sync để đồng bộ thao tác.
            </p>
            <div className="sample-codes">
              {['BID', 'VCB', 'MWG', 'HPG', 'FPT', 'VNM'].map(code => (
                <span
                  key={code}
                  className="sample-code"
                  onClick={() => setInputValue(
                    'BID, VCB, MWG, HPG, FPT, VNM, TCB, VPB, MBB, ACB, STB, SSI, VHM, VIC, GAS, PLX, PNJ, REE, DGC, PC1'
                  )}
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`webview-grid cols-${GRID_COLS}`}
            style={{ gridTemplateRows: `repeat(${gridRows}, 1fr)` }}
          >
            {currentCodes.map(code => (
              <WebviewCard
                key={`${currentPage}-${code}`}
                code={code}
                syncEnabledRef={syncEnabledRef}
                webviewMapRef={webviewMapRef}
                isSyncingRef={isSyncingRef}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
