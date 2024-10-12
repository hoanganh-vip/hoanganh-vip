/*** CONSTANT ***/
const COLS = 10; // Số cột của bảng
const ROWS = 20; // Số hàng của bảng
const BLOCK_SIZE = 30; // Kích thước mỗi khối
const COLOR_MAPPING = [
  'red', 'orange', 'green', 'purple', 'blue', 'cyan', 'yellow', 'white'
]; // Mảng chứa màu sắc cho các khối

// Mô hình các khối Tetris
const BRICK_LAYOUT = [
  // Các khối khác nhau được định nghĩa ở đây
  [
    // Hình dạng 1
  ],
  // Hình dạng 2
  // ...
];

// Mã phím điều khiển
const KEY_CODES = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
};

const WHITE_COLOR_ID = 7; // ID màu trắng cho ô trống

const canvas = document.getElementById('board'); // Lấy thẻ canvas từ DOM
const ctx = canvas.getContext('2d'); // Lấy ngữ cảnh 2D cho canvas

ctx.canvas.width = COLS * BLOCK_SIZE; // Thiết lập chiều rộng cho canvas
ctx.canvas.height = ROWS * BLOCK_SIZE; // Thiết lập chiều cao cho canvas

// Lớp Board đại diện cho bảng trò chơi
class Board {
  constructor(ctx) {
    this.ctx = ctx; // Ngữ cảnh vẽ
    this.grid = this.generateWhiteBoard(); // Khởi tạo bảng trắng
    this.score = 0; // Điểm số
    this.gameOver = false; // Trạng thái trò chơi
    this.isPlaying = false; // Trạng thái đang chơi

    this.clearAudio = new Audio('../sounds/clear.wav'); // Âm thanh xóa hàng
  }

  reset() {
    // Đặt lại bảng
    this.score = 0;
    this.grid = this.generateWhiteBoard();
    this.gameOver = false;
    this.drawBoard();
  }

  generateWhiteBoard() {
    // Tạo bảng trắng
    return Array.from({ length: ROWS }, () => Array(COLS).fill(WHITE_COLOR_ID));
  }

  drawCell(xAxis, yAxis, colorId) {
    // Vẽ một ô trên bảng
    this.ctx.fillStyle = COLOR_MAPPING[colorId] || COLOR_MAPPING[WHITE_COLOR_ID];
    this.ctx.fillRect(xAxis * BLOCK_SIZE, yAxis * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    this.ctx.fillStyle = 'black';
    this.ctx.strokeRect(xAxis * BLOCK_SIZE, yAxis * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }

  drawBoard() {
    // Vẽ toàn bộ bảng
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[0].length; col++) {
        this.drawCell(col, row, this.grid[row][col]);
      }
    }
  }

  handleCompleteRows() {
    // Xử lý hàng hoàn thành
    const latestGrid = this.grid.filter((row) => {
      return row.some(col => col === WHITE_COLOR_ID);
    });

    const newScore = ROWS - latestGrid.length; // Tính điểm số mới
    const newRows = Array.from({ length: newScore }, () => Array(COLS).fill(WHITE_COLOR_ID));

    if (newScore) {
      this.grid = [...newRows, ...latestGrid]; // Thêm hàng mới
      this.handleScore(newScore * 10); // Cập nhật điểm số

      this.clearAudio.play(); // Phát âm thanh
      console.log({ latestGrid });
    }
  }

  handleScore(newScore) {
    // Cập nhật điểm số
    this.score += newScore;
    document.getElementById('score').innerHTML = this.score;
  }

  handleGameOver() {
    // Xử lý khi trò chơi kết thúc
    this.gameOver = true;
    this.isPlaying = false;
    alert('GAME OVER!!!');
  }
}

// Lớp Brick đại diện cho các khối Tetris
class Brick {
  constructor(id) {
    this.id = id; // ID của khối
    this.layout = BRICK_LAYOUT[id]; // Lấy mô hình cho khối
    this.activeIndex = 0; // Chỉ số hình dạng hiện tại
    this.colPos = 3; // Vị trí cột hiện tại
    this.rowPos = -2; // Vị trí hàng hiện tại
  }

  draw() {
    // Vẽ khối
    for (let row = 0; row < this.layout[this.activeIndex].length; row++) {
      for (let col = 0; col < this.layout[this.activeIndex][0].length; col++) {
        if (this.layout[this.activeIndex][row][col] !== WHITE_COLOR_ID) {
          board.drawCell(col + this.colPos, row + this.rowPos, this.id);
        }
      }
    }
  }

  clear() {
    // Xóa khối khỏi bảng
    for (let row = 0; row < this.layout[this.activeIndex].length; row++) {
      for (let col = 0; col < this.layout[this.activeIndex][0].length; col++) {
        if (this.layout[this.activeIndex][row][col] !== WHITE_COLOR_ID) {
          board.drawCell(col + this.colPos, row + this.rowPos, WHITE_COLOR_ID);
        }
      }
    }
  }

  moveLeft() {
    // Di chuyển khối sang trái
    if (!this.checkCollision(this.rowPos, this.colPos - 1, this.layout[this.activeIndex])) {
      this.clear();
      this.colPos--;
      this.draw();
    }
  }

  moveRight() {
    // Di chuyển khối sang phải
    if (!this.checkCollision(this.rowPos, this.colPos + 1, this.layout[this.activeIndex])) {
      this.clear();
      this.colPos++;
      this.draw();
    }
  }

  moveDown() {
    // Di chuyển khối xuống
    if (!this.checkCollision(this.rowPos + 1, this.colPos, this.layout[this.activeIndex])) {
      this.clear();
      this.rowPos++;
      this.draw();
      return;
    }

    this.handleLanded();
    generateNewBrick(); // Tạo khối mới
  }

  rotate() {
    // Xoay khối
    if (!this.checkCollision(this.rowPos, this.colPos, this.layout[(this.activeIndex + 1) % 4])) {
      this.clear();
      this.activeIndex = (this.activeIndex + 1) % 4;
      this.draw();
    }
  }

  checkCollision(nextRow, nextCol, nextLayout) {
    // Kiểm tra va chạm
    for (let row = 0; row < nextLayout.length; row++) {
      for (let col = 0; col < nextLayout[0].length; col++) {
        if (nextLayout[row][col] !== WHITE_COLOR_ID && nextRow >= 0) {
          if (
            col + nextCol < 0 ||
            col + nextCol >= COLS ||
            row + nextRow >= ROWS ||
            board.grid[row + nextRow][col + nextCol] !== WHITE_COLOR_ID
          ) {
            return true; // Có va chạm
          }
        }
      }
    }

    return false; // Không có va chạm
  }

  handleLanded() {
    // Xử lý khi khối chạm đất
    if (this.rowPos <= 0) {
      board.handleGameOver(); // Kết thúc trò chơi nếu khối chạm trên cùng
      return;
    }

    for (let row = 0; row < this.layout[this.activeIndex].length; row++) {
      for (let col = 0; col < this.layout[this.activeIndex][0].length; col++) {
        if (this.layout[this.activeIndex][row][col] !== WHITE_COLOR_ID) {
          board.grid[row + this.rowPos][col + this.colPos] = this.id; // Cập nhật bảng
        }
      }
    }

    board.handleCompleteRows(); // Xử lý hàng hoàn thành
    board.drawBoard(); // Vẽ lại bảng
  }
}

function generateNewBrick() {
  // Tạo một khối Tetris mới
  brick = new Brick(Math.floor(Math.random() * 10) % BRICK_LAYOUT.length);
}

board = new Board(ctx); // Khởi tạo bảng
board.drawBoard(); // Vẽ bảng

document.getElementById('play').addEventListener('click', () => {
  board.reset(); // Đặt lại bảng khi bắt đầu chơi

  board.isPlaying = true; // Bắt đầu trò chơi
  
  generateNewBrick(); // Tạo khối mới

  const refresh = setInterval(() => {
    if (!board.gameOver) {
      brick.moveDown(); // Di chuyển khối xuống mỗi giây
    } else {
      clearInterval(refresh); // Dừng nếu trò chơi kết thúc
    }
  }, 1000);
});

// Lắng nghe sự kiện bàn phím để điều khiển khối
document.addEventListener('keydown', (e) => {
  if (!board.gameOver && board.isPlaying) {
    switch (e.code) {
      case KEY_CODES.LEFT:
        brick.move
