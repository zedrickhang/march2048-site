// Sudoku Game Logic
class SudokuGame {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.given = Array(9).fill().map(() => Array(9).fill(false));
        this.selectedCell = null;
        this.selectedNumber = null;
        this.notesMode = false;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'easy';
        this.moveHistory = [];
        
        this.difficulties = {
            easy: 45,
            medium: 35,
            hard: 25,
            expert: 17
        };
    }

    init() {
        this.createGrid();
        this.newGame();
        this.setupEventListeners();
        this.startTimer();
    }

    createGrid() {
        const grid = document.getElementById('sudoku-grid');
        grid.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.selectCell(i));
            grid.appendChild(cell);
        }
    }

    newGame() {
        this.resetGame();
        this.generatePuzzle();
        this.updateDisplay();
        this.startTimer();
    }

    resetGame() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.given = Array(9).fill().map(() => Array(9).fill(false));
        this.selectedCell = null;
        this.selectedNumber = null;
        this.mistakes = 0;
        this.timer = 0;
        this.moveHistory = [];
        this.updateGameInfo();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    generatePuzzle() {
        // Generate a complete valid Sudoku solution
        this.generateCompleteSolution();
        
        // Copy solution to grid
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.grid[i][j] = this.solution[i][j];
            }
        }
        
        // Remove numbers based on difficulty
        const cellsToRemove = 81 - this.difficulties[this.difficulty];
        const cellsToRemoveList = [];
        
        // Create list of all cells
        for (let i = 0; i < 81; i++) {
            cellsToRemoveList.push(i);
        }
        
        // Shuffle and remove cells
        this.shuffleArray(cellsToRemoveList);
        
        for (let i = 0; i < cellsToRemove; i++) {
            const index = cellsToRemoveList[i];
            const row = Math.floor(index / 9);
            const col = index % 9;
            this.grid[row][col] = 0;
        }
        
        // Mark given numbers
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.given[i][j] = this.grid[i][j] !== 0;
            }
        }
    }

    generateCompleteSolution() {
        // Fill diagonal 3x3 boxes first
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
        
        // Fill remaining cells
        this.solveSudoku(this.solution);
    }

    fillBox(row, col) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(numbers);
        
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.solution[row + i][col + j] = numbers[index++];
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidMove(grid, row, col, num)) {
                            grid[row][col] = num;
                            
                            if (this.solveSudoku(grid)) {
                                return true;
                            }
                            
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValidMove(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }
        
        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) return false;
        }
        
        // Check 3x3 box
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) return false;
            }
        }
        
        return true;
    }

    selectCell(index) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        // Don't select given cells
        if (this.given[row][col]) return;
        
        this.selectedCell = { row, col, index };
        this.updateDisplay();
    }

    selectNumber(num) {
        this.selectedNumber = num;
        
        if (this.selectedCell) {
            if (this.notesMode) {
                this.toggleNote(this.selectedCell.row, this.selectedCell.col, num);
            } else {
                this.placeNumber(this.selectedCell.row, this.selectedCell.col, num);
            }
        }
        
        this.updateDisplay();
    }

    placeNumber(row, col, num) {
        // Save current state for undo
        this.moveHistory.push({
            row, col,
            oldValue: this.grid[row][col],
            newValue: num
        });
        
        this.grid[row][col] = num;
        
        // Check if move is correct
        if (num !== this.solution[row][col]) {
            this.mistakes++;
            this.updateGameInfo();
            
            if (this.mistakes >= this.maxMistakes) {
                this.gameOver();
                return;
            }
        }
        
        // Check if puzzle is completed
        if (this.isPuzzleComplete()) {
            this.gameWon();
        }
    }

    toggleNote(row, col, num) {
        // Note functionality would be implemented here
        // For simplicity, we'll skip notes in this basic version
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        this.grid[lastMove.row][lastMove.col] = lastMove.oldValue;
        
        // If undoing a mistake, reduce mistake count
        if (lastMove.newValue !== this.solution[lastMove.row][lastMove.col] && lastMove.newValue !== 0) {
            this.mistakes = Math.max(0, this.mistakes - 1);
        }
        
        this.updateDisplay();
        this.updateGameInfo();
    }

    eraseCell() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        if (this.given[row][col]) return;
        
        this.moveHistory.push({
            row, col,
            oldValue: this.grid[row][col],
            newValue: 0
        });
        
        this.grid[row][col] = 0;
        this.updateDisplay();
    }

    toggleNotes() {
        this.notesMode = !this.notesMode;
        const notesBtn = document.getElementById('notes-btn');
        notesBtn.classList.toggle('active', this.notesMode);
    }

    getHint() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        if (this.given[row][col] || this.grid[row][col] !== 0) return;
        
        const correctNumber = this.solution[row][col];
        this.placeNumber(row, col, correctNumber);
        this.updateDisplay();
    }

    isPuzzleComplete() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }
        return true;
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.sudoku-cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.grid[row][col];
            
            // Clear all classes
            cell.className = 'sudoku-cell';
            
            // Set cell content
            cell.textContent = value === 0 ? '' : value;
            
            // Add appropriate classes
            if (this.given[row][col]) {
                cell.classList.add('given');
            }
            
            if (this.selectedCell && this.selectedCell.index === index) {
                cell.classList.add('selected');
            }
            
            // Highlight related cells
            if (this.selectedCell) {
                const selectedRow = this.selectedCell.row;
                const selectedCol = this.selectedCell.col;
                
                if (row === selectedRow) cell.classList.add('highlight-row');
                if (col === selectedCol) cell.classList.add('highlight-col');
                
                // Highlight same 3x3 box
                const boxRow = Math.floor(selectedRow / 3) * 3;
                const boxCol = Math.floor(selectedCol / 3) * 3;
                const cellBoxRow = Math.floor(row / 3) * 3;
                const cellBoxCol = Math.floor(col / 3) * 3;
                
                if (boxRow === cellBoxRow && boxCol === cellBoxCol) {
                    cell.classList.add('highlight-box');
                }
                
                // Highlight same numbers
                if (value !== 0 && value === this.grid[selectedRow][selectedCol]) {
                    cell.classList.add('same-number');
                }
            }
            
            // Check for errors
            if (value !== 0 && value !== this.solution[row][col]) {
                cell.classList.add('error');
            }
        });
        
        // Update number keypad
        this.updateNumberKeypad();
    }

    updateNumberKeypad() {
        const numberBtns = document.querySelectorAll('.number-btn');
        
        numberBtns.forEach((btn, index) => {
            const num = index + 1;
            btn.classList.toggle('selected', this.selectedNumber === num);
            
            // Count occurrences of this number
            let count = 0;
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.grid[i][j] === num) count++;
                }
            }
            
            // Disable if number is used 9 times
            btn.disabled = count >= 9;
        });
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateGameInfo();
        }, 1000);
    }

    updateGameInfo() {
        // Update difficulty
        document.getElementById('current-difficulty').textContent = 
            this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        
        // Update mistakes
        document.getElementById('mistakes-count').textContent = 
            `${this.mistakes}/${this.maxMistakes}`;
        
        // Update timer
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('game-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    gameOver() {
        clearInterval(this.timerInterval);
        alert('Game Over! You made too many mistakes.');
    }

    gameWon() {
        clearInterval(this.timerInterval);
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        alert(`Congratulations! You solved the puzzle in ${minutes}:${seconds.toString().padStart(2, '0')}!`);
    }

    changeDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.newGame();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                this.selectNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.eraseCell();
            } else if (e.key === 'Escape') {
                this.selectedCell = null;
                this.updateDisplay();
            }
        });
    }
}

// Global game instance
let sudokuGame;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    sudokuGame = new SudokuGame();
    sudokuGame.init();
});

// Global functions for HTML event handlers
function newSudokuGame() {
    sudokuGame.newGame();
}

function changeDifficulty() {
    const difficultySelect = document.getElementById('difficulty');
    sudokuGame.changeDifficulty(difficultySelect.value);
}

function selectNumber(num) {
    sudokuGame.selectNumber(num);
}

function undoMove() {
    sudokuGame.undoMove();
}

function eraseCell() {
    sudokuGame.eraseCell();
}

function toggleNotes() {
    sudokuGame.toggleNotes();
}

function getHint() {
    sudokuGame.getHint();
} 