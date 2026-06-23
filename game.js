/**
 * 매력 폭발! 가상 이상형 월드컵
 * Vanilla JS SPA
 */

(function () {
    'use strict';

    const app = document.getElementById('app');

    // === 게임 상태 ===
    let gameState = {
        gender: null,           // 'male' | 'female'
        candidates: [],         // 32명의 후보
        phase: 'intro',         // intro | group | tournament | thirdPlace | final | result
        // 조별리그
        groups: [],             // 8개 조 (각 4명)
        currentGroup: 0,
        selectedInGroup: [],    // 현재 조에서 선택된 인덱스
        groupWinners: [],       // 조별리그 통과자 16명
        // 토너먼트
        tournamentRound: 16,    // 16, 8, 4
        currentMatch: 0,
        matchPairs: [],         // 현재 라운드 매치 배열
        roundWinners: [],       // 현재 라운드 승자
        roundLosers: [],        // 현재 라운드 패자
        // 4강 결과 추적
        semiFinalLosers: [],    // 4강 패자 2명 (3·4위전)
        // 최종 결과
        finalRanking: [],       // [1위, 2위, 3위, 4위]
    };

    // === 이미지 경로 (로컬 파일 - 즉시 로드) ===
    function getImageUrl(char) {
        return char.img;
    }

    // === 유틸: 배열 셔플 ===
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // === 파티클 효과 ===
    function createParticles(x, y) {
        const container = document.createElement('div');
        container.className = 'particles-container';
        document.body.appendChild(container);

        const colors = ['#f093fb', '#f5576c', '#ffd700', '#4ecdc4', '#667eea'];
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = 6 + Math.random() * 10;
            const angle = (Math.PI * 2 * i) / 12;
            const dist = 40 + Math.random() * 60;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            container.appendChild(p);
        }

        setTimeout(() => container.remove(), 1200);
    }

    // === 색종이 효과 ===
    function createConfetti(parent) {
        const colors = ['#f093fb', '#f5576c', '#ffd700', '#4ecdc4', '#667eea', '#ff6b6b', '#7c5cfc'];
        for (let i = 0; i < 60; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + '%';
            c.style.top = '-10px';
            c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = Math.random() * 2 + 's';
            c.style.animationDuration = (2 + Math.random() * 2) + 's';
            const size = 6 + Math.random() * 10;
            c.style.width = size + 'px';
            c.style.height = size + 'px';
            c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            parent.appendChild(c);
        }
    }

    // ========================
    // 렌더링 함수들
    // ========================

    // === 인트로 화면 ===
    function renderIntro() {
        app.innerHTML = `
            <div class="intro-screen">
                <h1 class="intro-title">💘 매력 폭발!<br>가상 이상형 월드컵</h1>
                <p class="intro-subtitle">32명 중 당신의 최종 이상형은 누구?</p>
                <div class="intro-buttons">
                    <button class="btn-start male" id="btn-male">🤵 남자편 시작하기</button>
                    <button class="btn-start female" id="btn-female">👗 여자편 시작하기</button>
                </div>
            </div>
        `;

        document.getElementById('btn-male').addEventListener('click', () => startGame('male'));
        document.getElementById('btn-female').addEventListener('click', () => startGame('female'));
    }

    // === 게임 시작 ===
    function startGame(gender) {
        gameState.gender = gender;
        gameState.candidates = shuffle([...CHARACTERS[gender]]);
        gameState.phase = 'group';
        gameState.currentGroup = 0;
        gameState.selectedInGroup = [];
        gameState.groupWinners = [];
        gameState.semiFinalLosers = [];
        gameState.finalRanking = [];

        // 4명씩 8개 조로 나누기
        gameState.groups = [];
        for (let i = 0; i < 8; i++) {
            gameState.groups.push(gameState.candidates.slice(i * 4, i * 4 + 4));
        }

        renderGroupStage();
    }

    // === 32강 조별리그 렌더링 ===
    function renderGroupStage() {
        const group = gameState.groups[gameState.currentGroup];
        const groupNum = gameState.currentGroup + 1;
        const progress = (gameState.currentGroup / 8) * 100;

        app.innerHTML = `
            <div class="game-screen">
                <div class="round-header">
                    <div class="round-title">🏆 32강 - 조별리그</div>
                    <div class="round-progress">${groupNum}조 / 8조</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="group-stage">
                    <p class="group-instruction">4명 중 마음에 드는 <strong>2명</strong>을 선택하세요</p>
                    <div class="group-grid" id="group-grid"></div>
                    <button class="btn-next" id="btn-group-next">다음 조로 이동 →</button>
                </div>
            </div>
        `;

        const grid = document.getElementById('group-grid');
        group.forEach((char, idx) => {
            const card = document.createElement('div');
            card.className = 'group-card';
            card.dataset.idx = idx;
            const imgUrl = getImageUrl(char);

            const loader = document.createElement('div');
            loader.className = 'img-loading';
            loader.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = char.name;
            img.loading = 'eager';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center 20%;';
            img.onload = function() { loader.style.display = 'none'; };

            const nameDiv = document.createElement('div');
            nameDiv.className = 'card-name';
            nameDiv.textContent = char.name;

            const checkDiv = document.createElement('div');
            checkDiv.className = 'check-mark';
            checkDiv.textContent = '✓';

            card.appendChild(loader);
            card.appendChild(img);
            card.appendChild(nameDiv);
            card.appendChild(checkDiv);
            card.addEventListener('click', (e) => handleGroupSelect(idx, e));
            grid.appendChild(card);
        });

        document.getElementById('btn-group-next').addEventListener('click', handleGroupNext);
    }

    // === 조별리그 선택 핸들러 ===
    function handleGroupSelect(idx, e) {
        const selected = gameState.selectedInGroup;
        const cardEl = e.currentTarget;

        if (selected.includes(idx)) {
            // 선택 해제
            gameState.selectedInGroup = selected.filter(i => i !== idx);
            cardEl.classList.remove('selected');
        } else {
            if (selected.length >= 2) return; // 최대 2명
            gameState.selectedInGroup.push(idx);
            cardEl.classList.add('selected');
            createParticles(e.clientX, e.clientY);
        }

        // 버튼 활성화
        const btn = document.getElementById('btn-group-next');
        if (gameState.selectedInGroup.length === 2) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    // === 조별리그 다음 조 ===
    function handleGroupNext() {
        if (gameState.selectedInGroup.length !== 2) return;

        const group = gameState.groups[gameState.currentGroup];
        gameState.selectedInGroup.forEach(idx => {
            gameState.groupWinners.push(group[idx]);
        });

        gameState.selectedInGroup = [];
        gameState.currentGroup++;

        if (gameState.currentGroup >= 8) {
            // 조별리그 종료 → 16강 토너먼트
            startTournament(16, gameState.groupWinners);
        } else {
            renderGroupStage();
        }
    }

    // === 토너먼트 시작 ===
    function startTournament(round, players) {
        gameState.phase = 'tournament';
        gameState.tournamentRound = round;
        gameState.currentMatch = 0;
        gameState.roundWinners = [];
        gameState.roundLosers = [];

        // 랜덤 매칭
        const shuffled = shuffle(players);
        gameState.matchPairs = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            gameState.matchPairs.push([shuffled[i], shuffled[i + 1]]);
        }

        renderTournamentMatch();
    }

    // === 토너먼트 매치 렌더링 ===
    function renderTournamentMatch() {
        const pair = gameState.matchPairs[gameState.currentMatch];
        const round = gameState.tournamentRound;
        const matchNum = gameState.currentMatch + 1;
        const totalMatches = gameState.matchPairs.length;
        const progress = (gameState.currentMatch / totalMatches) * 100;

        let roundName = '';
        if (gameState.phase === 'thirdPlace') {
            roundName = '🥉 3·4위전';
        } else if (gameState.phase === 'final') {
            roundName = '👑 결승전';
        } else {
            roundName = `⚔️ ${round}강`;
        }

        const imgUrl0 = getImageUrl(pair[0]);
        const imgUrl1 = getImageUrl(pair[1]);

        app.innerHTML = `
            <div class="game-screen">
                <div class="round-header">
                    <div class="round-title">${roundName}</div>
                    ${gameState.phase === 'tournament' ? `
                        <div class="round-progress">${matchNum} / ${totalMatches}</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                </div>
                <div class="vs-stage">
                    <div class="vs-container">
                        <div class="vs-card" id="vs-left" data-side="0">
                            <div class="img-loading" style="width:100%;height:100%;position:absolute;top:0;left:0;"></div>
                            <img id="img-left" alt="${pair[0].name}" loading="eager" style="width:100%;height:100%;object-fit:cover;object-position:center 20%;">
                            <div class="card-name">${pair[0].name}</div>
                        </div>
                        <div class="vs-badge">VS</div>
                        <div class="vs-card" id="vs-right" data-side="1">
                            <div class="img-loading" style="width:100%;height:100%;position:absolute;top:0;left:0;"></div>
                            <img id="img-right" alt="${pair[1].name}" loading="eager" style="width:100%;height:100%;object-fit:cover;object-position:center 20%;">
                            <div class="card-name">${pair[1].name}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 이미지 로딩 핸들링
        const imgLeft = document.getElementById('img-left');
        const imgRight = document.getElementById('img-right');
        imgLeft.onload = function() { this.previousElementSibling.style.display = 'none'; };
        imgLeft.src = imgUrl0;

        imgRight.onload = function() { this.previousElementSibling.style.display = 'none'; };
        imgRight.src = imgUrl1;

        document.getElementById('vs-left').addEventListener('click', (e) => handleVsSelect(0, e));
        document.getElementById('vs-right').addEventListener('click', (e) => handleVsSelect(1, e));
    }

    // === VS 선택 핸들러 ===
    function handleVsSelect(side, e) {
        const pair = gameState.matchPairs[gameState.currentMatch];
        const winner = pair[side];
        const loser = pair[1 - side];

        // 파티클
        createParticles(e.clientX, e.clientY);

        // 승/패 애니메이션
        const winCard = document.getElementById(side === 0 ? 'vs-left' : 'vs-right');
        const loseCard = document.getElementById(side === 0 ? 'vs-right' : 'vs-left');
        winCard.classList.add('winner');
        loseCard.classList.add('loser');

        // 클릭 비활성화
        winCard.style.pointerEvents = 'none';
        loseCard.style.pointerEvents = 'none';

        setTimeout(() => {
            if (gameState.phase === 'thirdPlace') {
                // 3·4위전 결과
                gameState.finalRanking[2] = winner;  // 3위
                gameState.finalRanking[3] = loser;   // 4위
                // 결승전으로
                startFinal();
            } else if (gameState.phase === 'final') {
                // 결승전 결과
                gameState.finalRanking[0] = winner;  // 1위
                gameState.finalRanking[1] = loser;   // 2위
                renderResult();
            } else {
                // 일반 토너먼트
                gameState.roundWinners.push(winner);
                gameState.roundLosers.push(loser);
                gameState.currentMatch++;

                if (gameState.currentMatch >= gameState.matchPairs.length) {
                    // 라운드 종료
                    advanceRound();
                } else {
                    renderTournamentMatch();
                }
            }
        }, 800);
    }

    // === 라운드 진행 ===
    function advanceRound() {
        const round = gameState.tournamentRound;

        if (round === 4) {
            // 4강 종료 → 3·4위전 필요
            gameState.semiFinalLosers = [...gameState.roundLosers]; // 패자 2명
            const finalists = [...gameState.roundWinners]; // 승자 2명 → 결승

            // 3·4위전 먼저
            startThirdPlace(gameState.semiFinalLosers, finalists);
        } else {
            // 다음 라운드
            const nextRound = round / 2;
            startTournament(nextRound, gameState.roundWinners);
        }
    }

    // === 3·4위전 ===
    function startThirdPlace(losers, finalists) {
        gameState.phase = 'thirdPlace';
        gameState.matchPairs = [[losers[0], losers[1]]];
        gameState.currentMatch = 0;
        gameState._finalists = finalists; // 결승 진출자 저장
        renderTournamentMatch();
    }

    // === 결승전 ===
    function startFinal() {
        gameState.phase = 'final';
        gameState.matchPairs = [[gameState._finalists[0], gameState._finalists[1]]];
        gameState.currentMatch = 0;
        renderTournamentMatch();
    }

    // === 결과 화면 ===
    function renderResult() {
        gameState.phase = 'result';
        const ranking = gameState.finalRanking;

        app.innerHTML = `
            <div class="result-screen" id="result-screen">
                <h1 class="result-title">🏆 나의 이상형 TOP 4</h1>
                <p class="result-subtitle">당신이 선택한 최종 이상형입니다!</p>
                <div class="podium-container">
                    <div class="podium-item rank-2">
                        <img class="podium-img" src="${getImageUrl(ranking[1])}" alt="${ranking[1].name}">
                        <div class="podium-name">${ranking[1].name}</div>
                        <div class="podium-rank">2위 🥈</div>
                        <div class="podium-stand">2</div>
                    </div>
                    <div class="podium-item rank-1">
                        <img class="podium-img" src="${getImageUrl(ranking[0])}" alt="${ranking[0].name}">
                        <div class="podium-name">${ranking[0].name}</div>
                        <div class="podium-rank">1위 👑</div>
                        <div class="podium-stand">1</div>
                    </div>
                    <div class="podium-item rank-3">
                        <img class="podium-img" src="${getImageUrl(ranking[2])}" alt="${ranking[2].name}">
                        <div class="podium-name">${ranking[2].name}</div>
                        <div class="podium-rank">3위 🥉</div>
                        <div class="podium-stand">3</div>
                    </div>
                    <div class="podium-item rank-4">
                        <img class="podium-img" src="${getImageUrl(ranking[3])}" alt="${ranking[3].name}">
                        <div class="podium-name">${ranking[3].name}</div>
                        <div class="podium-rank">4위</div>
                        <div class="podium-stand">4</div>
                    </div>
                </div>
                <div class="result-buttons">
                    <button class="btn-result share" id="btn-kakao">💬 카카오톡 공유</button>
                    <button class="btn-result retry" id="btn-copy">📋 결과 복사하기</button>
                    <button class="btn-result retry" id="btn-retry">🔄 다시 하기</button>
                </div>
            </div>
        `;

        // 색종이 효과
        setTimeout(() => {
            createConfetti(document.getElementById('result-screen'));
        }, 300);

        document.getElementById('btn-retry').addEventListener('click', () => {
            gameState.phase = 'intro';
            renderIntro();
        });

        document.getElementById('btn-kakao').addEventListener('click', handleKakaoShare);
        document.getElementById('btn-copy').addEventListener('click', handleCopyResult);
    }

    // === 카카오톡 공유 ===
    function handleKakaoShare() {
        const ranking = gameState.finalRanking;
        const genderLabel = gameState.gender === 'male' ? '남자편' : '여자편';
        const text = `💘 이상형 월드컵 결과 (${genderLabel})%0A🥇 1위: ${ranking[0].name}%0A🥈 2위: ${ranking[1].name}%0A🥉 3위: ${ranking[2].name}%0A4위: ${ranking[3].name}%0A%0A나도 해보고 싶다면 파일 달라고 해!`;
        // 카카오톡 공유 - 모바일에서 카카오톡 앱으로 텍스트 전송
        const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=&text=${text}`;
        window.open(kakaoUrl, '_blank');
    }

    // === 결과 복사 ===
    function handleCopyResult() {
        const ranking = gameState.finalRanking;
        const genderLabel = gameState.gender === 'male' ? '남자편' : '여자편';
        const text = `💘 이상형 월드컵 결과 (${genderLabel})\n🥇 1위: ${ranking[0].name}\n🥈 2위: ${ranking[1].name}\n🥉 3위: ${ranking[2].name}\n4위: ${ranking[3].name}\n\n나도 해보고 싶다면 파일 달라고 해!`;

        // execCommand fallback (file:// 환경에서도 동작)
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            const btn = document.getElementById('btn-copy');
            btn.textContent = '✅ 복사 완료!';
            btn.style.background = 'linear-gradient(135deg, #00b894, #4ecdc4)';
            setTimeout(() => {
                btn.textContent = '📋 결과 복사하기';
                btn.style.background = '';
            }, 2500);
        } catch (e) {
            prompt('아래 텍스트를 복사하세요:', text);
        }
        document.body.removeChild(textarea);
    }

    // === 앱 시작 ===
    renderIntro();

})();
