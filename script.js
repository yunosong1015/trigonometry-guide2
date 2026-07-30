/* =========================================================
   삼각비 가이드 - 동작 스크립트
   외부 라이브러리 없음 (인터넷 없이도 동작합니다)
   ========================================================= */
(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var COLOR = { sin: '#2563eb', cos: '#d97706', tan: '#dc2626', ray: '#334155', axis: '#94a3b8', ink: '#0f172a' };

    /* 세 값의 표시 여부 — 사분원 그림과 오른쪽 값 패널이 함께 씁니다 */
    var reveal = { sin: false, cos: false, tan: false };

    function el(tag, attrs) {
        var n = document.createElementNS(SVG_NS, tag);
        for (var k in attrs) { if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); }
        return n;
    }
    function txt(s, attrs) { var n = el('text', attrs); n.textContent = s; return n; }

    document.addEventListener('DOMContentLoaded', function () {

        /* ===================================================
           0. 큰 글씨 모드
           =================================================== */
        var bigBtn = document.getElementById('big-mode-btn');
        if (bigBtn) {
            bigBtn.addEventListener('click', function () {
                var on = document.documentElement.classList.toggle('big-mode');
                bigBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
                bigBtn.innerHTML = on ? '가&nbsp;보통 글씨' : '가&nbsp;큰 글씨';
                drawUnitCircle();
            });
        }

        /* ===================================================
           1. 복습 · 도입 — 어떤 것을 구할 수 있을까?
           =================================================== */
        var probeCards = document.querySelectorAll('.probe-card');
        var probeProgress = document.getElementById('probe-progress');
        var probeSummary = document.getElementById('probe-summary');
        var probeAllBtn = document.getElementById('probe-all');
        var probeResetBtn = document.getElementById('probe-reset');

        function probeCount() {
            var n = 0;
            probeCards.forEach(function (c) { if (c.dataset.done === '1') n++; });
            return n;
        }
        function probeRefresh() {
            var n = probeCount();
            if (probeProgress) probeProgress.innerHTML = '확인한 도형 : <b>' + n + '</b> / ' + probeCards.length;
            if (probeSummary) probeSummary.classList.toggle('open', n === probeCards.length);
        }
        function probeOpen(card, choice) {
            card.dataset.done = '1';
            var answer = card.dataset.answer;
            card.querySelectorAll('.probe-btn').forEach(function (btn) {
                btn.disabled = true;
                btn.classList.remove('right', 'wrong');
                if (btn.dataset.choice === answer) btn.classList.add('right');
                else if (choice && btn.dataset.choice === choice) btn.classList.add('wrong');
            });
            var fb = card.querySelector('.probe-feedback');
            if (fb) fb.classList.add('open');
            probeRefresh();
        }
        function probeReset(card) {
            delete card.dataset.done;
            card.querySelectorAll('.probe-btn').forEach(function (btn) {
                btn.disabled = false;
                btn.classList.remove('right', 'wrong');
            });
            var fb = card.querySelector('.probe-feedback');
            if (fb) fb.classList.remove('open');
        }

        probeCards.forEach(function (card) {
            card.querySelectorAll('.probe-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    probeOpen(card, btn.dataset.choice);
                });
            });
        });
        if (probeAllBtn) probeAllBtn.addEventListener('click', function () {
            probeCards.forEach(function (c) { probeOpen(c, null); });
        });
        if (probeResetBtn) probeResetBtn.addEventListener('click', function () {
            probeCards.forEach(probeReset);
            probeRefresh();
        });
        probeRefresh();

        /* ===================================================
           2. 에스컬레이터 — 축도를 그려 높이 구하기
           =================================================== */
        var escSvg = document.getElementById('esc-svg');
        var escPlan = document.getElementById('esc-plan');
        var escChips = document.querySelectorAll('.esc-chip');
        var escInput = document.getElementById('esc-measure');
        var escCheck = document.getElementById('esc-check');
        var escErr = document.getElementById('esc-err');
        var escResult = document.getElementById('esc-result');

        var ESC = { deg: 35, real: 20, mpc: 2, PPC: 50, OX: 55, OY: 330 };   /* PPC = 1cm 당 SVG 길이 */
        var ESC_TRUE = ESC.real * Math.sin(ESC.deg * Math.PI / 180);          /* 11.47 m */

        function drawEsc() {
            if (!escSvg) return;
            var mpc = ESC.mpc;
            var lenCm = ESC.real / mpc;                       /* 축도에서의 빗변 길이(cm) */
            var rad = ESC.deg * Math.PI / 180;
            var hCm = lenCm * Math.sin(rad);
            var bCm = lenCm * Math.cos(rad);

            var P = ESC.PPC, OX = ESC.OX, OY = ESC.OY;
            var CX = OX + bCm * P, TY = OY - hCm * P;

            if (escPlan) {
                escPlan.innerHTML = '축척 <span class="big">1 cm = ' + mpc + ' m</span> → 20 m 를 ' +
                    '<span class="big">' + lenCm.toFixed(0) + ' cm</span> 로 그리고, 각도기로 ' +
                    '<span class="big">35°</span> 를 맞춥니다.';
            }

            while (escSvg.firstChild) escSvg.removeChild(escSvg.firstChild);

            /* 지면 */
            escSvg.appendChild(el('line', { x1: OX - 25, y1: OY, x2: OX + bCm * P + 40, y2: OY, stroke: '#cbd5e1', 'stroke-width': 3 }));
            /* 밑변 · 빗변 · 높이 */
            escSvg.appendChild(el('line', { x1: OX, y1: OY, x2: CX, y2: OY, stroke: COLOR.cos, 'stroke-width': 5 }));
            escSvg.appendChild(el('line', { x1: OX, y1: OY, x2: CX, y2: TY, stroke: COLOR.ray, 'stroke-width': 6 }));
            escSvg.appendChild(el('line', { x1: CX, y1: OY, x2: CX, y2: TY, stroke: COLOR.sin, 'stroke-width': 6 }));
            escSvg.appendChild(el('path', {
                d: 'M ' + (CX - 16) + ' ' + OY + ' L ' + (CX - 16) + ' ' + (OY - 16) + ' L ' + CX + ' ' + (OY - 16),
                fill: 'none', stroke: COLOR.ray, 'stroke-width': 2
            }));
            /* 각도기 자리 */
            escSvg.appendChild(el('path', {
                d: 'M ' + (OX + 46) + ' ' + OY + ' A 46 46 0 0 0 ' + (OX + 46 * Math.cos(rad)) + ' ' + (OY - 46 * Math.sin(rad)),
                fill: 'none', stroke: COLOR.ink, 'stroke-width': 2.5
            }));
            escSvg.appendChild(txt('35°', { x: OX + 74, y: OY - 20, 'font-size': 22, 'font-weight': 'bold', fill: COLOR.ink }));
            escSvg.appendChild(txt(lenCm.toFixed(0) + ' cm', {
                x: OX + bCm * P / 2 - 24 * Math.sin(rad), y: OY - hCm * P / 2 - 24 * Math.cos(rad),
                'font-size': 22, 'font-weight': 'bold', fill: COLOR.ray, 'text-anchor': 'middle',
                transform: 'rotate(' + (-ESC.deg) + ', ' + (OX + bCm * P / 2 - 24 * Math.sin(rad)) + ', ' + (OY - hCm * P / 2 - 24 * Math.cos(rad)) + ')'
            }));

            /* --- 높이에 붙는 눈금자 --- */
            var rx = CX + 4;
            escSvg.appendChild(el('line', { x1: rx, y1: OY, x2: rx, y2: OY - 6.6 * P, stroke: '#94a3b8', 'stroke-width': 2 }));
            for (var i = 0; i <= 66; i++) {
                var v = i / 10;                                   /* cm */
                var y = OY - v * P;
                var major = (i % 10 === 0), medium = (i % 5 === 0);
                var len = major ? 20 : (medium ? 13 : 7);
                escSvg.appendChild(el('line', {
                    x1: rx, y1: y, x2: rx + len, y2: y,
                    stroke: major ? '#475569' : '#94a3b8', 'stroke-width': major ? 2 : 1.4
                }));
                if (major) {
                    escSvg.appendChild(txt(String(i / 10), {
                        x: rx + 26, y: y + 8, 'font-size': 20, fill: '#475569'
                    }));
                }
            }
            escSvg.appendChild(txt('cm', { x: rx + 20, y: OY - 6.6 * P - 10, 'font-size': 18, fill: '#94a3b8' }));
            /* 꼭대기 안내선 */
            escSvg.appendChild(el('line', {
                x1: CX, y1: TY, x2: rx + 60, y2: TY, stroke: COLOR.sin, 'stroke-width': 1.6, 'stroke-dasharray': '6 4'
            }));

            escChips.forEach(function (c) {
                c.classList.toggle('active', parseFloat(c.dataset.mpc) === mpc);
            });
        }

        if (escSvg) {
            escChips.forEach(function (c) {
                c.addEventListener('click', function () {
                    ESC.mpc = parseFloat(c.dataset.mpc);
                    drawEsc();
                    if (escResult) escResult.classList.remove('open');
                    if (escInput) escInput.value = '';
                    if (escErr) escErr.textContent = '';
                });
            });
            drawEsc();
        }

        function escDoCheck() {
            if (!escInput) return;
            var raw = escInput.value.trim();
            if (raw === '') { escErr.textContent = '잰 길이를 적어 주세요.'; escResult.classList.remove('open'); return; }
            var cm = Number(raw);
            if (!isFinite(cm) || cm <= 0) { escErr.textContent = '0보다 큰 숫자를 적어 주세요.'; escResult.classList.remove('open'); return; }
            escErr.textContent = '';

            var real = cm * ESC.mpc;
            var gap = Math.abs(real - ESC_TRUE);
            var good = gap <= 0.9;

            escResult.className = 'esc-result open ' + (good ? 'good' : 'retry');
            escResult.innerHTML =
                '<div class="calc">실제 높이 = ' + cm.toFixed(1) + ' cm × ' + ESC.mpc + ' m/cm = ' + real.toFixed(1) + ' m</div>' +
                (good
                    ? '<p>✅ 잘 쟀습니다! 축도는 실제 에스컬레이터와 <b>닮은 도형</b>이므로, 축도에서 잰 높이에 축척을 곱하면 실제 높이가 됩니다.</p>'
                    : '<p>🔎 눈금을 다시 확인해 보세요. 빗변이 ' + (ESC.real / ESC.mpc).toFixed(0) +
                      ' cm일 때 높이는 그보다 <b>짧아야</b> 합니다.</p>') +
                '<p class="tiny">참고 : 나중에 배울 삼각비로 정확히 구하면 약 <b>' + ESC_TRUE.toFixed(2) + ' m</b> 입니다.</p>';
        }
        if (escCheck) escCheck.addEventListener('click', escDoCheck);
        if (escInput) escInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); escDoCheck(); }
        });

        /* (3) 1번 활동의 몇 번과 비슷한가 */
        var eqChips = document.querySelectorAll('.eq-chip');
        var eqFb = document.getElementById('esc-quiz-fb');
        eqChips.forEach(function (c) {
            c.addEventListener('click', function () {
                var pick = c.dataset.pick;
                eqChips.forEach(function (x) { x.classList.remove('right', 'wrong'); });
                document.querySelector('.eq-chip[data-pick="6"]').classList.add('right');
                if (pick !== '6') c.classList.add('wrong');
                if (eqFb) {
                    eqFb.classList.add('open');
                    eqFb.innerHTML = '<b>정답 : (6)번 도형</b>' +
                        '<p>두 문제 모두 <b>한 각의 크기</b>와 <b>한 변의 길이</b>만 주어졌습니다. ' +
                        ((pick === '4' || pick === '5')
                            ? '(4)·(5)도 조건의 모양은 같지만, 그 각이 30°·60°라서 정삼각형의 성질로 풀 수 있었습니다. 35°와 50°는 그럴 수 없습니다.</p>'
                            : '(2)·(3)처럼 변이 두 개 주어진 것도, (1)처럼 닮은 도형이 함께 주어진 것도 아닙니다.</p>') +
                        '<p>그래서 <b>축도를 그려 재는 방법</b>을 쓴 것입니다.</p>';
                }
            });
        });

        /* ===================================================
           3. 탈레스 — 비례식과 공통점 · 차이점 분류
           =================================================== */
        var thStick = document.getElementById('th-stick');
        var thPyr = document.getElementById('th-pyr');
        var thStickOut = document.getElementById('th-stick-out');
        var thPyrOut = document.getElementById('th-pyr-out');
        var thCalc = document.getElementById('th-calc');

        function drawThales() {
            if (!thStick || !thPyr) return;
            var sShadow = parseFloat(thStick.value);
            var pShadow = parseFloat(thPyr.value);
            var stick = 1;                                   /* 막대 길이 1 m */
            var h = pShadow * stick / sShadow;
            thStickOut.textContent = sShadow.toFixed(1);
            thPyrOut.textContent = pShadow.toFixed(0);
            if (thCalc) {
                thCalc.innerHTML =
                    '피라미드 높이 : ' + pShadow.toFixed(0) + ' = 1 : ' + sShadow.toFixed(1) + '<br>' +
                    '피라미드 높이 = ' + pShadow.toFixed(0) + ' × 1 ÷ ' + sShadow.toFixed(1) +
                    ' = <span class="res">약 ' + h.toFixed(1) + ' m</span>';
            }
        }
        if (thStick && thPyr) {
            thStick.addEventListener('input', drawThales);
            thPyr.addEventListener('input', drawThales);
            drawThales();
        }

        /* 공통점 / 차이점 분류 */
        var sortItems = document.querySelectorAll('.sort-item');
        var sortProgress = document.getElementById('sort-progress');
        var sortSummary = document.getElementById('sort-summary');
        var sortAllBtn = document.getElementById('sort-all');
        var sortResetBtn = document.getElementById('sort-reset');

        sortItems.forEach(function (item) {
            var text = item.textContent.trim();
            item.innerHTML = '';
            var span = document.createElement('span');
            span.className = 'txt';
            span.textContent = text;
            var wrap = document.createElement('span');
            wrap.className = 'sbtns';
            [['same', '공통점'], ['diff', '차이점']].forEach(function (pair) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'sbtn';
                b.dataset.kind = pair[0];
                b.textContent = pair[1];
                b.addEventListener('click', function () { sortOpen(item, pair[0]); });
                wrap.appendChild(b);
            });
            item.appendChild(span);
            item.appendChild(wrap);
        });

        function sortRefresh() {
            var n = 0;
            sortItems.forEach(function (i) { if (i.dataset.done === '1') n++; });
            if (sortProgress) sortProgress.innerHTML = '분류한 문장 : <b>' + n + '</b> / ' + sortItems.length;
            if (sortSummary) sortSummary.classList.toggle('open', n === sortItems.length);
        }
        function sortOpen(item, choice) {
            item.dataset.done = '1';
            var kind = item.dataset.kind;
            item.classList.add('done', kind);
            item.querySelectorAll('.sbtn').forEach(function (b) {
                b.disabled = true;
                b.classList.remove('right', 'wrong');
                if (b.dataset.kind === kind) b.classList.add('right');
                else if (choice && b.dataset.kind === choice) b.classList.add('wrong');
            });
            sortRefresh();
        }
        if (sortAllBtn) sortAllBtn.addEventListener('click', function () {
            sortItems.forEach(function (i) { sortOpen(i, null); });
        });
        if (sortResetBtn) sortResetBtn.addEventListener('click', function () {
            sortItems.forEach(function (i) {
                delete i.dataset.done;
                i.classList.remove('done', 'same', 'diff');
                i.querySelectorAll('.sbtn').forEach(function (b) {
                    b.disabled = false; b.classList.remove('right', 'wrong');
                });
            });
            sortRefresh();
        });
        sortRefresh();

        /* ===================================================
           4. 크기가 달라져도 비는 같을까요? (닮음 활동)
           =================================================== */
        var simSvg = document.getElementById('sim-svg');
        var simAngle = document.getElementById('sim-angle');
        var simSize = document.getElementById('sim-size');
        var simAngleOut = document.getElementById('sim-angle-out');
        var simSizeOut = document.getElementById('sim-size-out');
        var simBody = document.getElementById('sim-tbody');
        var simConc = document.getElementById('sim-conclusion');
        var simChips = document.querySelectorAll('#similar .sim-chip');

        var SIM = { S: 37, CMAX: 12, OX: 70, OY: 520, GHOST: [5, 10] };

        function drawSimilar() {
            if (!simSvg || !simAngle || !simSize) return;

            var deg = parseInt(simAngle.value, 10);
            var size = parseFloat(simSize.value);
            var rad = deg * Math.PI / 180;
            var sn = Math.sin(rad), cs = Math.cos(rad), tn = Math.tan(rad);

            var S = SIM.S, OX = SIM.OX, OY = SIM.OY, R = SIM.CMAX * S;

            simAngleOut.textContent = deg;
            simSizeOut.textContent = size.toFixed(1);
            while (simSvg.firstChild) simSvg.removeChild(simSvg.firstChild);

            /* 바닥선 + 반지름 12인 호 (꼭짓점 B가 지나는 자리) */
            simSvg.appendChild(el('line', { x1: OX - 25, y1: OY, x2: OX + R + 25, y2: OY, stroke: '#e2e8f0', 'stroke-width': 3 }));
            simSvg.appendChild(el('path', {
                d: 'M ' + (OX + R) + ' ' + OY + ' A ' + R + ' ' + R + ' 0 0 0 ' + OX + ' ' + (OY - R),
                fill: 'none', stroke: '#f1f5f9', 'stroke-width': 3
            }));

            /* --- 비교용(흐린) 삼각형 --- */
            SIM.GHOST.forEach(function (gc) {
                var bx = OX + gc * cs * S, by = OY - gc * sn * S;
                simSvg.appendChild(el('polygon', {
                    points: OX + ',' + OY + ' ' + bx + ',' + OY + ' ' + bx + ',' + by,
                    fill: 'rgba(148,163,184,0.07)', stroke: '#cbd5e1', 'stroke-width': 2.5, 'stroke-dasharray': '7 5'
                }));
                simSvg.appendChild(txt('c=' + gc, {
                    x: bx + 10, y: by + 6, 'font-size': 19, fill: '#94a3b8', 'font-weight': 'bold'
                }));
            });

            /* --- 지금 삼각형 --- */
            var CX = OX + size * cs * S;          /* 꼭짓점 C */
            var BY = OY - size * sn * S;          /* 꼭짓점 B의 높이 */
            simSvg.appendChild(el('polygon', {
                points: OX + ',' + OY + ' ' + CX + ',' + OY + ' ' + CX + ',' + BY,
                fill: 'rgba(37,99,235,0.06)', stroke: 'none'
            }));
            simSvg.appendChild(el('line', { x1: OX, y1: OY, x2: CX, y2: OY, stroke: COLOR.cos, 'stroke-width': 7, 'stroke-linecap': 'round' }));
            simSvg.appendChild(el('line', { x1: CX, y1: OY, x2: CX, y2: BY, stroke: COLOR.sin, 'stroke-width': 7, 'stroke-linecap': 'round' }));
            simSvg.appendChild(el('line', { x1: CX, y1: BY, x2: OX, y2: OY, stroke: COLOR.ray, 'stroke-width': 7, 'stroke-linecap': 'round' }));

            /* 직각 표시 */
            var m = 16;
            simSvg.appendChild(el('path', {
                d: 'M ' + (CX - m) + ' ' + OY + ' L ' + (CX - m) + ' ' + (OY - m) + ' L ' + CX + ' ' + (OY - m),
                fill: 'none', stroke: COLOR.ray, 'stroke-width': 2.5
            }));

            /* 각 A — 삼각형이 좁을 때는 각도 숫자를 생략합니다(조절판에 크게 나옵니다) */
            var basePx = size * cs * S;
            var ar = Math.max(24, Math.min(46, basePx * 0.45));
            simSvg.appendChild(el('path', {
                d: 'M ' + (OX + ar) + ' ' + OY + ' A ' + ar + ' ' + ar + ' 0 0 0 ' +
                   (OX + ar * cs) + ' ' + (OY - ar * sn),
                fill: 'none', stroke: COLOR.ink, 'stroke-width': 3
            }));
            if (basePx > 130) {
                simSvg.appendChild(txt(deg + '°', {
                    x: OX + (ar + 34) * Math.cos(rad / 2), y: OY - (ar + 34) * Math.sin(rad / 2) + 7,
                    'font-size': 22, 'font-weight': 'bold', fill: COLOR.ink, 'text-anchor': 'middle'
                }));
            }

            /* 꼭짓점 이름 */
            simSvg.appendChild(txt('A', { x: OX - 22, y: OY + 8, 'font-size': 22, 'font-weight': 'bold', fill: COLOR.ink }));
            simSvg.appendChild(txt('C', { x: CX + 6, y: OY + 28, 'font-size': 22, 'font-weight': 'bold', fill: COLOR.ink }));
            simSvg.appendChild(txt('B', { x: CX + 6, y: BY - 12, 'font-size': 22, 'font-weight': 'bold', fill: COLOR.ink }));
            simSvg.appendChild(el('circle', { cx: CX, cy: BY, r: 6, fill: COLOR.ray }));

            /* 변의 길이 */
            var a = size * sn, bb = size * cs;
            simSvg.appendChild(txt('b = ' + bb.toFixed(2), {
                x: Math.max((OX + CX) / 2, OX + 50), y: OY + 60, 'font-size': 21, 'font-weight': 'bold',
                fill: COLOR.cos, 'text-anchor': 'middle'
            }));
            simSvg.appendChild(txt('a = ' + a.toFixed(2), {
                x: CX + 34, y: (OY + BY) / 2 + 7, 'font-size': 21, 'font-weight': 'bold', fill: COLOR.sin
            }));
            /* 빗변 라벨은 빗변에 수직인 방향으로 살짝 띄웁니다 */
            var hx = (OX + CX) / 2 - 22 * sn, hy = (OY + BY) / 2 - 22 * cs;
            simSvg.appendChild(txt('c = ' + size.toFixed(2), {
                x: hx, y: hy, 'font-size': 21, 'font-weight': 'bold',
                fill: COLOR.ray, 'text-anchor': 'middle',
                transform: 'rotate(' + (-deg) + ', ' + hx + ', ' + hy + ')'
            }));

            /* --- 표 --- */
            var rowsDef = [
                { name: '작은 삼각형', c: SIM.GHOST[0], cur: false },
                { name: '지금 삼각형', c: size, cur: true },
                { name: '큰 삼각형', c: SIM.GHOST[1], cur: false }
            ];
            simBody.innerHTML = '';
            rowsDef.forEach(function (r) {
                var tr = document.createElement('tr');
                if (r.cur) tr.className = 'current';
                var th = document.createElement('th');
                th.scope = 'row';
                th.textContent = r.name;
                tr.appendChild(th);
                [ (r.c * sn).toFixed(2), (r.c * cs).toFixed(2), r.c.toFixed(2) ].forEach(function (v) {
                    var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
                });
                /* 비는 각 A만으로 정해지므로 세 줄이 모두 같은 값이 됩니다 */
                [['rsin', sn], ['rcos', cs], ['rtan', tn]].forEach(function (pair) {
                    var td = document.createElement('td');
                    td.className = 'ratio ' + pair[0];
                    td.textContent = pair[1].toFixed(4);
                    tr.appendChild(td);
                });
                simBody.appendChild(tr);
            });

            if (simConc) {
                simConc.innerHTML = '✅ 세 변의 길이는 모두 다르지만, 각 A = ' + deg + '°인 한 ' +
                    '<b>a÷c, b÷c, a÷b 의 값은 세 삼각형이 똑같습니다.</b>';
            }

            simChips.forEach(function (ch) {
                ch.classList.toggle('active', parseInt(ch.dataset.angle, 10) === deg);
            });
        }

        if (simAngle && simSize) {
            simAngle.addEventListener('input', drawSimilar);
            simSize.addEventListener('input', drawSimilar);
            simChips.forEach(function (ch) {
                ch.addEventListener('click', function () {
                    simAngle.value = ch.dataset.angle;
                    drawSimilar();
                });
            });
            drawSimilar();
        }

        /* ===================================================
           5. 특수각 표 — 눌러서 값 확인
           =================================================== */
        var specialCells = document.querySelectorAll('.special-table td');
        specialCells.forEach(function (cell) {
            function toggle() { cell.classList.toggle('show'); }
            cell.addEventListener('click', toggle);
            cell.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });
        var revealAll = document.getElementById('reveal-all');
        var hideAll = document.getElementById('hide-all');
        if (revealAll) revealAll.addEventListener('click', function () {
            specialCells.forEach(function (c) { c.classList.add('show'); });
        });
        if (hideAll) hideAll.addEventListener('click', function () {
            specialCells.forEach(function (c) { c.classList.remove('show'); });
        });

        /* ===================================================
           6. 사분원 시각화
           =================================================== */
        var svg = document.getElementById('trig-svg');
        var range = document.getElementById('trend-range');
        var angleOut = document.getElementById('current-angle');
        var outSin = document.getElementById('trend-sin');
        var outCos = document.getElementById('trend-cos');
        var outTan = document.getElementById('trend-tan');
        var zoomNote = document.getElementById('zoom-note');
        var chips = document.querySelectorAll('#trends .chip[data-angle]');
        var trendItems = document.querySelectorAll('.trend-item');

        var U = 400;                                    /* 1에 해당하는 SVG 길이 */
        var PAD_L = 0.42, PAD_R = 1.85, PAD_B = 0.42, PAD_T = 0.30;
        var BASE_H = (1.5 + PAD_T + PAD_B) * U;         /* 기본 배율일 때의 높이 */

        /* 값 패널 ↔ 그림 라벨을 같은 상태로 묶습니다 */
        trendItems.forEach(function (item) {
            var key = item.classList.contains('t-sin') ? 'sin'
                    : item.classList.contains('t-cos') ? 'cos' : 'tan';
            function toggle() { reveal[key] = !reveal[key]; drawUnitCircle(); }
            item.addEventListener('click', toggle);
            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });

        function pickYMax(t, deg) {
            if (deg >= 90) return 1.5;
            if (t <= 1.35) return 1.5;
            if (t <= 1.85) return 2;
            return 3;
        }

        function drawUnitCircle() {
            if (!svg || !range) return;

            var deg = parseInt(range.value, 10) || 0;
            var rad = deg * Math.PI / 180;
            var s = Math.sin(rad);
            var c = Math.cos(rad);
            var undefinedTan = (deg === 90);
            var t = undefinedTan ? Infinity : Math.tan(rad);

            /* --- 화면(뷰박스) 계산: tan이 커지면 자동으로 축소 --- */
            var yMax = pickYMax(t, deg);
            var yTop = yMax + PAD_T;
            var vbW = (PAD_L + PAD_R) * U;
            var vbH = (yTop + PAD_B) * U;
            var ox = PAD_L * U;
            var oy = yTop * U;
            var f = vbH / BASE_H;                        /* 글자가 화면에서 같은 크기로 보이도록 */
            var FS_TICK = Math.round(30 * f);
            var FS_LABEL = Math.round(40 * f);
            var overflow = !undefinedTan && t > yTop - 0.05;

            var X = function (v) { return ox + v * U; };
            var Y = function (v) { return oy - v * U; };

            svg.setAttribute('viewBox', '0 0 ' + vbW + ' ' + vbH);
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            /* 화살표 촉 (tan이 화면을 넘어갈 때) */
            var defs = el('defs', {});
            var mk = el('marker', {
                id: 'arrow-tan', viewBox: '0 0 10 10', refX: '6', refY: '5',
                markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse'
            });
            mk.appendChild(el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: COLOR.tan }));
            defs.appendChild(mk);
            svg.appendChild(defs);

            /* --- 좌표축 --- */
            svg.appendChild(el('line', { x1: X(-PAD_L + 0.06), y1: Y(0), x2: X(PAD_R - 0.02), y2: Y(0), stroke: COLOR.axis, 'stroke-width': 3 }));
            svg.appendChild(el('line', { x1: X(0), y1: Y(-PAD_B + 0.06), x2: X(0), y2: Y(yTop - 0.02), stroke: COLOR.axis, 'stroke-width': 3 }));

            /* 눈금 (가로) — 숫자는 축 아래에 */
            [0.5, 1, 1.5].forEach(function (v) {
                if (v > PAD_R - 0.1) return;
                svg.appendChild(el('line', { x1: X(v), y1: Y(0) - 8, x2: X(v), y2: Y(0) + 8, stroke: COLOR.axis, 'stroke-width': 2 }));
                svg.appendChild(txt(String(v), { x: X(v), y: Y(0) + 0.115 * U, 'font-size': FS_TICK, 'text-anchor': 'middle', fill: '#64748b' }));
            });
            svg.appendChild(txt('0', { x: X(0) - 0.055 * U, y: Y(0) + 0.115 * U, 'font-size': FS_TICK, 'text-anchor': 'middle', fill: '#64748b' }));

            /* 눈금 (세로) — 숫자는 축 왼쪽에 */
            for (var v = 0.5; v <= yMax + 0.001; v += 0.5) {
                var vv = Math.round(v * 10) / 10;
                svg.appendChild(el('line', { x1: X(0) - 8, y1: Y(vv), x2: X(0) + 8, y2: Y(vv), stroke: COLOR.axis, 'stroke-width': 2 }));
                svg.appendChild(txt(String(vv), { x: X(0) - 0.055 * U, y: Y(vv) + FS_TICK * 0.35, 'font-size': FS_TICK, 'text-anchor': 'end', fill: '#64748b' }));
            }

            /* 반지름 1인 사분원 */
            svg.appendChild(el('path', {
                d: 'M ' + X(1) + ' ' + Y(0) + ' A ' + U + ' ' + U + ' 0 0 0 ' + X(0) + ' ' + Y(1),
                fill: 'none', stroke: '#cbd5e1', 'stroke-width': 4
            }));

            /* x = 1 인 직선 (tan을 재는 자리) */
            svg.appendChild(el('line', {
                x1: X(1), y1: Y(0), x2: X(1), y2: Y(yTop - 0.02),
                stroke: '#fca5a5', 'stroke-width': 3, 'stroke-dasharray': '10 8'
            }));

            /* --- 빗변(반지름의 연장선) : 항상 화면 끝까지 그려 tan과 만나는 것을 보여줍니다 --- */
            var sX = c > 1e-9 ? (PAD_R - 0.05) / c : Infinity;
            var sY = s > 1e-9 ? (yTop - 0.03) / s : Infinity;
            var k = Math.min(sX, sY);
            if (!isFinite(k)) k = 1;
            svg.appendChild(el('line', {
                x1: X(0), y1: Y(0), x2: X(c * k), y2: Y(s * k),
                stroke: COLOR.ray, 'stroke-width': 5
            }));

            /* --- 세 선분 --- */
            svg.appendChild(el('line', { x1: X(0), y1: Y(0), x2: X(c), y2: Y(0), stroke: COLOR.cos, 'stroke-width': 15, 'stroke-linecap': 'butt' }));
            svg.appendChild(el('line', { x1: X(c), y1: Y(0), x2: X(c), y2: Y(s), stroke: COLOR.sin, 'stroke-width': 15, 'stroke-linecap': 'butt' }));
            if (!undefinedTan) {
                var tTop = Math.min(t, yTop - 0.03);
                var tanLine = el('line', { x1: X(1), y1: Y(0), x2: X(1), y2: Y(tTop), stroke: COLOR.tan, 'stroke-width': 15, 'stroke-linecap': 'butt' });
                if (overflow) tanLine.setAttribute('marker-end', 'url(#arrow-tan)');
                svg.appendChild(tanLine);
            }

            /* 빗변을 세 선분 위에 한 번 더 얇게 → 0°, 90°에서도 보이도록 */
            svg.appendChild(el('line', {
                x1: X(0), y1: Y(0), x2: X(c * k), y2: Y(s * k),
                stroke: COLOR.ray, 'stroke-width': 4
            }));

            /* 사분원 위의 점 */
            svg.appendChild(el('circle', { cx: X(c), cy: Y(s), r: 0.03 * U, fill: COLOR.ray }));

            /* --- 각 A --- */
            var arcR = 0.19;
            if (deg > 0) {
                svg.appendChild(el('path', {
                    d: 'M ' + X(arcR) + ' ' + Y(0) + ' A ' + (arcR * U) + ' ' + (arcR * U) + ' 0 0 0 ' +
                       X(arcR * c) + ' ' + Y(arcR * s),
                    fill: 'none', stroke: COLOR.ink, 'stroke-width': 3
                }));
            }
            var midR = rad / 2, lr = 0.30;
            svg.appendChild(txt('A', {
                x: X(lr * Math.cos(midR)), y: Y(Math.max(lr * Math.sin(midR), 0.08)) + FS_LABEL * 0.35,
                'font-size': FS_LABEL, 'font-weight': 'bold', fill: COLOR.ink, 'text-anchor': 'middle'
            }));

            /* --- 눌러서 확인하는 라벨 --- */
            function addLabel(key, label, x, y, anchor) {
                var node = txt(reveal[key] ? label : '?', {
                    x: x, y: y, 'font-size': FS_LABEL, 'font-weight': 'bold',
                    'text-anchor': anchor || 'start',
                    fill: reveal[key] ? COLOR[key] : '#94a3b8',
                    cursor: 'pointer'
                });
                node.addEventListener('click', function () { reveal[key] = !reveal[key]; drawUnitCircle(); });
                svg.appendChild(node);
            }

            /* cos : 가로축 아래쪽 (눈금 숫자보다 더 아래) */
            if (c > 0.05) addLabel('cos', 'cos A', X(Math.max(c / 2, 0.32)), Y(0) + 0.26 * U, 'middle');
            /* sin : 세로 선분 옆 (x=1 직선과 겹치지 않도록 좌우를 바꿔 놓습니다) */
            if (s > 0.05) {
                var sinLeft = c > 0.5;
                addLabel('sin', 'sin A',
                    X(c) + (sinLeft ? -0.05 : 0.06) * U,
                    Y(Math.max(s / 2, 0.16)) + FS_LABEL * 0.35,
                    sinLeft ? 'end' : 'start');
            }
            /* tan : x=1 직선 오른쪽 */
            if (!undefinedTan && t > 0.05) {
                var ty = overflow ? Y(yTop - 0.30) : Y(Math.max(Math.min(t, yTop) / 2, 0.16));
                addLabel('tan', 'tan A', X(1) + 0.07 * U, ty + FS_LABEL * 0.35, 'start');
            }

            /* 90°일 때 안내 */
            if (undefinedTan) {
                var warn = el('text', {
                    x: X(1) + 0.07 * U, y: Y(0.62), 'font-size': Math.round(FS_LABEL * 0.85),
                    'font-weight': 'bold', fill: COLOR.tan
                });
                var t1 = el('tspan', { x: X(1) + 0.07 * U, dy: '0' }); t1.textContent = 'tan 90°는';
                var t2 = el('tspan', { x: X(1) + 0.07 * U, dy: '1.25em' }); t2.textContent = '정할 수 없어요';
                warn.appendChild(t1); warn.appendChild(t2);
                svg.appendChild(warn);
            }

            /* --- 값 패널 --- */
            angleOut.textContent = deg;
            outSin.textContent = s.toFixed(4);
            outCos.textContent = Math.abs(c) < 1e-12 ? '0.0000' : c.toFixed(4);
            outTan.textContent = undefinedTan ? '정할 수 없다' : t.toFixed(4);

            trendItems.forEach(function (item) {
                var key = item.classList.contains('t-sin') ? 'sin'
                        : item.classList.contains('t-cos') ? 'cos' : 'tan';
                item.classList.toggle('show-val', reveal[key]);
            });

            /* --- 안내 문구 --- */
            if (zoomNote) {
                if (deg === 0) zoomNote.textContent = 'sin A와 tan A가 0이어서 선분이 보이지 않습니다.';
                else if (undefinedTan) zoomNote.textContent = 'cos A = 0, 그리고 빗변이 x = 1인 직선과 만나지 않습니다.';
                else if (overflow) zoomNote.textContent = 'tan A가 화면을 넘어설 만큼 커졌습니다.';
                else if (yMax > 1.5) zoomNote.textContent = 'tan A가 커져서 세로 눈금을 ' + yMax + '까지 넓혔습니다.';
                else zoomNote.textContent = '';
            }

            chips.forEach(function (ch) {
                ch.classList.toggle('active', parseInt(ch.dataset.angle, 10) === deg);
            });
        }

        if (range) {
            range.addEventListener('input', drawUnitCircle);
            chips.forEach(function (ch) {
                ch.addEventListener('click', function () {
                    range.value = ch.dataset.angle;
                    drawUnitCircle();
                });
            });
            drawUnitCircle();
            window.addEventListener('resize', drawUnitCircle);
        }

        /* ===================================================
           7. 삼각비의 표 (0°~90°) + 각도 찾기
           =================================================== */
        var tbody = document.getElementById('trig-table-body');
        var rows = {};
        if (tbody) {
            var frag = document.createDocumentFragment();
            for (var d = 0; d <= 90; d++) {
                var r = d * Math.PI / 180;
                var tr = document.createElement('tr');
                tr.dataset.deg = d;

                var tdA = document.createElement('td'); tdA.textContent = d + '°';
                var tdS = document.createElement('td'); tdS.textContent = Math.sin(r).toFixed(4);
                var tdC = document.createElement('td'); tdC.textContent = (d === 90 ? 0 : Math.cos(r)).toFixed(4);
                var tdT = document.createElement('td');
                if (d === 90) { tdT.textContent = '정할 수 없다'; tdT.className = 'undef'; }
                else { tdT.textContent = Math.tan(r).toFixed(4); }

                tr.appendChild(tdA); tr.appendChild(tdS); tr.appendChild(tdC); tr.appendChild(tdT);
                frag.appendChild(tr);
                rows[d] = tr;
            }
            tbody.appendChild(frag);
        }

        var angleInput = document.getElementById('angle');
        var calcBtn = document.getElementById('calc-btn');
        var errBox = document.getElementById('calc-err');
        var sinRes = document.getElementById('sin-res');
        var cosRes = document.getElementById('cos-res');
        var tanRes = document.getElementById('tan-res');
        var tableWrap = document.querySelector('.trig-table-wrapper');

        function showError(msg) {
            if (errBox) errBox.textContent = msg;
            if (sinRes) { sinRes.textContent = '–'; cosRes.textContent = '–'; tanRes.textContent = '–'; }
            document.querySelectorAll('.res-angle').forEach(function (e) { e.textContent = '–'; });
        }

        function lookup() {
            if (!angleInput) return;
            var raw = angleInput.value.trim();
            if (raw === '') { showError('각도를 입력해 주세요.'); return; }
            var deg = Number(raw);
            if (!isFinite(deg)) { showError('숫자만 입력할 수 있어요.'); return; }
            if (deg < 0 || deg > 90) { showError('0°부터 90°까지만 입력해 주세요.'); return; }

            deg = Math.round(deg);
            if (errBox) errBox.textContent = '';
            var r = deg * Math.PI / 180;

            sinRes.textContent = Math.sin(r).toFixed(4);
            cosRes.textContent = (deg === 90 ? 0 : Math.cos(r)).toFixed(4);
            tanRes.textContent = (deg === 90) ? '정할 수 없다' : Math.tan(r).toFixed(4);
            document.querySelectorAll('.res-angle').forEach(function (e) { e.textContent = deg; });

            Object.keys(rows).forEach(function (k) { rows[k].classList.remove('hit'); });
            var row = rows[deg];
            if (row && tableWrap) {
                row.classList.add('hit');
                tableWrap.scrollTop = row.offsetTop - tableWrap.clientHeight / 2 + row.clientHeight / 2;
            }
        }

        if (calcBtn) calcBtn.addEventListener('click', lookup);
        if (angleInput) angleInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); lookup(); }
        });

        /* ===================================================
           8. 활동 전환 — 메뉴를 누르면 그 활동만 보입니다
           =================================================== */
        var sections = document.querySelectorAll('main > section');
        var navBar = document.querySelector('.section-nav');
        var navLinks = document.querySelectorAll('.section-nav a');
        var mainEl = document.querySelector('main');

        /* 각 활동 아래에 이전 / 다음 버튼을 붙입니다 */
        var titles = [];
        sections.forEach(function (sec) {
            var h = sec.querySelector('h2');
            titles.push(h ? h.textContent.trim() : sec.id);
        });

        function shortTitle(t) {
            var i = t.indexOf('.');
            return i > -1 ? t.slice(i + 1).trim() : t;
        }

        sections.forEach(function (sec, i) {
            var foot = document.createElement('div');
            foot.className = 'section-foot';

            var prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'step-btn' + (i === 0 ? ' hidden' : '');
            prev.textContent = i === 0 ? '' : '← ' + shortTitle(titles[i - 1]);
            if (i > 0) prev.addEventListener('click', function () { goTo(sections[i - 1].id); });

            var badge = document.createElement('span');
            badge.className = 'step-badge';
            badge.textContent = (i + 1) + ' / ' + sections.length;

            var next = document.createElement('button');
            next.type = 'button';
            next.className = 'step-btn' + (i === sections.length - 1 ? ' hidden' : '');
            next.textContent = i === sections.length - 1 ? '' : shortTitle(titles[i + 1]) + ' →';
            if (i < sections.length - 1) next.addEventListener('click', function () { goTo(sections[i + 1].id); });

            foot.appendChild(prev);
            foot.appendChild(badge);
            foot.appendChild(next);
            sec.appendChild(foot);
        });

        function showSection(id, scroll) {
            var target = null;
            sections.forEach(function (sec) {
                var on = (sec.id === id);
                sec.classList.toggle('is-active', on);
                if (on) target = sec;
            });
            if (!target && sections.length) {
                target = sections[0];
                target.classList.add('is-active');
                id = target.id;
            }

            var current = null;
            navLinks.forEach(function (a) {
                var on = (a.getAttribute('href') === '#' + id);
                a.classList.toggle('current', on);
                if (on) current = a;
            });
            /* 모바일에서 선택한 메뉴가 보이도록 메뉴 줄을 옆으로 밀어 줍니다 */
            if (current && navBar) {
                navBar.scrollLeft = current.offsetLeft - navBar.clientWidth / 2 + current.clientWidth / 2;
            }

            /* 숨어 있던 그림을 다시 그립니다 */
            drawEsc();
            drawSimilar();
            drawUnitCircle();

            if (scroll && mainEl) {
                window.scrollTo({ top: Math.max(0, mainEl.offsetTop - 56), behavior: 'smooth' });
            }
        }

        function goTo(id) {
            if (('#' + id) === window.location.hash) showSection(id, true);
            else window.location.hash = id;      /* hashchange 가 showSection 을 부릅니다 */
        }

        navLinks.forEach(function (a) {
            a.addEventListener('click', function () {
                /* 같은 메뉴를 다시 눌러도 위로 올라가도록 */
                var id = a.getAttribute('href').slice(1);
                setTimeout(function () { showSection(id, true); }, 0);
            });
        });

        window.addEventListener('hashchange', function () {
            showSection(window.location.hash.slice(1), true);
        });

        showSection(window.location.hash.slice(1) || (sections[0] && sections[0].id), false);

        /* ===================================================
           9. 실생활 문제 - 풀이 보기
           =================================================== */
        document.querySelectorAll('.sol-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var box = btn.parentElement.querySelector('.solution');
                if (!box) return;
                var open = box.classList.toggle('open');
                btn.textContent = open ? '풀이 접기' : '풀이 보기';
            });
        });
    });
})();
