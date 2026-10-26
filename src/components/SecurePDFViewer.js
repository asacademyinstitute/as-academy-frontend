'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ───────────────────────────── Config ───────────────────────────── */
const MIN_ZOOM = 0.5;          // zoom is relative to "fit width" (1 = 100% = fit)
const MAX_ZOOM = 5;
const DOUBLE_TAP_ZOOM = 2.5;
const PAGE_PADDING = 8;        // px around the page
const MAX_CANVAS_PIXELS = 16_000_000; // keeps iOS/Android canvas limits safe

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ───────────────────────── Security watermark ─────────────────────────
   Same look & logic as before. `k` = canvas pixels per CSS pixel, so the
   watermark stays the same visual size on retina screens.               */
function drawWatermark(ctx, width, height, text, k) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.font = `bold ${30 * k}px Arial, sans-serif`;
    ctx.fillStyle = '#222222';
    ctx.textAlign = 'center';
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-30 * (Math.PI / 180));

    const spacing = 680 * k;
    const rows = Math.ceil(height / spacing) + 1;
    const cols = Math.ceil(width / spacing) + 1;
    for (let r = -rows; r <= rows; r++) {
        for (let c = -cols; c <= cols; c++) {
            ctx.fillText(text, c * spacing, r * spacing);
        }
    }
    ctx.restore();
}

/* ───────────────────────────── Small UI bits ───────────────────────── */
const PATHS = {
    prev: 'M15 19l-7-7 7-7',
    next: 'M9 5l7 7-7 7',
    minus: 'M5 12h14',
    plus: 'M12 5v14M5 12h14',
    expand: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5',
    close: 'M6 18L18 6M6 6l12 12',
};

function Icon({ name, className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.4"
             strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d={PATHS[name]} />
        </svg>
    );
}

function IconBtn({ title, onClick, disabled, className = '', children }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition ${className}`}
        >
            {children}
        </button>
    );
}

/* ═════════════════════════════ Component ═════════════════════════════ */
export default function SecurePDFViewer({ pdfUrl, watermarkData }) {
    const rootRef = useRef(null);
    const scrollRef = useRef(null);
    const canvasRef = useRef(null);
    const badgeRef = useRef(null);

    const [pdf, setPdf] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInfo, setPageInfo] = useState(null);   // { page, w, h, num }
    const [shownPage, setShownPage] = useState(0);    // page number currently painted on canvas

    const [containerW, setContainerW] = useState(0);
    const [zoom, setZoom] = useState(1);              // relative to fit-width

    const [pageInput, setPageInput] = useState('');
    const [showPageInput, setShowPageInput] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [nativeFs, setNativeFs] = useState(false);
    const [pseudoFs, setPseudoFs] = useState(false);  // fallback for iOS Safari
    const isFullscreen = nativeFs || pseudoFs;

    // Refs so event listeners never see stale values
    const zoomRef = useRef(zoom);          zoomRef.current = zoom;
    const pageRef = useRef(currentPage);   pageRef.current = currentPage;
    const totalRef = useRef(totalPages);   totalRef.current = totalPages;
    const anchorRef = useRef(null);        // keeps the point under the fingers fixed while zooming
    const dragRef = useRef(null);

    // Watermark text (primitives as deps → no needless re-renders if parent recreates the object)
    const email = watermarkData?.email;
    const phone = watermarkData?.phone;
    const rawMark = `${email || ''} | ${phone || ''}`.trim();
    const watermarkText = !rawMark || rawMark === '|' ? '' : rawMark;

    /* ─── 1. Load document ─────────────────────────────────────────── */
    useEffect(() => {
        if (!pdfUrl) return;
        let cancelled = false;
        let task = null;

        (async () => {
            try {
                setStatus('loading');
                setError(null);
                setPdf(null);
                setPageInfo(null);
                setShownPage(0);

                const pdfjsLib = await import('pdfjs-dist');
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                        'pdfjs-dist/build/pdf.worker.min.mjs',
                        import.meta.url
                    ).toString();
                }

                const res = await fetch(pdfUrl);
                if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status}: ${res.statusText})`);
                const data = await res.arrayBuffer();
                if (cancelled) return;

                task = pdfjsLib.getDocument({ data, withCredentials: false });
                const doc = await task.promise;
                if (cancelled) return;

                setPdf(doc);
                setTotalPages(doc.numPages);
                setCurrentPage(1);
                setZoom(1);
                setStatus('ready');
            } catch (err) {
                if (cancelled) return;
                console.error('Error loading PDF:', err);
                setError(err.message || 'Failed to load PDF');
                setStatus('error');
            }
        })();

        return () => {
            cancelled = true;
            task?.destroy?.();
        };
    }, [pdfUrl, reloadKey]);

    /* ─── 2. Load the current page object (+ warm the next one) ────── */
    useEffect(() => {
        if (!pdf) return;
        let cancelled = false;

        pdf.getPage(currentPage)
            .then((page) => {
                if (cancelled) return;
                const vp = page.getViewport({ scale: 1 });
                setPageInfo({ page, w: vp.width, h: vp.height, num: currentPage });
                if (currentPage < pdf.numPages) pdf.getPage(currentPage + 1).catch(() => {});
            })
            .catch((err) => { if (!cancelled) console.error('Error loading page:', err); });

        return () => { cancelled = true; };
    }, [pdf, currentPage]);

    /* ─── 3. Track viewport width (rotation, fullscreen, resize) ───── */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        setContainerW(el.clientWidth);
        const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Derived sizes (CSS pixels). Canvas CSS size updates instantly on zoom;
    // the sharp bitmap is re-rendered right after (see effect 4).
    const fitScale = pageInfo && containerW
        ? Math.max(0.1, (containerW - PAGE_PADDING * 2) / pageInfo.w)
        : 1;
    const cssW = pageInfo ? Math.round(pageInfo.w * fitScale * zoom) : 0;
    const cssH = pageInfo ? Math.round(pageInfo.h * fitScale * zoom) : 0;

    /* ─── 4. Render page → offscreen canvas → swap (no flicker, retina-sharp) ── */
    useEffect(() => {
        if (!pageInfo || !cssW) return;
        let cancelled = false;
        let task = null;

        const timer = setTimeout(async () => {
            try {
                const { page, w, h, num } = pageInfo;
                const scale = cssW / w;
                const dpr = Math.min(window.devicePixelRatio || 1, 3);
                const k = Math.min(dpr, Math.sqrt(MAX_CANVAS_PIXELS / (cssW * (cssW * h / w))));
                const viewport = page.getViewport({ scale: scale * k });

                const off = document.createElement('canvas');
                off.width = Math.floor(viewport.width);
                off.height = Math.floor(viewport.height);
                const ctx = off.getContext('2d');

                task = page.render({ canvasContext: ctx, viewport });
                await task.promise;
                if (cancelled) return;

                if (watermarkText) drawWatermark(ctx, off.width, off.height, watermarkText, k);

                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.width = off.width;
                canvas.height = off.height;
                canvas.getContext('2d').drawImage(off, 0, 0);
                off.width = off.height = 0; // free memory (Safari)
                setShownPage(num);
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') console.error('Error rendering PDF page:', err);
            }
        }, 90); // debounce while zooming

        return () => {
            cancelled = true;
            clearTimeout(timer);
            task?.cancel();
        };
    }, [pageInfo, cssW, watermarkText]);

    /* ─── 5. Navigation ────────────────────────────────────────────── */
    const goTo = useCallback((p) => {
        const n = clamp(p, 1, totalRef.current || 1);
        if (n !== pageRef.current) setCurrentPage(n);
    }, []);

    // New page → start from the top-left
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (el) { el.scrollTop = 0; el.scrollLeft = 0; }
    }, [currentPage]);

    /* ─── 6. Zoom engine (keeps the focal point fixed) ─────────────── */
    const applyZoom = useCallback((target, opts = {}) => {
        const el = scrollRef.current;
        const canvas = canvasRef.current;
        if (!el || !canvas) return;

        const next = clamp(Math.abs(target - 1) < 0.06 ? 1 : target, MIN_ZOOM, MAX_ZOOM); // snap to fit
        const prev = zoomRef.current;
        if (Math.abs(next - prev) < 0.001) return;

        const box = el.getBoundingClientRect();
        const sx = opts.sx ?? box.left + box.width / 2;
        const sy = opts.sy ?? box.top + box.height / 2;
        let lx = opts.lx;
        let ly = opts.ly;
        if (lx == null) {
            const r = canvas.getBoundingClientRect();
            lx = sx - r.left;
            ly = sy - r.top;
        }
        const f = next / prev;
        anchorRef.current = { x: lx * f, y: ly * f, sx, sy };
        zoomRef.current = next;
        setZoom(next);
    }, []);

    // After the new size is in the DOM, scroll so the focal point stays under the fingers/cursor
    useLayoutEffect(() => {
        const a = anchorRef.current;
        if (!a) return;
        anchorRef.current = null;
        const el = scrollRef.current;
        const canvas = canvasRef.current;
        if (!el || !canvas) return;
        const r = canvas.getBoundingClientRect();
        el.scrollLeft += r.left + a.x - a.sx;
        el.scrollTop += r.top + a.y - a.sy;
    }, [zoom]);

    const zoomIn = () => applyZoom(zoomRef.current * 1.25);
    const zoomOut = () => applyZoom(zoomRef.current / 1.25);
    const zoomFit = () => applyZoom(1);

    /* ─── 7. Keyboard (print/save blocking kept as before) ─────────── */
    useEffect(() => {
        const onKey = (e) => {
            const mod = e.ctrlKey || e.metaKey;
            const k = e.key;

            if (mod && (k === 'p' || k === 'P' || k === 's' || k === 'S')) {
                e.preventDefault();
                return;
            }
            if (e.target?.tagName === 'INPUT' || mod || e.altKey) return;

            if (k === 'ArrowRight' || k === 'PageDown' || k === 'n' || k === 'N') {
                e.preventDefault(); goTo(pageRef.current + 1);
            } else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'p' || k === 'P') {
                e.preventDefault(); goTo(pageRef.current - 1);
            } else if (k === 'Home') {
                e.preventDefault(); goTo(1);
            } else if (k === 'End') {
                e.preventDefault(); goTo(totalRef.current);
            } else if (k === '+' || k === '=') {
                e.preventDefault(); applyZoom(zoomRef.current * 1.25);
            } else if (k === '-' || k === '_') {
                e.preventDefault(); applyZoom(zoomRef.current / 1.25);
            } else if (k === '0') {
                e.preventDefault(); applyZoom(1);
            } else if (k === 'Escape') {
                setPseudoFs(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [goTo, applyZoom]);

    /* ─── 8. Fullscreen (native + CSS fallback for iPhone) ─────────── */
    useEffect(() => {
        const onChange = () => setNativeFs(document.fullscreenElement === rootRef.current);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = async () => {
        const root = rootRef.current;
        if (!root) return;
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else if (pseudoFs) setPseudoFs(false);
            else if (root.requestFullscreen) await root.requestFullscreen();
            else setPseudoFs(true);
        } catch {
            setPseudoFs((v) => !v);
        }
    };

    /* ─── 9. Ctrl/⌘ + wheel and trackpad pinch (zooms at the cursor) ─ */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let raf = 0, factor = 1, sx = 0, sy = 0;

        const flush = () => {
            raf = 0;
            const f = factor; factor = 1;
            applyZoom(zoomRef.current * f, { sx, sy });
        };
        const onWheel = (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            e.preventDefault();
            factor *= Math.exp(-clamp(e.deltaY, -60, 60) * 0.006);
            sx = e.clientX; sy = e.clientY;
            if (!raf) raf = requestAnimationFrame(flush);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', onWheel);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [applyZoom]);

    /* ─── 10. Touch gestures ───────────────────────────────────────────
       • 1 finger          → native scroll/pan (smooth, with momentum)
       • 2 fingers         → pinch zoom around the fingers (GPU transform while pinching)
       • double-tap        → zoom in at the tap / back to fit
       • swipe left/right  → next / previous page (only when not zoomed in)   */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const g = { pinch: null, multi: false, x: 0, y: 0, t: 0, lastTap: { t: 0, x: 0, y: 0 } };
        const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
        const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
        const setBadge = (z) => {
            const node = badgeRef.current?.firstChild;
            if (node) node.nodeValue = `${Math.round(z * 100)}%`;
        };

        const onStart = (e) => {
            if (e.touches.length === 2) {
                const canvas = canvasRef.current;
                if (!canvas) return;
                g.multi = true;
                const [a, b] = e.touches;
                const m = mid(a, b);
                const r = canvas.getBoundingClientRect();
                g.pinch = {
                    d: dist(a, b), z: zoomRef.current,
                    sx: m.x, sy: m.y, mx: m.x, my: m.y,
                    lx: m.x - r.left, ly: m.y - r.top, ratio: 1,
                };
                el.style.overflow = 'hidden'; // freeze native scroll while pinching
                canvas.style.transition = 'none';
                canvas.style.willChange = 'transform';
                canvas.style.transformOrigin = `${g.pinch.lx}px ${g.pinch.ly}px`;
            } else if (e.touches.length === 1) {
                g.multi = false;
                g.x = e.touches[0].clientX;
                g.y = e.touches[0].clientY;
                g.t = Date.now();
            }
        };

        const onMove = (e) => {
            const p = g.pinch;
            if (!p || e.touches.length < 2) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const [a, b] = e.touches;
            const m = mid(a, b);
            const target = clamp((p.z * dist(a, b)) / p.d, MIN_ZOOM * 0.8, MAX_ZOOM * 1.1);
            p.ratio = target / p.z;
            p.mx = m.x; p.my = m.y;
            canvas.style.transform = `translate(${m.x - p.sx}px, ${m.y - p.sy}px) scale(${p.ratio})`;
            setBadge(target);
        };

        const onEnd = (e) => {
            const p = g.pinch;
            if (p && e.touches.length < 2) {
                g.pinch = null;
                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.style.transform = '';
                    canvas.style.transformOrigin = '';
                    canvas.style.willChange = '';
                }
                el.style.overflow = '';
                setBadge(zoomRef.current);
                applyZoom(p.z * p.ratio, { lx: p.lx, ly: p.ly, sx: p.mx, sy: p.my });
            }

            if (e.touches.length > 0) return;

            const wasMulti = g.multi;
            g.multi = false;
            if (wasMulti || e.type === 'touchcancel') return;

            const t = e.changedTouches[0];
            if (!t) return;
            const dx = t.clientX - g.x;
            const dy = t.clientY - g.y;
            const dt = Date.now() - g.t;

            // Swipe to turn page (only if the page isn't wider than the screen)
            const notZoomed = el.scrollWidth <= el.clientWidth + 2;
            if (notZoomed && dt < 600 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                goTo(pageRef.current + (dx < 0 ? 1 : -1));
                return;
            }

            // Double tap
            if (Math.hypot(dx, dy) < 10 && dt < 250) {
                const now = Date.now();
                const lt = g.lastTap;
                if (now - lt.t < 300 && Math.hypot(t.clientX - lt.x, t.clientY - lt.y) < 40) {
                    g.lastTap = { t: 0, x: 0, y: 0 };
                    applyZoom(zoomRef.current > 1.05 ? 1 : DOUBLE_TAP_ZOOM, { sx: t.clientX, sy: t.clientY });
                } else {
                    g.lastTap = { t: now, x: t.clientX, y: t.clientY };
                }
            }
        };

        // iOS Safari fires these for pinch; block its page-zoom
        const blockGesture = (e) => e.preventDefault();

        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: true });
        el.addEventListener('touchend', onEnd, { passive: true });
        el.addEventListener('touchcancel', onEnd, { passive: true });
        el.addEventListener('gesturestart', blockGesture);
        el.addEventListener('gesturechange', blockGesture);

        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
            el.removeEventListener('touchcancel', onEnd);
            el.removeEventListener('gesturestart', blockGesture);
            el.removeEventListener('gesturechange', blockGesture);
        };
    }, [applyZoom, goTo]);

    /* ─── 11. Desktop mouse drag-to-pan ────────────────────────────── */
    const onPointerDown = (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = scrollRef.current;
        if (!el || (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)) return;
        dragRef.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop };
        el.setPointerCapture(e.pointerId);
        setIsGrabbing(true);
    };
    const onPointerMove = (e) => {
        const d = dragRef.current;
        const el = scrollRef.current;
        if (!d || !el) return;
        el.scrollLeft = d.l - (e.clientX - d.x);
        el.scrollTop = d.t - (e.clientY - d.y);
    };
    const endDrag = () => {
        dragRef.current = null;
        setIsGrabbing(false);
    };

    /* ─── 12. Page jump input ──────────────────────────────────────── */
    const submitPage = (e) => {
        e.preventDefault();
        const p = parseInt(pageInput, 10);
        if (!Number.isNaN(p)) goTo(p);
        setShowPageInput(false);
        setPageInput('');
    };

    // Auto-hide the mobile hint
    useEffect(() => {
        if (!showHint) return;
        const t = setTimeout(() => setShowHint(false), 6000);
        return () => clearTimeout(t);
    }, [showHint]);

    const pageIsStale = shownPage !== currentPage;
    const canPan = zoom > 1.02;

    /* ═══════════════════════════ Render ═══════════════════════════ */
    return (
        <div
            ref={rootRef}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative flex flex-col bg-gray-100 dark:bg-gray-950 border border-border overflow-hidden shadow-sm select-none ${
                pseudoFs ? 'fixed inset-0 z-50 rounded-none' : 'rounded-2xl'
            }`}
            style={{
                height: isFullscreen ? '100dvh' : 'clamp(420px, 82dvh, 960px)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
            }}
        >
            {/* ── Top toolbar ───────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-border z-20">
                {showPageInput ? (
                    <form onSubmit={submitPage} className="flex items-center gap-1.5">
                        <input
                            autoFocus
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={totalPages}
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => { setShowPageInput(false); setPageInput(''); }}
                            placeholder={String(currentPage)}
                            className="w-16 h-9 text-center text-sm font-bold border-2 border-blue-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {totalPages}</span>
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => { setShowPageInput(true); setPageInput(String(currentPage)); }}
                        title="Tap to jump to a page"
                        className="h-9 px-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        Page <span className="font-bold text-blue-600 dark:text-blue-400">{currentPage}</span> / {totalPages || '–'}
                    </button>
                )}

                <div className="flex items-center gap-1.5">
                    <IconBtn title="Zoom out" onClick={zoomOut} disabled={zoom <= MIN_ZOOM}><Icon name="minus" /></IconBtn>
                    <button
                        ref={badgeRef}
                        type="button"
                        onClick={zoomFit}
                        title="Reset to fit width"
                        className="h-9 min-w-[52px] px-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition tabular-nums"
                    >
                        {`${Math.round(zoom * 100)}%`}
                    </button>
                    <IconBtn title="Zoom in" onClick={zoomIn} disabled={zoom >= MAX_ZOOM}><Icon name="plus" /></IconBtn>
                    <IconBtn
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        onClick={toggleFullscreen}
                        className="!bg-blue-50 dark:!bg-blue-950/40 !text-blue-600 dark:!text-blue-400 ml-1"
                    >
                        <Icon name={isFullscreen ? 'close' : 'expand'} />
                    </IconBtn>
                </div>
            </div>

            {/* ── Mobile hint ───────────────────────────────────────── */}
            {showHint && status === 'ready' && (
                <div className="sm:hidden flex items-center justify-between px-3 py-1.5 text-[11px] font-medium bg-blue-600/10 border-b border-blue-500/15 text-blue-700 dark:text-blue-300">
                    <span>Pinch or double-tap to zoom · Swipe to change page</span>
                    <button type="button" onClick={() => setShowHint(false)} className="px-1" aria-label="Dismiss">✕</button>
                </div>
            )}

            {/* ── Viewport ──────────────────────────────────────────── */}
            <div className="relative flex-1 min-h-0">
                <div
                    ref={scrollRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className={`absolute inset-0 overflow-auto flex ${
                        isGrabbing ? 'cursor-grabbing' : canPan ? 'cursor-grab' : 'cursor-default'
                    }`}
                    style={{
                        touchAction: 'pan-x pan-y',      // native 1-finger scroll; pinch handled by us
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    <div className="m-auto shrink-0" style={{ padding: PAGE_PADDING }}>
                        <canvas
                            ref={canvasRef}
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            className="block bg-white dark:bg-gray-900 rounded-lg shadow-lg"
                            style={{
                                width: cssW,
                                height: cssH,
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                pointerEvents: 'none',
                                opacity: pageIsStale ? 0.35 : 1,
                                transition: 'opacity 120ms',
                            }}
                        />
                    </div>
                </div>

                {/* Small spinner while a new page is painting */}
                {status === 'ready' && pageIsStale && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-9 h-9 rounded-full border-4 border-blue-600/25 border-t-blue-600 animate-spin" />
                    </div>
                )}

                {/* Loading overlay */}
                {status === 'loading' && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <div className="text-center p-6">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-blue-600/25 border-t-blue-600 animate-spin" />
                            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">Loading document</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Preparing secure viewer…</p>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {status === 'error' && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-50 dark:bg-gray-900 p-6">
                        <div className="text-center max-w-sm">
                            <h3 className="text-base font-bold text-red-800 dark:text-red-300 mb-1">Couldn’t load this PDF</h3>
                            <p className="text-xs text-red-600 dark:text-red-400 mb-4 break-words">{error}</p>
                            <button
                                type="button"
                                onClick={() => setReloadKey((k) => k + 1)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom navigation: prev · slider · next ───────────── */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-border z-20">
                <IconBtn title="Previous page" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}>
                    <Icon name="prev" />
                </IconBtn>
                <input
                    type="range"
                    min={1}
                    max={Math.max(totalPages, 1)}
                    value={currentPage}
                    disabled={totalPages <= 1}
                    onChange={(e) => goTo(Number(e.target.value))}
                    aria-label="Page"
                    className="flex-1 h-9 accent-blue-600"
                />
                <IconBtn
                    title="Next page"
                    onClick={() => goTo(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="!bg-blue-600 !text-white hover:!bg-blue-700"
                >
                    <Icon name="next" />
                </IconBtn>
            </div>

            {/* ── Security footer (unchanged) ───────────────────────── */}
            <div className="bg-amber-500/10 border-t border-amber-500/20 py-1 px-3 text-center">
                <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                    🔒 Protected Document • Download, printing, and sharing are restricted
                </p>
            </div>
        </div>
    );
}
