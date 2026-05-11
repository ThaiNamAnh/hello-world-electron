// CSS to inject into webviews in Capture mode
// Shows: Detail Box + Main Chart + Volume Chart + Foreign Transactions
export const CAPTURE_FOCUS_CSS = `
  /* 1. Reset cơ bản */
  html, body {
    background-color: #fff !important;
    overflow: hidden !important;
    margin: 0 !important;
    height: 100vh !important;
  }

  /* 2. Ẩn các thành phần không cần */
  header, footer, nav,
  [class*="ads"], [class*="banner"],
  .mess_support, .zalo-chat-widget, #chat-widget-container,
  .box-contact, .header-mobile,
  .financial-report-box,
  .list-table,
  .summary-group-stock,
  .stock-comment,
  .stock-news,
  .stock-event,
  .related-stock,
  .same-industry {
    display: none !important;
    z-index: -9999 !important;
  }

  .main-app-header,
  .financial-indicators-box,
  .stock-statistic-trading-chart,
  .stock-report-analytics-follow-box,
  .top-stock-relate-by-business,
  .business-plan-box,
  .report-box,
  .event-schedule-box,
  .trading-history-stock-box,
  .company-info-box,
  .article-relate-stock-box {
    display: none !important;
  }



  /* 3. Detail Box (Header thông tin giá) - 60px cố định */
  .stock-overview {
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 60px !important;
    background-color: #fff !important;
    z-index: 100 !important;
    padding: 0 !important;
    margin: 0 !important;
    border-bottom: 1px solid #e5e7eb !important;
    overflow: hidden !important;
  }

  /* Ẩn tất cả con của stock-overview TRỪ detail-box */
  .stock-overview > div:not(.detail-box):not(#detail-box) {
    display: none !important;
  }

  .detail-box, #detail-box {
    display: flex !important;
    flex-direction: row !important;
    justify-content: start !important;
    height: 100% !important;
    background: transparent !important;
    align-items: center !important;
  }

  .detail-box .info-box {
    transform: scale(0.7) !important;
    transform-origin: left center !important;
  }

  .detail-box .info-box .action-box {
    display: none !important;
  }

  .detail-box .price-box .price-detail {
    display: flex !important;
    flex-direction: column !important;
    transform: scale(0.7) !important;
    transform-origin: left center !important;
  }

  .detail-box .extra-info-box {
    display: flex !important;
    flex-direction: column !important;
    transform: scale(0.7) !important;
    transform-origin: left center !important;
  }

  /* 4. Stock Chart Area
     Chiếm 70% viewport chiều dọc (sau 60px header) */
  .stock-chart {
    position: fixed !important;
    top: 60px !important;
    left: 0 !important;
    width: 100% !important;
    height: 70vh !important;
    z-index: 50 !important;
    background-color: #fff !important;
    padding: 2px !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  /* Ẩn header chart (title, time filters) để tiết kiệm không gian */
  .stock-chart > .stock-box-head {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    background: transparent !important;
    padding: 0 4px !important;
    margin: 0 !important;
    height: 24px !important;
    min-height: 0 !important;
    flex-shrink: 0 !important;
  }

  .stock-chart > .stock-box-head > .title-stock,
  .stock-chart > .stock-box-head > h2,
  .stock-chart > .stock-box-head > span {
    display: none !important;
  }

  .stock-chart > .stock-box-head > .list-filter {
    display: flex !important;
    transform: scale(0.85) !important;
    transform-origin: right center !important;
  }

  /* Hiện giá info row */
  .stock-chart > div[style*="justify-content"] {
    display: flex !important;
    flex-shrink: 0 !important;
    margin-bottom: 1px !important;
  }

  /* 5. Chart Sync Container - chứa chart chính + KL chart */
  #chart-sync-container {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    width: 100% !important;
  }

  /* Chart chính (giá) - chiếm 55% */
  #chart-sync-container > .chart-box:nth-of-type(1) {
    flex: 55 !important;
    display: block !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  /* Chart KL (Volume) - chiếm 45% - HIỆN LẠI */
  #chart-sync-container > .chart-box:nth-of-type(2) {
    flex: 45 !important;
    display: block !important;
    width: 100% !important;
    overflow: hidden !important;
    border-top: 1px solid #e5e7eb !important;
  }

  /* Ẩn chart box thứ 3+ */
  #chart-sync-container > .chart-box:nth-of-type(n+3) {
    display: none !important;
  }

  /* Ép Highcharts fill parent */
  .highcharts-container, .highcharts-root {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
  }

  /* 6. GD Khối ngoại - Chiếm phần diện tích còn lại đến hết màn hình
     Top = 60px (header) + 70vh (main chart)
     Height = calc(100vh - 60px - 70vh) */
  .foreign-transactions {
    display: block !important;
    position: fixed !important;
    top: calc(60px + 70vh) !important;
    left: 0 !important;
    width: 100% !important;
    height: calc(100vh - 60px - 70vh) !important;
    z-index: 50 !important;
    background-color: #fff !important;
    overflow: hidden !important;
    border-top: 2px solid #e5e7eb !important;
    padding: 4px !important;
    box-sizing: border-box !important;
  }




  /* Ẩn header text thừa trong foreign-transactions */
  .foreign-transactions > .stock-box-head {
    display: flex !important;
    height: 20px !important;
    min-height: 0 !important;
    padding: 0 4px !important;
    align-items: center !important;
    flex-shrink: 0 !important;
  }

  .foreign-transactions > .tabs {
    display: none !important;
  }

  .foreign-transactions > .stock-box-head > h2,
  .foreign-transactions > .stock-box-head > span {
    font-size: 11px !important;
  }

  /* Foreign trading chart container */
  .foreign-transactions .content,
  .foreign-transactions .foreign-trading-series-chart {
    width: 100% !important;
    height: calc(100% - 24px) !important;
    overflow: hidden !important;
  }

  .foreign-transactions .highcharts-container,
  .foreign-transactions .foreign-trading-series-chart .highcharts-container {
    width: 100% !important;
    height: 100% !important;
  }

  .foreign-transactions .highcharts-root {
    width: 100% !important;
    height: 100% !important;
  }

`;

// JS to trigger resize and cleanup for capture mode
export const CAPTURE_FOCUS_JS = `
  (function() {
    function focusCapture() {
      // Xóa quảng cáo cứng đầu
      document.querySelectorAll('.modal, .modal-backdrop, [class*="popup"], [id^="ads"]').forEach(e => e.remove());

      // Trigger resize để Highcharts vẽ lại
      window.dispatchEvent(new Event('resize'));
    }

    // Chạy liên tục trong 5 giây đầu
    focusCapture();
    var count = 0;
    var interval = setInterval(function() {
      focusCapture();
      count++;
      if (count > 10) clearInterval(interval);
    }, 500);

    // Lắng nghe resize
    window.addEventListener('resize', function() {
      setTimeout(focusCapture, 100);
    });
  })();
`;
