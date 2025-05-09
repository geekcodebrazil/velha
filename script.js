document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const modeSelectionDiv = document.getElementById('mode-selection');
    const pvpButton = document.getElementById('pvp-button');
    const pvaiButton = document.getElementById('pvai-button');
    const gameAreaDiv = document.getElementById('game-area');
    const boardDiv = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('status');
    const playerScoreDisplay = document.getElementById('player-score');
    const opponentScoreDisplay = document.getElementById('opponent-score');
    const drawScoreDisplay = document.getElementById('draw-score');
    const opponentLabel = document.getElementById('opponent-label');
    const restartButton = document.getElementById('restart-button');
    const changeModeButton = document.getElementById('change-mode-button');
    const resetScoreButton = document.getElementById('reset-score-button');

    // --- Constantes e Estado do Jogo ---
    const PLAYER_X = 'X';
    const PLAYER_O = 'O';
    const WINNING_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
        [0, 4, 8], [2, 4, 6]  // Diagonais
    ];

    let boardState = Array(9).fill(null);
    let currentPlayer = PLAYER_X;
    let gameActive = false;
    let gameMode = null; // 'PvP' ou 'PvAI'
    let scores = {
        player: 0,
        opponent: 0,
        draws: 0
    };

    // --- Funções Principais ---

    /** Carrega placares da sessionStorage */
    const loadScores = () => {
        const savedScores = sessionStorage.getItem('ticTacToeScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
        }
        updateScoreboard();
    };

    /** Salva placares na sessionStorage */
    const saveScores = () => {
        sessionStorage.setItem('ticTacToeScores', JSON.stringify(scores));
    };

    /** Atualiza a exibição do placar */
    const updateScoreboard = () => {
        playerScoreDisplay.textContent = scores.player;
        opponentScoreDisplay.textContent = scores.opponent;
        drawScoreDisplay.textContent = scores.draws;

        // Atualiza o rótulo do oponente baseado no modo
        if (gameMode === 'PvP') {
            opponentLabel.innerHTML = `Jogador 2 (O): <span id="opponent-score">${scores.opponent}</span>`;
        } else if (gameMode === 'PvAI') {
            opponentLabel.innerHTML = `Máquina (O): <span id="opponent-score">${scores.opponent}</span>`;
        } else {
             opponentLabel.innerHTML = `Oponente (O): <span id="opponent-score">${scores.opponent}</span>`; // Default
        }
    };

    /** Inicia o jogo com o modo selecionado */
    const startGame = (mode) => {
        gameMode = mode;
        gameActive = true;
        currentPlayer = PLAYER_X;
        boardState.fill(null);
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning-cell');
            cell.style.cursor = 'pointer'; // Garante cursor pointer ao iniciar/reiniciar
        });
        modeSelectionDiv.style.display = 'none';
        gameAreaDiv.style.display = 'block';
        statusDisplay.textContent = `É a vez do Jogador ${currentPlayer}`;
        statusDisplay.style.color = '#f1fa8c'; // Amarelo para status normal
        updateScoreboard(); // Atualiza label do oponente
    };

    /** Lida com o clique em uma célula */
    const handleCellClick = (event) => {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        // Verifica se a célula é clicável
        if (boardState[clickedCellIndex] !== null || !gameActive) {
            return;
        }

        // Processa a jogada
        makeMove(clickedCellIndex, currentPlayer);

        // Verifica o resultado após a jogada
        if (!checkResult()) {
            // Se o jogo não acabou, troca o jogador
            switchPlayer();
            // Se for modo PvAI e é a vez da IA
            if (gameMode === 'PvAI' && currentPlayer === PLAYER_O && gameActive) {
                 statusDisplay.textContent = 'Máquina está pensando...';
                 boardDiv.style.pointerEvents = 'none'; // Desabilita cliques enquanto IA pensa
                 // Adiciona um pequeno delay para parecer que a IA está "pensando"
                 setTimeout(() => {
                     aiMove();
                     boardDiv.style.pointerEvents = 'auto'; // Reabilita cliques
                 }, 500); // Meio segundo de delay
            }
        }
    };

    /** Executa uma jogada no tabuleiro (estado e UI) */
    const makeMove = (index, player) => {
        boardState[index] = player;
        const cell = cells[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase()); // Adiciona classe 'x' ou 'o'
        cell.style.cursor = 'not-allowed'; // Muda cursor para indicar célula preenchida
    }

    /** Troca o jogador atual */
    const switchPlayer = () => {
        currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
        let statusText = `É a vez do Jogador ${currentPlayer}`;
        if (gameMode === 'PvAI' && currentPlayer === PLAYER_O) {
            statusText = 'Vez da Máquina (O)';
        } else if (gameMode === 'PvP' && currentPlayer === PLAYER_O) {
            statusText = 'É a vez do Jogador 2 (O)';
        }
        statusDisplay.textContent = statusText;
    };

    /** Verifica se há um vencedor ou empate */
    const checkResult = () => {
        let roundWon = false;
        let winningCombination = null;

        for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
            const winCondition = WINNING_COMBINATIONS[i];
            const a = boardState[winCondition[0]];
            const b = boardState[winCondition[1]];
            const c = boardState[winCondition[2]];

            if (a === null || b === null || c === null) {
                continue; // Combinação ainda não completa
            }
            if (a === b && b === c) {
                roundWon = true;
                winningCombination = winCondition;
                break;
            }
        }

        // Se houve vencedor
        if (roundWon) {
            endGame(false, winningCombination);
            return true; // Jogo acabou
        }

        // Se não houve vencedor, verifica empate (tabuleiro cheio)
        if (!boardState.includes(null)) {
            endGame(true);
            return true; // Jogo acabou
        }

        // Jogo continua
        return false;
    };

    /** Finaliza o jogo */
    const endGame = (isDraw, winningCombination = null) => {
        gameActive = false;
        boardDiv.style.pointerEvents = 'none'; // Desabilita cliques no tabuleiro

        if (isDraw) {
            statusDisplay.textContent = 'Empate!';
            statusDisplay.style.color = '#8be9fd'; // Ciano Dracula para empate
            scores.draws++;
        } else {
            const winner = boardState[winningCombination[0]];
            statusDisplay.textContent = `Jogador ${winner} venceu!`;
            statusDisplay.style.color = (winner === PLAYER_X) ? '#50fa7b' : '#ff79c6'; // Verde ou Rosa
            highlightWinningCells(winningCombination);

            if (winner === PLAYER_X) {
                scores.player++;
            } else {
                scores.opponent++;
            }
        }
        updateScoreboard();
        saveScores();
         // Reabilita cliques após um pequeno delay para o jogador ver o resultado
        setTimeout(() => {
            if (!gameActive) boardDiv.style.pointerEvents = 'auto'; // Reabilita se não iniciou outro jogo
        }, 1500);
    };

    /** Destaca as células vencedoras */
    const highlightWinningCells = (combination) => {
        combination.forEach(index => {
            cells[index].classList.add('winning-cell');
        });
    };

    /** Reinicia o jogo atual (mantém modo e placar) */
    const restartGame = () => {
        if (!gameMode) return; // Não faz nada se nenhum modo foi selecionado
        gameActive = true;
        currentPlayer = PLAYER_X;
        boardState.fill(null);
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning-cell');
            cell.style.cursor = 'pointer';
        });
        statusDisplay.textContent = `É a vez do Jogador ${currentPlayer}`;
        statusDisplay.style.color = '#f1fa8c'; // Restaura cor normal
        boardDiv.style.pointerEvents = 'auto'; // Garante que cliques estão habilitados
    };

    /** Volta para a tela de seleção de modo */
    const changeGameMode = () => {
        gameActive = false;
        gameMode = null;
        gameAreaDiv.style.display = 'none';
        modeSelectionDiv.style.display = 'block';
        // Opcional: Resetar placar ao trocar de modo? Decidi manter.
        // resetScores();
    };

    /** Reseta o placar */
    const resetScores = () => {
        scores = { player: 0, opponent: 0, draws: 0 };
        updateScoreboard();
        saveScores(); // Salva o placar zerado
    };

    // --- Lógica da IA (Minimax) ---

    /** Função principal da IA para escolher a jogada */
    const aiMove = () => {
        if (!gameActive) return;

        // Usa Minimax para encontrar a melhor jogada para PLAYER_O
        const bestMove = findBestMove(boardState);

        if (bestMove.index !== undefined) {
            makeMove(bestMove.index, PLAYER_O);
            if (!checkResult()) {
                switchPlayer(); // Troca de volta para o jogador humano
            }
        }
         boardDiv.style.pointerEvents = 'auto'; // Reabilita cliques após jogada da IA
    };

    /** Encontra a melhor jogada usando Minimax */
    const findBestMove = (currentBoard) => {
        // IA é sempre PLAYER_O e quer maximizar sua pontuação
        return minimax(currentBoard, PLAYER_O);
    };

    /** Algoritmo Minimax */
    const minimax = (newBoard, player) => {
        const availableSpots = getEmptyIndices(newBoard);

        // --- Casos Base: Verifica fim de jogo ---
        if (checkWinner(newBoard, PLAYER_X)) {
            return { score: -10 }; // Jogador X (humano) venceu
        } else if (checkWinner(newBoard, PLAYER_O)) {
            return { score: 10 }; // Jogador O (IA) venceu
        } else if (availableSpots.length === 0) {
            return { score: 0 }; // Empate
        }

        // --- Recursão ---
        const moves = []; // Armazena as possíveis jogadas e seus scores

        // Itera sobre os espaços vazios
        for (let i = 0; i < availableSpots.length; i++) {
            const index = availableSpots[i];
            const move = {};
            move.index = index;

            // Faz a jogada hipotética
            newBoard[index] = player;

            // Chama minimax para o oponente
            if (player === PLAYER_O) { // Se a IA (O) jogou...
                const result = minimax(newBoard, PLAYER_X); // ...chama para o Humano (X)
                move.score = result.score;
            } else { // Se o Humano (X) jogou...
                const result = minimax(newBoard, PLAYER_O); // ...chama para a IA (O)
                move.score = result.score;
            }

            // Desfaz a jogada hipotética
            newBoard[index] = null;

            // Adiciona a jogada e seu score ao array
            moves.push(move);
        }

        // --- Escolhe a melhor jogada ---
        let bestMove;
        if (player === PLAYER_O) { // IA (Maximizador)
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = moves[i];
                }
            }
        } else { // Humano (Minimizador)
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = moves[i];
                }
            }
        }

        return bestMove; // Retorna o objeto { index: ..., score: ... } da melhor jogada
    };

    /** Retorna os índices das células vazias */
    const getEmptyIndices = (board) => {
        return board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    };

    /** Verifica se um jogador venceu no estado atual do tabuleiro (usado pelo Minimax) */
    const checkWinner = (board, player) => {
        for (const combination of WINNING_COMBINATIONS) {
            if (combination.every(index => board[index] === player)) {
                return true;
            }
        }
        return false;
    };


    // --- Event Listeners ---
    pvpButton.addEventListener('click', () => startGame('PvP'));
    pvaiButton.addEventListener('click', () => startGame('PvAI'));
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);
    changeModeButton.addEventListener('click', changeGameMode);
    resetScoreButton.addEventListener('click', resetScores);

    // --- Inicialização ---
    loadScores(); // Carrega placares ao iniciar

}); // Fim do DOMContentLoaded