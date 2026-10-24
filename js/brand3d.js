// 브랜드 히어로: 모니터(내 PC) 화면이 빛줄기를 타고 폰으로 그대로 전달됨.
// 스크롤 단계마다 화면 내용이 바뀜: 소개 → 게임 → 업무 → 작업 → 모델링.
// 화면은 캔버스로 그린 시안. 영상이 준비되면 .hero-copy[data-video] 로 교체 (같은 영상이 모니터·폰에 동시에 나옴).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const track = document.getElementById('heroTrack');
const canvas = document.getElementById('scene');
const copies = [...track.querySelectorAll('.hero-copy')];
const navBtns = [...track.querySelectorAll('.use-nav button')];
const hudMode = document.getElementById('hudMode');
const hudLatency = document.getElementById('hudLatency');
const hudFps = document.getElementById('hudFps');
const isLight = () => document.documentElement.dataset.theme === 'light';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEPS = copies.length;
const MODES = copies.map(c => c.dataset.mode);
const MODE_NAME = { intro: '연결됨', work: '업무', edit: '작업', model: '모델링', game: '게임' };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;

/* ---------- 스크롤 → 단계 (WebGL 없어도 동작) ---------- */
let step = -1;
function scrollProgress() {
    const total = track.offsetHeight - innerHeight;
    return clamp(-track.getBoundingClientRect().top / total, 0, 1);
}
function setStep(s) {
    if (s === step) return;
    step = s;
    copies.forEach((c, i) => c.dataset.active = String(i === s));
    navBtns.forEach(b => b.setAttribute('aria-current', String(+b.dataset.step === s)));
    hudMode.textContent = MODE_NAME[MODES[s]] || '연결됨';
    screen.setMode(MODES[s], copies[s].dataset.video);
}
function onScroll() {
    setStep(Math.min(STEPS - 1, Math.floor(scrollProgress() * STEPS)));
}
navBtns.forEach(b => b.addEventListener('click', () => {
    const total = track.offsetHeight - innerHeight;
    const s = +b.dataset.step;
    scrollTo({ top: track.offsetTop + (s + 0.5) / STEPS * total, behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---------- 화면 그리기 (1280x720) ---------- */
const W = 1280, H = 720;
const NEON = '#00ff85';
const FONT = "'Noto Sans KR', sans-serif";
const NUM = "'Saira Condensed', 'Noto Sans KR', sans-serif";

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

function drawCursor(c, x, y) {
    c.save();
    c.translate(x, y);
    c.fillStyle = '#fff';
    c.strokeStyle = '#000';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(0, 30); c.lineTo(8, 23); c.lineTo(14, 36); c.lineTo(20, 33); c.lineTo(14, 21); c.lineTo(24, 21);
    c.closePath(); c.fill(); c.stroke();
    c.restore();
}

function desktop(c) {
    c.fillStyle = '#0c1013';
    c.fillRect(0, 0, W, H);
    // 작업표시줄
    c.fillStyle = '#151a1e';
    c.fillRect(0, H - 44, W, 44);
    for (let i = 0; i < 6; i++) {
        rr(c, W / 2 - 150 + i * 52, H - 36, 36, 28, 6);
        c.fillStyle = i === 0 ? NEON : 'rgba(255,255,255,.12)';
        c.fill();
    }
    c.fillStyle = '#9aa4ac';
    c.font = `600 18px ${NUM}`;
    c.textAlign = 'right';
    c.fillText(new Date().toTimeString().slice(0, 5), W - 20, H - 15);
    c.textAlign = 'left';
}

function windowFrame(c, x, y, w, h, title) {
    rr(c, x, y, w, h, 12);
    c.fillStyle = '#161c20';
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = '#1d2429';
    c.fillRect(x, y, w, 40);
    c.restore();
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
        c.beginPath(); c.arc(x + 22 + i * 22, y + 20, 6, 0, Math.PI * 2); c.fillStyle = col; c.fill();
    });
    c.fillStyle = '#cfd6db';
    c.font = `500 16px ${FONT}`;
    c.fillText(title, x + 100, y + 26);
}

function drawLogoMark(c, cx, cy, s) {
    c.lineWidth = 14 * s;
    c.strokeStyle = '#fff';
    rr(c, cx - 90 * s, cy - 50 * s, 180 * s, 100 * s, 50 * s);
    c.stroke();
    rr(c, cx - 48 * s, cy - 10 * s, 96 * s, 20 * s, 10 * s);
    c.fillStyle = NEON;
    c.fill();
}

const painters = {
    intro(c, t) {
        const g = c.createRadialGradient(W * .5, H * .45, 40, W * .5, H * .45, 700);
        g.addColorStop(0, '#0f2a1d');
        g.addColorStop(1, '#06090a');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        drawLogoMark(c, W / 2, 230, 1.1);
        c.fillStyle = '#fff';
        c.font = `800 64px ${NUM}`;
        c.textAlign = 'center';
        c.fillText('DEEPLINK', W / 2, 370);
        c.fillStyle = '#9aa4ac';
        c.font = `500 24px ${FONT}`;
        c.fillText('원격에 특화된 고성능 원격 제어 프로그램', W / 2, 412);
        // My List 카드: 집 메인 컴퓨터 연결 중
        rr(c, W / 2 - 300, 460, 600, 120, 18);
        c.fillStyle = 'rgba(255,255,255,.06)';
        c.fill();
        c.textAlign = 'left';
        c.fillStyle = '#fff';
        c.font = `700 22px ${FONT}`;
        c.fillText('My List', W / 2 - 270, 500);
        rr(c, W / 2 - 270, 518, 540, 44, 10);
        c.fillStyle = '#00c764';
        c.fill();
        c.fillStyle = '#04140b';
        c.font = `700 20px ${FONT}`;
        c.fillText('집 메인 컴퓨터', W / 2 - 250, 547);
        const pulse = (Math.sin(t * 4) + 1) / 2;
        c.beginPath();
        c.arc(W / 2 + 240, 540, 7 + pulse * 3, 0, Math.PI * 2);
        c.fillStyle = '#04140b';
        c.fill();
        c.textAlign = 'right';
        c.font = `700 18px ${FONT}`;
        c.fillText('연결됨', W / 2 + 222, 547);
        c.textAlign = 'left';
    },

    work(c, t) {
        desktop(c);
        const x = 60, y = 40, w = W - 120, h = H - 110;
        windowFrame(c, x, y, w, h, '3분기 매출 보고서.xlsx');
        // 리본
        c.fillStyle = '#12171b';
        c.fillRect(x, y + 40, w, 44);
        for (let i = 0; i < 9; i++) { rr(c, x + 16 + i * 46, y + 50, 34, 24, 5); c.fillStyle = 'rgba(255,255,255,.09)'; c.fill(); }
        // 시트
        const gx = x + 16, gy = y + 100, cw = 108, ch = 34, cols = 6, rows = 13;
        c.font = `500 15px ${NUM}`;
        for (let r = 0; r < rows; r++) {
            for (let k = 0; k < cols; k++) {
                const cx = gx + k * cw, cy = gy + r * ch;
                c.fillStyle = r === 0 ? '#1f272c' : (r % 2 ? '#161c20' : '#182024');
                c.fillRect(cx, cy, cw - 1, ch - 1);
                c.fillStyle = r === 0 ? '#e5e7eb' : '#aeb6bd';
                const txt = r === 0 ? ['지점', '7월', '8월', '9월', '합계', '증감'][k]
                    : k === 0 ? ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '수원', '창원', '고양', '용인'][r - 1]
                        : String(Math.round(1200 + 900 * Math.abs(Math.sin(r * 3.1 + k * 1.7))));
                c.fillText(txt, cx + 10, cy + 23);
            }
        }
        // 선택 셀
        const sel = Math.floor(t * 1.2) % 12;
        c.strokeStyle = NEON;
        c.lineWidth = 3;
        c.strokeRect(gx + 4 * cw, gy + (sel + 1) * ch, cw - 1, ch - 1);
        // 차트
        const bx = gx + cols * cw + 30, by = gy, bw = w - (bx - x) - 30, bh = rows * ch;
        rr(c, bx, by, bw, bh, 12);
        c.fillStyle = '#12171b';
        c.fill();
        c.fillStyle = '#e5e7eb';
        c.font = `700 18px ${FONT}`;
        c.fillText('지점별 합계', bx + 20, by + 34);
        const n = 8;
        for (let i = 0; i < n; i++) {
            const v = 0.35 + 0.55 * Math.abs(Math.sin(i * 1.9 + 0.5)) * (0.85 + 0.15 * Math.sin(t * 2 + i));
            const bwid = (bw - 60) / n - 10;
            const hh = v * (bh - 90);
            rr(c, bx + 30 + i * (bwid + 10), by + bh - 24 - hh, bwid, hh, 6);
            c.fillStyle = i === 5 ? NEON : '#3a454d';
            c.fill();
        }
        drawCursor(c, gx + 4.5 * cw + 30 * Math.sin(t), gy + (sel + 1.6) * ch);
    },

    edit(c, t) {
        desktop(c);
        const x = 40, y = 30, w = W - 80, h = H - 90;
        windowFrame(c, x, y, w, h, '편집 - 브랜드 필름 v3');
        // 미리보기
        const px = x + 20, py = y + 56, pw = w * 0.62, ph = pw * 9 / 16 * 0.78;
        c.save();
        rr(c, px, py, pw, ph, 8);
        c.clip();
        const sky = c.createLinearGradient(0, py, 0, py + ph);
        sky.addColorStop(0, '#1b3b5c');
        sky.addColorStop(1, '#e48a4f');
        c.fillStyle = sky;
        c.fillRect(px, py, pw, ph);
        c.beginPath();
        c.arc(px + pw * 0.62, py + ph * 0.62, 46, 0, Math.PI * 2);
        c.fillStyle = '#ffd59a';
        c.fill();
        for (let layer = 0; layer < 3; layer++) {
            c.beginPath();
            c.moveTo(px, py + ph);
            for (let i = 0; i <= 40; i++) {
                const xx = px + i / 40 * pw;
                const yy = py + ph * (0.62 + layer * 0.1) - 40 * Math.sin(i * 0.4 + layer * 2 + t * 0.3 * (layer + 1)) * (1 - layer * 0.25);
                c.lineTo(xx, yy);
            }
            c.lineTo(px + pw, py + ph);
            c.fillStyle = ['#2d3a4a', '#1f2833', '#12181f'][layer];
            c.fill();
        }
        c.restore();
        // 인스펙터
        const ix = px + pw + 20, iw = w - (ix - x) - 20;
        rr(c, ix, py, iw, ph, 8);
        c.fillStyle = '#12171b';
        c.fill();
        c.font = `500 15px ${FONT}`;
        ['노출', '대비', '채도', '색온도', '선명도'].forEach((lb, i) => {
            const yy = py + 40 + i * 52;
            c.fillStyle = '#aeb6bd';
            c.fillText(lb, ix + 18, yy);
            rr(c, ix + 18, yy + 12, iw - 36, 6, 3);
            c.fillStyle = '#2a333a';
            c.fill();
            const k = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(i * 2 + (i === 2 ? t : 0)));
            c.beginPath();
            c.arc(ix + 18 + k * (iw - 36), yy + 15, 8, 0, Math.PI * 2);
            c.fillStyle = i === 2 ? NEON : '#cfd6db';
            c.fill();
        });
        // 타임라인
        const tx = px, ty = py + ph + 20, tw = w - 40, th = h - (ty - y) - 20;
        rr(c, tx, ty, tw, th, 8);
        c.fillStyle = '#12171b';
        c.fill();
        const tracks = [['#4d7cff', [[0, .22], [.24, .5], [.52, .9]]], ['#a35cff', [[.1, .35], [.4, .7]]], ['#00c764', [[0, .95]]], ['#ffb547', [[.3, .42], [.6, .78]]]];
        tracks.forEach(([col, clips], i) => {
            const yy = ty + 20 + i * ((th - 30) / 4);
            const hh = (th - 30) / 4 - 10;
            clips.forEach(([a, b]) => {
                rr(c, tx + 80 + a * (tw - 100), yy, (b - a) * (tw - 100) - 4, hh, 6);
                c.fillStyle = col;
                c.globalAlpha = .75;
                c.fill();
                c.globalAlpha = 1;
            });
            c.fillStyle = '#6b7680';
            c.font = `700 14px ${NUM}`;
            c.fillText(['V1', 'V2', 'A1', 'FX'][i], tx + 20, yy + hh / 2 + 5);
        });
        const ph2 = tx + 80 + ((t * 0.08) % 1) * (tw - 100);
        c.fillStyle = '#fff';
        c.fillRect(ph2, ty + 8, 2, th - 16);
        // 렌더링 진행
        const prog = (t * 0.05) % 1;
        rr(c, px + 16, py + 16, 240, 44, 10);
        c.fillStyle = 'rgba(0,0,0,.6)';
        c.fill();
        c.fillStyle = '#fff';
        c.font = `700 16px ${FONT}`;
        c.fillText(`렌더링 ${Math.floor(prog * 100)}%`, px + 32, py + 44);
        rr(c, px + 150, py + 34, 90, 6, 3);
        c.fillStyle = '#2a333a';
        c.fill();
        rr(c, px + 150, py + 34, 90 * prog, 6, 3);
        c.fillStyle = NEON;
        c.fill();
    },

    model(c, t) {
        desktop(c);
        const x = 30, y = 24, w = W - 60, h = H - 78;
        windowFrame(c, x, y, w, h, '스컬핑 - character_head.blend');
        // 툴 선반
        for (let i = 0; i < 9; i++) {
            rr(c, x + 14, y + 60 + i * 50, 38, 38, 8);
            c.fillStyle = i === 2 ? NEON : 'rgba(255,255,255,.08)';
            c.fill();
        }
        // 뷰포트
        const vx = x + 66, vy = y + 52, vw = w - 66 - 260, vh = h - 64;
        rr(c, vx, vy, vw, vh, 8);
        c.fillStyle = '#1c2125';
        c.fill();
        c.save();
        rr(c, vx, vy, vw, vh, 8);
        c.clip();
        // 바닥 그리드
        const cx = vx + vw / 2, cy = vy + vh * 0.55;
        c.strokeStyle = 'rgba(255,255,255,.07)';
        c.lineWidth = 1;
        for (let i = -10; i <= 10; i++) {
            c.beginPath(); c.moveTo(cx + i * 60, cy + 120); c.lineTo(cx + i * 20, cy + 40); c.stroke();
        }
        for (let j = 0; j < 6; j++) {
            const yy = cy + 40 + j * j * 4;
            c.beginPath(); c.moveTo(vx, yy); c.lineTo(vx + vw, yy); c.stroke();
        }
        // 와이어프레임 토러스 노트
        const ay = t * 0.5, ax = 0.45;
        const R = 150;
        const P = (u, v) => {
            const p = 2, q = 3, r = 0.42;
            const cu = Math.cos(u), su = Math.sin(u), qu = q * u / p;
            const rr2 = 1 + 0.45 * Math.cos(qu);
            const bx = rr2 * cu, by = rr2 * su, bz = 0.45 * Math.sin(qu);
            const ox = bx + r * 0.6 * Math.cos(v) * cu, oy = by + r * 0.6 * Math.cos(v) * su, oz = bz + r * 0.6 * Math.sin(v);
            let X = ox * Math.cos(ay) + oz * Math.sin(ay), Z = -ox * Math.sin(ay) + oz * Math.cos(ay), Y = oy;
            const Y2 = Y * Math.cos(ax) - Z * Math.sin(ax), Z2 = Y * Math.sin(ax) + Z * Math.cos(ax);
            const s = 3.2 / (3.2 + Z2);
            return [cx + X * R * s, cy - 40 + Y2 * R * s, Z2];
        };
        const U = 96, V = 10;
        for (let i = 0; i < U; i++) {
            const u0 = i / U * Math.PI * 4, u1 = (i + 1) / U * Math.PI * 4;
            for (let j = 0; j < V; j++) {
                const v0 = j / V * Math.PI * 2;
                const a = P(u0, v0), b = P(u1, v0), d = P(u0, v0 + Math.PI * 2 / V);
                const depth = clamp(0.5 - a[2] * 0.4, 0.15, 1);
                const hot = Math.abs(((i / U + t * 0.05) % 1) - 0.5) < 0.04;
                c.strokeStyle = hot ? `rgba(0,255,133,${depth})` : `rgba(220,226,230,${depth * 0.55})`;
                c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.moveTo(a[0], a[1]); c.lineTo(d[0], d[1]); c.stroke();
            }
        }
        // 축
        c.lineWidth = 3;
        [['#ff5f57', [60, 0]], ['#28c840', [0, -60]], ['#4d7cff', [-36, 30]]].forEach(([col, [dx, dy]]) => {
            c.strokeStyle = col; c.beginPath(); c.moveTo(vx + 60, vy + vh - 60); c.lineTo(vx + 60 + dx * .6, vy + vh - 60 + dy * .6); c.stroke();
        });
        c.restore();
        // 아웃라이너
        const ox = vx + vw + 14, ow = x + w - 14 - ox;
        rr(c, ox, vy, ow, vh, 8);
        c.fillStyle = '#12171b';
        c.fill();
        c.font = `500 15px ${FONT}`;
        ['Scene', '  Camera', '  Light', '  Head_mesh', '  Eyes', '  Hair_curves', '  Floor'].forEach((s, i) => {
            if (i === 3) { rr(c, ox + 8, vy + 18 + i * 34, ow - 16, 28, 6); c.fillStyle = 'rgba(0,255,133,.16)'; c.fill(); }
            c.fillStyle = i === 3 ? '#fff' : '#9aa4ac';
            c.fillText(s, ox + 18, vy + 38 + i * 34);
        });
        c.fillStyle = '#6b7680';
        c.font = `600 15px ${NUM}`;
        c.fillText('VERTS 1,284,096 · GPU RTX', ox + 18, vy + vh - 20);
    },

    game(c, t) {
        // 레이싱 게임 시안 (실제 게임 영상으로 교체 예정)
        const hz = H * 0.52;
        const sky = c.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, '#0b0620');
        sky.addColorStop(1, '#ff5e7e');
        c.fillStyle = sky;
        c.fillRect(0, 0, W, hz);
        c.save();
        c.beginPath();
        c.arc(W / 2, hz, 170, Math.PI, 0);
        c.clip();
        const sun = c.createLinearGradient(0, hz - 170, 0, hz);
        sun.addColorStop(0, '#ffe27a');
        sun.addColorStop(1, '#ff7a59');
        c.fillStyle = sun;
        c.fillRect(W / 2 - 170, hz - 170, 340, 170);
        c.fillStyle = '#ff5e7e';
        for (let i = 0; i < 6; i++) c.fillRect(W / 2 - 170, hz - 70 + i * 12, 340, 2 + i);
        c.restore();
        c.beginPath();
        c.moveTo(0, hz);
        for (let i = 0; i <= 32; i++) c.lineTo(i / 32 * W, hz - 30 - 50 * Math.abs(Math.sin(i * 1.3)) * (i % 3 ? 0.6 : 1));
        c.lineTo(W, hz);
        c.fillStyle = '#1a0f33';
        c.fill();
        // 바닥
        c.fillStyle = '#0a0414';
        c.fillRect(0, hz, W, H - hz);
        c.strokeStyle = 'rgba(255,94,200,.55)';
        c.lineWidth = 2;
        for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(W / 2 + i * 8, hz); c.lineTo(W / 2 + i * 180, H); c.stroke(); }
        const sp = (t * 1.6) % 1;
        for (let j = 0; j < 12; j++) {
            const k = (j + sp) / 12;
            const yy = hz + (H - hz) * k * k;
            c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke();
        }
        // 도로
        c.beginPath();
        c.moveTo(W / 2 - 24, hz); c.lineTo(W / 2 + 24, hz); c.lineTo(W / 2 + 420, H); c.lineTo(W / 2 - 420, H); c.closePath();
        c.fillStyle = 'rgba(20,10,40,.85)';
        c.fill();
        c.fillStyle = '#fff';
        for (let j = 0; j < 8; j++) {
            const k0 = ((j + sp * 2) % 8) / 8, k1 = k0 + 0.04;
            const y0 = hz + (H - hz) * k0 * k0, y1 = hz + (H - hz) * k1 * k1;
            const w0 = 2 + 10 * k0, w1 = 2 + 10 * k1;
            c.beginPath(); c.moveTo(W / 2 - w0, y0); c.lineTo(W / 2 + w0, y0); c.lineTo(W / 2 + w1, y1); c.lineTo(W / 2 - w1, y1); c.fill();
        }
        // 차
        const carX = W / 2 + Math.sin(t * 0.9) * 70;
        c.fillStyle = '#111';
        rr(c, carX - 120, H - 150, 240, 80, 20); c.fill();
        c.fillStyle = NEON;
        rr(c, carX - 100, H - 140, 200, 14, 7); c.fill();
        c.fillStyle = '#ff3b5c';
        rr(c, carX - 112, H - 108, 50, 14, 5); c.fill();
        rr(c, carX + 62, H - 108, 50, 14, 5); c.fill();
        // HUD
        c.fillStyle = '#fff';
        c.font = `800 72px ${NUM}`;
        c.textAlign = 'right';
        c.fillText(String(Math.round(208 + 6 * Math.sin(t * 1.3))), W - 60, H - 60);
        c.font = `700 22px ${NUM}`;
        c.fillText('KM/H', W - 60, H - 30);
        c.textAlign = 'left';
        c.font = `800 30px ${NUM}`;
        c.fillText('LAP 2/3', 50, 64);
        c.font = `700 20px ${NUM}`;
        c.fillStyle = '#ffd36a';
        c.fillText('1:02.418', 50, 94);
        c.beginPath(); c.arc(W - 110, 110, 70, 0, Math.PI * 2);
        c.fillStyle = 'rgba(0,0,0,.45)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3;
        c.beginPath(); c.ellipse(W - 110, 110, 44, 26, 0.4, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(W - 110 + 44 * Math.cos(t), 110 + 26 * Math.sin(t), 7, 0, Math.PI * 2); c.fillStyle = NEON; c.fill();
    }
};

// 폰 위 오버레이 (실제 앱처럼 조작 버튼)
function phoneOverlay(c, mode, w, h, t) {
    c.lineWidth = 3;
    const btn = (x, y, r, label, on) => {
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
        c.fillStyle = on ? 'rgba(0,255,133,.35)' : 'rgba(0,0,0,.35)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke();
        if (label) {
            c.fillStyle = '#fff'; c.font = `700 ${Math.round(r * .7)}px ${NUM}`; c.textAlign = 'center';
            c.fillText(label, x, y + r * .25); c.textAlign = 'left';
        }
    };
    // 왼쪽 위 설정 버튼
    rr(c, 24, 20, 48, 48, 12);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fill();
    c.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) c.fillRect(36, 32 + i * 10, 24, 4);
    if (mode === 'game') {
        btn(170, h - 170, 110, '', false);
        btn(170 + 44 * Math.sin(t * 0.9), h - 170, 46, '', true);
        const bx = w - 200, by = h - 190;
        btn(bx, by - 80, 46, 'Y', false);
        btn(bx - 80, by, 46, 'X', false);
        btn(bx + 80, by, 46, 'B', false);
        btn(bx, by + 80, 46, 'A', Math.sin(t * 6) > .6);
        btn(w - 120, 90, 40, 'R1', false);
        btn(260, 90, 40, 'L1', false);
    } else if (mode !== 'intro') {
        // 터치 지점 표시
        const x = w * (0.5 + 0.2 * Math.sin(t * 0.7)), y = h * (0.5 + 0.15 * Math.cos(t * 0.9));
        const k = (t * 1.5) % 1;
        c.beginPath(); c.arc(x, y, 20 + k * 40, 0, Math.PI * 2);
        c.strokeStyle = `rgba(0,255,133,${1 - k})`; c.stroke();
        c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
        // 키보드 버튼 줄
        ['Esc', 'Tab', 'Ctrl', 'Alt'].forEach((k2, i) => btn(70, 140 + i * 110, 42, k2, false));
    }
}

const screen = {
    mon: document.createElement('canvas'),
    pho: document.createElement('canvas'),
    mode: 'intro',
    video: null,
    t: 0,
    init() {
        this.mon.width = W; this.mon.height = H;
        this.pho.width = 1560; this.pho.height = 720;
        this.mc = this.mon.getContext('2d');
        this.pc = this.pho.getContext('2d');
    },
    setMode(mode, videoSrc) {
        this.mode = mode;
        // 같은 영상이면 (소개 → 게임) 끊지 않고 이어서 재생
        if (this.video && videoSrc && this.video.getAttribute('src') === videoSrc) return;
        if (this.video) { this.video.pause(); this.video = null; }
        this.videoShown = false;
        if (videoSrc) {
            const v = document.createElement('video');
            v.setAttribute("src", videoSrc); v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = 'anonymous';
            v.play().catch(() => { });
            this.video = v;
        }
    },
    draw(dt) {
        this.t += dt;
        const c = this.mc;
        c.save();
        if (this.video && this.video.readyState >= 2) {
            const v = this.video, s = Math.max(W / v.videoWidth, H / v.videoHeight);
            c.drawImage(v, (W - v.videoWidth * s) / 2, (H - v.videoHeight * s) / 2, v.videoWidth * s, v.videoHeight * s);
            this.videoShown = true;
        } else if (!this.video || !this.videoShown) {
            // 영상 로딩 전에는 시안 화면. 반복 재생으로 처음으로 돌아갈 때는 마지막 프레임 유지 (깜빡임 방지)
            painters[this.mode](c, this.t);
        }
        c.restore();
        // 폰: 모니터 화면을 폰 비율로 잘라서 + 조작 오버레이
        const p = this.pc, pw = this.pho.width, ph = this.pho.height;
        const sh = W * ph / pw;
        p.drawImage(this.mon, 0, (H - sh) / 2, W, sh, 0, 0, pw, ph);
        // 영상 단계는 영상 위에 조작 버튼을 안 그림. 게임은 영상 위에도 게임패드 버튼을 얹어 '폰으로 조작' 느낌
        // 첫 화면(소개)도 게임 영상이라 폰에 게임패드 버튼을 같이 그림
        const overlay = this.videoShown && this.mode === 'intro' ? 'game' : this.mode;
        if (!this.videoShown || overlay === 'game') phoneOverlay(p, overlay, pw, ph, this.t);
    }
};
screen.init();
onScroll();
addEventListener('scroll', onScroll, { passive: true });

/* ---------- HUD 숫자 ---------- */
setInterval(() => {
    hudLatency.textContent = String(4 + Math.round(Math.random() * 2));
    hudFps.textContent = MODES[step] === 'game' ? String(238 + Math.round(Math.random() * 2)) : '60';
}, 900);

/* ---------- 3D ---------- */
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
    document.documentElement.classList.add('no-webgl');
}

if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x00ff85, 18, 12, 2);
    rim.position.set(2.5, 0.5, -1.5);
    scene.add(rim);
    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambient);

    const monTex = new THREE.CanvasTexture(screen.mon);
    const phoTex = new THREE.CanvasTexture(screen.pho);
    [monTex, phoTex].forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });

    const world = new THREE.Group();
    scene.add(world);

    // 흰색 모드는 알루미늄 모니터 (색은 applyTheme 에서)
    const bodyMat = new THREE.MeshStandardMaterial();
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.4, roughness: 0.2 });

    // 모니터
    const monitor = new THREE.Group();
    const mBody = new THREE.Mesh(new RoundedBoxGeometry(3.3, 1.94, 0.1, 4, 0.04), bodyMat);
    monitor.add(mBody);
    const mScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: monTex, toneMapped: false }));
    mScreen.position.set(0, 0.03, 0.052);
    monitor.add(mScreen);
    const neck = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.9, 0.08, 2, 0.03), bodyMat);
    neck.position.set(0, -1.25, -0.12);
    monitor.add(neck);
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.05, 0.6, 2, 0.02), bodyMat);
    base.position.set(0, -1.7, -0.05);
    monitor.add(base);
    world.add(monitor);

    // 폰 (가로)
    const phone = new THREE.Group();
    const pBody = new THREE.Mesh(new RoundedBoxGeometry(1.86, 0.9, 0.08, 6, 0.12), blackMat);
    phone.add(pBody);
    const pScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 0.803), new THREE.MeshBasicMaterial({ map: phoTex, toneMapped: false }));
    pScreen.position.z = 0.042;
    phone.add(pScreen);
    const cam = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    cam.position.set(-0.84, 0, 0.043);
    phone.add(cam);
    world.add(phone);

    // 연결 빛줄기: 모니터 → 폰 사이를 지나가는 데이터 점
    const beamMat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false });
    let beam = null;
    const dots = [];
    const dotGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ toneMapped: false });

    // 다크/흰색 전환 버튼(themechange)에 맞춰 재질·조명 변경
    function applyTheme() {
        const L = isLight();
        scene.environmentIntensity = L ? 0.9 : 0.35;
        rim.intensity = L ? 6 : 18;
        ambient.intensity = L ? 0.6 : 0.15;
        bodyMat.color.setHex(L ? 0xc9ced2 : 0x15191c);
        bodyMat.metalness = L ? 0.7 : 0.75;
        bodyMat.roughness = L ? 0.3 : 0.32;
        beamMat.color.setHex(L ? 0x00a050 : 0x00ff85);
        beamMat.opacity = L ? 0.5 : 0.35;
        dotMat.color.setHex(L ? 0x00b35c : 0x9dffd0);
    }
    applyTheme();
    addEventListener('themechange', applyTheme);
    for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(dotGeo, dotMat); world.add(d); dots.push(d); }
    let curve = null;
    function rebuildBeam() {
        const a = new THREE.Vector3(1.0, -0.35, 0.06).applyMatrix4(monitor.matrix);
        const b = new THREE.Vector3(0.0, 0.0, 0.0).applyMatrix4(phone.matrix);
        const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0.3, 0.5, 0.4));
        curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        if (beam) { beam.geometry.dispose(); world.remove(beam); }
        beam = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.006, 6, false), beamMat);
        world.add(beam);
    }

    // 단계별 자세. [폰 위치, 폰 회전, 모니터 회전Y, 카메라 거리]
    const POSES = {
        intro: { pp: [0.75, -0.95, 1.3], pr: [-0.12, -0.42, 0.04], my: -0.28, cz: 9.0 },
        work: { pp: [0.85, -0.85, 1.5], pr: [-0.1, -0.3, 0.02], my: -0.18, cz: 8.6 },
        edit: { pp: [0.6, -0.9, 1.6], pr: [-0.14, -0.5, 0.06], my: -0.34, cz: 8.6 },
        model: { pp: [0.9, -0.8, 1.7], pr: [-0.08, -0.22, -0.04], my: -0.12, cz: 8.4 },
        game: { pp: [0.35, -0.6, 2.4], pr: [-0.05, -0.08, 0.0], my: -0.3, cz: 8.2 }
    };
    const cur = { pp: new THREE.Vector3(...POSES.intro.pp), pr: new THREE.Vector3(...POSES.intro.pr), my: POSES.intro.my, cz: POSES.intro.cz };

    let mobile = false;
    function resize() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        mobile = camera.aspect < 0.9;
        camera.updateProjectionMatrix();
    }
    addEventListener('resize', resize);
    resize();

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    addEventListener('pointermove', e => {
        pointer.x = e.clientX / innerWidth - 0.5;
        pointer.y = e.clientY / innerHeight - 0.5;
    }, { passive: true });

    let running = true;
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(track);

    let last = performance.now();
    function loop() {
        if (!running) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        screen.draw(reduce ? 0 : dt);
        monTex.needsUpdate = true;
        phoTex.needsUpdate = true;

        const pose = POSES[MODES[step]] || POSES.intro;
        const k = 1 - Math.pow(0.0025, dt);
        cur.pp.lerp(new THREE.Vector3(...pose.pp), k);
        cur.pr.lerp(new THREE.Vector3(...pose.pr), k);
        cur.my = lerp(cur.my, pose.my, k);
        cur.cz = lerp(cur.cz, pose.cz, k);

        pointer.sx = lerp(pointer.sx, pointer.x, 0.05);
        pointer.sy = lerp(pointer.sy, pointer.y, 0.05);

        // 데스크탑: 왼쪽 글, 오른쪽 장면 / 모바일: 위 글, 아래 장면
        if (mobile) {
            world.position.set(-0.15, -2.2, 0);
            world.scale.setScalar(0.9);
            camera.position.set(0, 0.3, cur.cz * 1.5);
        } else {
            world.position.set(1.55, 0.05, 0);
            world.scale.setScalar(1);
            camera.position.set(pointer.sx * 0.6, 0.35 - pointer.sy * 0.3, cur.cz);
        }
        camera.lookAt(mobile ? 0 : 0.2, mobile ? -0.9 : 0, 0);

        const fl = reduce ? 0 : Math.sin(now / 900) * 0.04;
        monitor.rotation.y = cur.my;
        phone.position.set(cur.pp.x, cur.pp.y + fl, cur.pp.z);
        phone.rotation.set(cur.pr.x, cur.pr.y, cur.pr.z);
        monitor.updateMatrix();
        phone.updateMatrix();
        rebuildBeam();

        const tt = now / 1000;
        dots.forEach((d, i) => {
            const u = (tt * 0.45 + i / dots.length) % 1;
            d.position.copy(curve.getPoint(u));
            d.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.8);
        });

        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    }
    loop();
}
