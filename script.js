const initialBoard = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

const pieceUnicode = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

let board = [];
let selected = null;
let turn = 'w';
let legalMoves = [];

function resetBoard() {
  board = initialBoard.map(row => row.slice());
  selected = null;
  turn = 'w';
  legalMoves = [];
  renderBoard();
  document.getElementById('message').textContent = '';
}

function renderBoard() {
  const chessboard = document.getElementById('chessboard');
  chessboard.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = 'square ' + ((row + col) % 2 === 0 ? 'white' : 'black');
      square.dataset.row = row;
      square.dataset.col = col;
      if (selected && selected[0] === row && selected[1] === col) {
        square.classList.add('selected');
      }
      // Highlight legal moves
      if (legalMoves.some(([r, c]) => r === row && c === col)) {
        square.classList.add('legal-move');
        // Add a dot for clarity
        const dot = document.createElement('div');
        dot.className = 'move-dot';
        square.appendChild(dot);
      }
      const piece = board[row][col];
      square.textContent = piece ? pieceUnicode[piece] : '';
      square.onclick = () => handleSquareClick(row, col);
      chessboard.appendChild(square);
    }
  }
}

function handleSquareClick(row, col) {
  const piece = board[row][col];
  if (selected) {
    // Try move
    const [fromRow, fromCol] = selected;
    if ((fromRow !== row || fromCol !== col) && isLegalMove(fromRow, fromCol, row, col)) {
      // Simulate move and check for king safety
      if (!moveLeavesKingInCheck(fromRow, fromCol, row, col)) {
        const movingPiece = board[fromRow][fromCol];
        board[row][col] = movingPiece;
        board[fromRow][fromCol] = '';
        // Pawn promotion
        if (movingPiece[1] === 'P' && (row === 0 || row === 7)) {
          board[row][col] = movingPiece[0] + 'Q';
        }
        turn = (turn === 'w') ? 'b' : 'w';
        selected = null;
        legalMoves = [];
        renderBoard();
        setTimeout(checkForCheckmate, 100);
        return;
      }
    }
    selected = null;
    legalMoves = [];
    renderBoard();
  } else {
    // Select if correct turn
    if (piece && piece[0] === turn) {
      selected = [row, col];
      legalMoves = getLegalMoves(row, col);
      renderBoard();
    }
  }
}

// Basic move legality for each piece
function isLegalMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  const color = piece[0];
  const type = piece[1];
  const target = board[toRow][toCol];
  if (target && target[0] === color) return false; // Can't capture own piece

  const dr = toRow - fromRow, dc = toCol - fromCol;

  switch(type) {
    case 'P': // Pawn
      if (color === 'w') {
        if (dc === 0 && dr === -1 && !target) return true;
        if (dc === 0 && dr === -2 && fromRow === 6 && !target && !board[5][fromCol]) return true;
        if (Math.abs(dc) === 1 && dr === -1 && target && target[0] === 'b') return true;
      } else {
        if (dc === 0 && dr === 1 && !target) return true;
        if (dc === 0 && dr === 2 && fromRow === 1 && !target && !board[2][fromCol]) return true;
        if (Math.abs(dc) === 1 && dr === 1 && target && target[0] === 'w') return true;
      }
      return false;
    case 'R': // Rook
      if (dr !== 0 && dc !== 0) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);
    case 'N': // Knight
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    case 'B': // Bishop
      if (Math.abs(dr) !== Math.abs(dc)) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);
    case 'Q': // Queen
      if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;
    case 'K': // King
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    default:
      return false;
  }
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  let r = fromRow + dr, c = fromCol + dc;
  while (r !== toRow || c !== toCol) {
    if (board[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
}

// Legal moves for a piece, not leaving own king in check
function getLegalMoves(row, col) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isLegalMove(row, col, r, c)) {
        if (!moveLeavesKingInCheck(row, col, r, c)) {
          moves.push([r, c]);
        }
      }
    }
  }
  return moves;
}

// Check/Checkmate helpers
function isInCheck(color) {
  const kingPos = findKing(color);
  if (!kingPos) return false;
  const [kRow, kCol] = kingPos;
  const enemy = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === enemy) {
        if (isLegalMove(r, c, kRow, kCol)) {
          // Make sure this move is not blocked by king safety
          if (!moveLeavesKingInCheck(r, c, kRow, kCol)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function findKing(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === color + 'K') return [r, c];
    }
  }
  return null;
}

function moveLeavesKingInCheck(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const target = board[toRow][toCol];
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = '';
  const inCheck = isInCheck(piece[0]);
  board[fromRow][fromCol] = piece;
  board[toRow][toCol] = target;
  return inCheck;
}

function hasLegalMoves(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        const moves = getLegalMoves(r, c);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

function checkForCheckmate() {
  const enemy = turn;
  if (isInCheck(enemy)) {
    if (!hasLegalMoves(enemy)) {
      document.getElementById('message').textContent = (enemy === 'w' ? 'White' : 'Black') + ' is checkmated!';
    } else {
      document.getElementById('message').textContent = (enemy === 'w' ? 'White' : 'Black') + ' is in check!';
    }
  } else if (!hasLegalMoves(enemy)) {
    document.getElementById('message').textContent = 'Stalemate!';
  } else {
    document.getElementById('message').textContent = '';
  }
}

// Initialize
window.onload = resetBoard;
